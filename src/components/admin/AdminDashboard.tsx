import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, CreditCard, Store, Play, Plus, Search, MoreHorizontal, 
  LogOut, User, Ticket, LayoutDashboard, Edit, Trash2, X, Upload,
  Loader2, PlayCircle, Settings, Save, MessageSquare, MapPin, ExternalLink,
  Navigation as NavigationIcon, Bell, Check, DollarSign, Calendar, Info, Music, Compass,
  Clock, Image as ImageIcon, PlusCircle, Waves
} from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import VideoPlayer from '@/components/common/VideoPlayer';
import StoryViewer from '@/components/turista/StoryViewer';
import { getYouTubeInfo } from '@/lib/video-utils';
import AdminLayout from '@/components/layout/AdminLayout';
import BannerManagement from './BannerManagement';
import TidesDataManagement from './TidesDataManagement';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose 
} from '@/components/ui/dialog';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Partner, Coupon, Category, Video, RoteiroVIP, EventoVIP } from '@/types';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';

// Fix for default marker icon in Leaflet + Vite
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Component to handle map resizing and invalidation
const MapResizeHandler = () => {
  const map = useMap();
  
  useEffect(() => {
    // Initial invalidation after a small delay to ensure container is fully rendered
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 400);

    // Handle window resize events
    const handleResize = () => {
      map.invalidateSize();
    };

    window.addEventListener('resize', handleResize);

    // Use ResizeObserver for more robust tracking of container changes
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });

    const container = map.getContainer();
    if (container) {
      observer.observe(container);
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [map]);

  return null;
};

// Search control for the map
const SearchField = ({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) => {
  const map = useMap();
  
  useEffect(() => {
    const provider = new OpenStreetMapProvider();
    const searchControl = new (GeoSearchControl as any)({
      provider,
      style: 'bar',
      showMarker: false,
      showPopup: false,
      autoClose: true,
      retainZoomLevel: false,
      animateZoom: true,
      searchLabel: 'Buscar cidade ou praia...',
      keepResult: true
    });

    map.addControl(searchControl);
    
    map.on('geosearch/showlocation', (result: any) => {
      onLocationSelect(result.location.y, result.location.x);
    });

    return () => {
      map.removeControl(searchControl);
    };
  }, [map, onLocationSelect]);

  return null;
};

// Helper component to handle clicks on the admin mini-map
const LocationPicker = ({ onLocationSelect, position }: { 
  onLocationSelect: (lat: number, lng: number) => void,
  position?: [number, number]
}) => {
  const map = useMap();
  
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  useEffect(() => {
    if (position) {
      map.flyTo(position, 15);
    }
  }, [position, map]);

  return position ? <Marker position={position} /> : null;
};

const AdminDashboard: React.FC = () => {
  const { 
    partners, addPartner, updatePartner, deletePartner,
    coupons, allCoupons, addCoupon, updateCoupon, deleteCoupon,
    videos, addVideo, updateVideo, deleteVideo,
    isLoading, vipConfig, updateVipConfig,
    generalConfig, updateGeneralConfig,
    financialConfig, updateFinancialConfig,
    notifications, markNotificationAsRead, markAllNotificationsAsRead, 
    deleteAllNotifications, deleteVideoComment,
    roteirosVip, addRoteiroVip, updateRoteiroVip, deleteRoteiroVip,
    eventosVip, addEventoVip, updateEventoVip, deleteEventoVip,
    appSettings, updateAppSettings
  } = useApp();
  const { user, logout, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const galleryFileInputRef = React.useRef<HTMLInputElement>(null);
  const videoFileInputRef = React.useRef<HTMLInputElement>(null);
  const videoThumbnailRef = React.useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [uploadModes, setUploadModes] = useState({
    partner: 'file' as 'file' | 'link',
    video: 'file' as 'file' | 'link',
    roteiro: 'file' as 'file' | 'link',
    evento: 'file' as 'file' | 'link',
    thumbnail: 'file' as 'file' | 'link',
    hero: 'file' as 'file' | 'link'
  });
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isRoteiroModalOpen, setIsRoteiroModalOpen] = useState(false);
  const [isEventoModalOpen, setIsEventoModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [editingRoteiro, setEditingRoteiro] = useState<RoteiroVIP | null>(null);
  const [editingEvento, setEditingEvento] = useState<EventoVIP | null>(null);
  const [selectedVideoForPreview, setSelectedVideoForPreview] = useState<Video | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [shouldOpenComments, setShouldOpenComments] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAdminCreating, setIsAdminCreating] = useState(false);
  const [adminForm, setAdminForm] = useState({
    email: '',
    password: '',
    name: ''
  });

  // New states for real-time stats and users
  const [userCount, setUserCount] = useState<number | null>(null);
  const [vipCount, setVipCount] = useState<number | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [isProfilesLoading, setIsProfilesLoading] = useState(false);
  const [userFilter, setUserFilter] = useState<'all' | 'premium'>('all');
  
  // Financial stats state
  const [financialStats, setFinancialStats] = useState({
    activeVips: 0,
    expiringSoon: 0,
    totalBilling: 0,
    recentPayments: [] as any[]
  });
  const [isFinancialLoading, setIsFinancialLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [profilesError, setProfilesError] = useState<string | null>(null);
  const [financialError, setFinancialError] = useState<string | null>(null);


  const unreadCount = notifications.filter(n => !n.read).length;


  const fetchRealStats = async () => {
    setIsStatsLoading(true);
    setStatsError(null);
    try {
      const [
        { count: totalUsers, error: usersError },
        { count: totalVip, error: vipError }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_premium', true)
      ]);

      if (usersError) throw usersError;
      if (vipError) throw vipError;

      setUserCount(totalUsers);
      setVipCount(totalVip);
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      setStatsError(error.message || "Erro ao carregar estatísticas");
    } finally {
      setIsStatsLoading(false);
    }
  };

  const fetchProfiles = async () => {
    setIsProfilesLoading(true);
    setProfilesError(null);
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setAllProfiles(data || []);
    } catch (error: any) {
      console.error('Error fetching profiles:', error);
      setProfilesError(error.message || "Erro ao carregar lista de usuários");
      toast.error("Erro ao carregar lista de usuários");
    } finally {
      setIsProfilesLoading(false);
    }
  };


  const fetchFinancialData = async () => {
    setIsFinancialLoading(true);
    setFinancialError(null);
    try {
      // 1. Total Active VIPs
      const { count: activeVips, error: vipsError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_premium', true);

      if (vipsError) throw vipsError;

      // 2. Expiring in next 5 days
      const fiveDaysFromNow = new Date();
      fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);
      
      const { count: expiringSoon, error: expiringError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_premium', true)
        .lte('premium_expiry_date', fiveDaysFromNow.toISOString())
        .gte('premium_expiry_date', new Date().toISOString());

      if (expiringError) throw expiringError;

      // 3. Total Billing History from payment_history
      const { data: payments, error: paymentsError } = await supabase
        .from('payment_history')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (paymentsError) {
        console.error('Error fetching payment history:', paymentsError);
        // Fallback to empty if table doesn't exist yet or has error
        setFinancialStats(prev => ({ ...prev, recentPayments: [] }));
      } else {
        const totalBilling = payments?.reduce((acc, p) => acc + Number(p.amount), 0) || 0;

        setFinancialStats({
          activeVips: activeVips || 0,
          expiringSoon: expiringSoon || 0,
          totalBilling,
          recentPayments: payments || []
        });
      }
    } catch (error: any) {
      console.error('Error fetching financial data:', error);
      setFinancialError(error.message || "Erro ao carregar dados financeiros. Verifique se a tabela de pagamentos existe.");
      toast.error("Erro ao carregar dados financeiros");
    } finally {
      setIsFinancialLoading(false);
    }
  };


  useEffect(() => {
    fetchRealStats();
    
    if (activeTab === 'financial') {
      fetchFinancialData();
    }

    // Subscribe to profiles real-time changes
    const channel = supabase
      .channel('admin-profiles-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          console.log("[Admin] Profiles changed, updating stats...");
          fetchRealStats();
          if (activeTab === 'users') {
            fetchProfiles();
          }
          if (activeTab === 'financial') {
            fetchFinancialData();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'notifications') {
      // Use a ref or a simple local state to prevent loop if markAllNotificationsAsRead triggers a re-render
      if (unreadCount > 0) {
        console.log("[Admin] Marking all as read upon entering tab");
        markAllNotificationsAsRead();
      }
    }
  }, [activeTab]); // Only run when tab changes

  // Separate effect for refreshProfile to avoid loops
  useEffect(() => {
    if (activeTab === 'notifications') {
      refreshProfile();
    }
  }, [activeTab, refreshProfile]);

  useEffect(() => {
    if (activeTab === 'users' && allProfiles.length === 0) {
      fetchProfiles();
    }
  }, [activeTab]);

  const handleStatClick = (tab: string, filter?: 'premium') => {
    setActiveTab(tab);
    if (filter) {
      setUserFilter(filter);
    } else {
      setUserFilter('all');
    }
  };

  // Stats for the dashboard
  const stats = [
    { 
      label: 'Total Usuários', 
      value: statsError ? 'Erro' : (userCount !== null ? userCount.toLocaleString() : '...'), 
      icon: Users, 
      color: 'bg-blue-500',
      loading: isStatsLoading && userCount === null,
      tab: 'users',
      error: statsError
    },
    { 
      label: 'Assinantes VIP', 
      value: statsError ? 'Erro' : (vipCount !== null ? vipCount.toLocaleString() : '...'), 
      icon: CreditCard, 
      color: 'bg-purple-500',
      loading: isStatsLoading && vipCount === null,
      tab: 'users',
      filter: 'premium' as const,
      error: statsError
    },
    { 
      label: 'Parceiros', 
      value: partners.length.toString(), 
      icon: Store, 
      color: 'bg-orange-500',
      loading: isLoading,
      tab: 'partners'
    },
    { 
      label: 'Vídeos/Reels', 
      value: videos.length.toString(), 
      icon: Play, 
      color: 'bg-green-500',
      loading: isLoading,
      tab: 'videos'
    },
  ];


  // Partner Form State
  const [partnerForm, setPartnerForm] = useState<Partial<Partner>>({
    name: '',
    category: 'Praias',
    location: '',
    description: '',
    isPremium: false,
    image: 'https://images.unsplash.com/photo-1540202404-a2f29016bb5d?auto=format&fit=crop&w=800&q=80',
    rating: 5.0,
    whatsapp: '',
    images: [],
    latitude: undefined,
    longitude: undefined,
    google_maps_link: '',
    price: '',
    nightlife_type: 'Bar',
    operating_hours: '',
    reservation_options: [],
    show_reservation_button: false
  });

  // Coupon Form State
  const [couponForm, setCouponForm] = useState<Partial<Coupon>>({
    title: '',
    discount: '',
    partnerId: '',
    isPremium: false,
    validUntil: new Date().toISOString().split('T')[0],
    code: '',
    status: 'active'
  });

  const [videoForm, setVideoForm] = useState<Partial<Video>>({
    title: '',
    description: '',
    url: '',
    thumbnail: '',
    partnerId: '',
    category: 'Praias',
    isPremium: false
  });
  
  const [roteiroForm, setRoteiroForm] = useState<Partial<RoteiroVIP>>({
    titulo: '',
    subtitulo: '',
    descricao_completa: '',
    icone_url: '',
    image_url: '',
    localizacao_nome: '',
    google_maps_link: '',
    passos: []
  });

  const [eventoForm, setEventoForm] = useState<Partial<EventoVIP>>({
    titulo: '',
    data_categoria: new Date().toISOString().slice(0, 16),
    descricao_completa: '',
    icone_url: '',
    localizacao_nome: '',
    google_maps_link: ''
  });
  

  // Effect to automatically set YouTube thumbnail
  useEffect(() => {
    if (videoForm.url) {
      const { id } = getYouTubeInfo(videoForm.url);
      if (id && (!videoForm.thumbnail || videoForm.thumbnail.includes('unsplash.com'))) {
        setVideoForm(prev => ({ 
          ...prev, 
          thumbnail: `https://img.youtube.com/vi/${id}/maxresdefault.jpg` 
        }));
      }
    }
  }, [videoForm.url]);

  // Effect to extract coordinates from Google Maps link
  useEffect(() => {
    const link = partnerForm.google_maps_link;
    if (!link) return;

    // Enhanced regex patterns for various Google Maps link formats
    const patterns = [
      /@(-?\d+\.\d+),(-?\d+\.\d+)/,               // @lat,lng (common in browser URL)
      /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,           // !3dlat!4dlng (common in share links)
      /ll=(-?\d+\.\d+),(-?\d+\.\d+)/,             // ll=lat,lng
      /q=(-?\d+\.\d+),(-?\d+\.\d+)/,              // q=lat,lng
      /query=(-?\d+\.\d+),(-?\d+\.\d+)/,          // query=lat,lng
      /place\/(-?\d+\.\d+),(-?\d+\.\d+)/          // place/lat,lng
    ];

    let extractedCoords = null;
    for (const pattern of patterns) {
      const match = link.match(pattern);
      if (match && match[1] && match[2]) {
        extractedCoords = {
          lat: parseFloat(match[1]),
          lng: parseFloat(match[2])
        };
        break;
      }
    }

    if (extractedCoords) {
      const { lat, lng } = extractedCoords;
      // Only update if they are different to avoid infinite loop
      if (lat !== partnerForm.latitude || lng !== partnerForm.longitude) {
        setPartnerForm(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng
        }));
        toast.success("Coordenadas extraídas do link e mapa atualizado!");
      }
    }
  }, [partnerForm.google_maps_link, partnerForm.latitude, partnerForm.longitude]);

  const handleOpenPartnerModal = (partner?: Partner) => {
    if (partner) {
      setEditingPartner(partner);
      
      // Ensure WhatsApp has the prefix if it's just a number
      let whatsappValue = partner.whatsapp || '';
      if (whatsappValue && !whatsappValue.startsWith('http') && /^\d+$/.test(whatsappValue)) {
        whatsappValue = `https://wa.me/${whatsappValue}`;
      } else if (!whatsappValue) {
        whatsappValue = 'https://wa.me/';
      }

      setPartnerForm({
        ...partner,
        whatsapp: whatsappValue,
        google_maps_link: partner.google_maps_link || '',
        price: partner.price || '',
        reservation_options: partner.reservation_options || [],
        show_reservation_button: partner.show_reservation_button || false,
        images: partner.images || [partner.image]
      });
    } else {
      setEditingPartner(null);
      setPartnerForm({
        name: '',
        category: 'Praias',
        location: '',
        description: '',
        isPremium: false,
        image: 'https://images.unsplash.com/photo-1540202404-a2f29016bb5d?auto=format&fit=crop&w=800&q=80',
        rating: 5.0,
        whatsapp: 'https://wa.me/',
        images: ['https://images.unsplash.com/photo-1540202404-a2f29016bb5d?auto=format&fit=crop&w=800&q=80'],
        latitude: undefined,
        longitude: undefined,
        google_maps_link: '',
        price: '',
        
        reservation_options: [],
        show_reservation_button: false
      });
    }
    setIsPartnerModalOpen(true);
  };

  const handleOpenCouponModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setCouponForm({
        ...coupon,
        validUntil: coupon.validUntil ? new Date(coupon.validUntil).toISOString().split('T')[0] : ''
      });
    } else {
      setEditingCoupon(null);
      setCouponForm({
        title: '',
        discount: '',
        partnerId: partners[0]?.id || '',
        isPremium: false,
        validUntil: new Date().toISOString().split('T')[0],
        code: '',
        status: 'active'
      });
    }
    setIsCouponModalOpen(true);
  };

  const handleOpenVideoModal = (video?: Video) => {
    if (video) {
      setEditingVideo(video);
      setVideoForm(video);
    } else {
      setEditingVideo(null);
      setVideoForm({
        title: '',
        description: '',
        url: '',
        thumbnail: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80',
        partnerId: partners[0]?.id || '',
        category: 'Praias',
        isPremium: false
      });
    }
    setIsVideoModalOpen(true);
  };

  const handleOpenRoteiroModal = (roteiro?: RoteiroVIP) => {
    if (roteiro) {
      setEditingRoteiro(roteiro);
      setRoteiroForm(roteiro);
    } else {
      setEditingRoteiro(null);
      setRoteiroForm({
        titulo: '',
        subtitulo: '',
        descricao_completa: '',
        icone_url: '',
        image_url: '',
        localizacao_nome: '',
        google_maps_link: '',
        passos: []
      });
    }
    setIsRoteiroModalOpen(true);
  };

  const handleOpenEventoModal = (evento?: EventoVIP) => {
    if (evento) {
      setEditingEvento(evento);
      setEventoForm(evento);
    } else {
      setEditingEvento(null);
      setEventoForm({
        titulo: '',
        data_categoria: new Date().toISOString().slice(0, 16),
        descricao_completa: '',
        icone_url: '',
        localizacao_nome: '',
        google_maps_link: ''
      });
    }
    setIsEventoModalOpen(true);
  };


  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error } = await supabase.storage
          .from('partners')
          .upload(filePath, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('partners')
          .getPublicUrl(filePath);

        setPartnerForm({ ...partnerForm, image: publicUrl });
        toast.success('Imagem carregada!');
      } catch (error) {
        console.error('Error uploading image:', error);
        toast.error('Erro ao carregar imagem');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleGalleryFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsUploading(true);
      try {
        const newUrls: string[] = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
          const filePath = `${fileName}`;

          const { error } = await supabase.storage
            .from('partners')
            .upload(filePath, file);

          if (error) throw error;

          const { data: { publicUrl } } = supabase.storage
            .from('partners')
            .getPublicUrl(filePath);
          
          newUrls.push(publicUrl);
        }

        setPartnerForm({ 
          ...partnerForm, 
          images: [...(partnerForm.images || []), ...newUrls] 
        });
        toast.success(`${files.length} imagem(ns) carregada(s)!`);
      } catch (error) {
        console.error('Error uploading gallery images:', error);
        toast.error('Erro ao carregar imagens da galeria');
      } finally {
        setIsUploading(false);
        if (galleryFileInputRef.current) {
          galleryFileInputRef.current.value = '';
        }
      }
    }
  };

  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { data, error } = await supabase.storage
          .from('videos')
          .upload(filePath, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('videos')
          .getPublicUrl(filePath);

        setVideoForm({ ...videoForm, url: publicUrl });
        toast.success('Vídeo enviado com sucesso!');
      } catch (error: any) {
        console.error('Error uploading video:', error);
        toast.error(`Erro ao enviar vídeo: ${error.message}`);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleThumbnailFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { data, error } = await supabase.storage
          .from('videos') // Using videos bucket for thumbnails too
          .upload(filePath, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('videos')
          .getPublicUrl(filePath);

        setVideoForm({ ...videoForm, thumbnail: publicUrl });
        toast.success('Miniatura enviada!');
      } catch (error: any) {
        console.error('Error uploading thumbnail:', error);
        toast.error('Erro ao enviar miniatura');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdminCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-admin', {
        body: adminForm
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Novo administrador criado com sucesso!");
      setIsAdminModalOpen(false);
      setAdminForm({ email: '', password: '', name: '' });
      fetchProfiles();
    } catch (error: any) {
      console.error('Error creating admin:', error);
      toast.error("Erro ao criar administrador: " + error.message);
    } finally {
      setIsAdminCreating(false);
    }
  };

  const handleSavePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validateWhatsApp = (val: string) => {
      if (!val) return true;
      // Should start with prefix and have at least 10 more chars (country code + number)
      return val.startsWith('https://wa.me/') && val.length > 20;
    };


    const validateMaps = (val: string) => {
      if (!val) return true;
      return val.startsWith('https://') && val.length > 15;
    };

    if (partnerForm.whatsapp && !validateWhatsApp(partnerForm.whatsapp)) {
      toast.error("O número do WhatsApp parece incompleto. Use o formato DDD + Número.");
      return;
    }


    if (partnerForm.google_maps_link && !validateMaps(partnerForm.google_maps_link)) {
      toast.error("O link de localização deve ser uma URL válida começando com https://");
      return;
    }

    if (editingPartner) {
      await updatePartner({ ...editingPartner, ...partnerForm } as Partner);
    } else {
      await addPartner({ 
        ...partnerForm, 
        images: partnerForm.images || [partnerForm.image || '']
      } as Omit<Partner, 'id'>);
    }
    setIsPartnerModalOpen(false);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...couponForm };
      console.log("Dados sendo enviados para o banco (AppContext via AdminDashboard):", {
        editingCouponId: editingCoupon?.id,
        payload
      });

      if (editingCoupon) {
        await updateCoupon({ ...editingCoupon, ...payload } as Coupon);
      } else {
        await addCoupon({ 
          ...payload, 
        } as Omit<Coupon, 'id'>);
      }
      setIsCouponModalOpen(false);
      setCouponForm({
        title: '',
        discount: '',
        partnerId: '',
        isPremium: false,
        validUntil: new Date().toISOString().split('T')[0],
        code: '',
        status: 'active'
      });
    } catch (error: any) {
      console.error('Error saving coupon:', error);
      toast.error('Erro ao salvar cupom: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingVideo) {
        await updateVideo({ ...editingVideo, ...videoForm } as Video);
      } else {
        await addVideo({ 
          ...videoForm, 
        } as any);
      }
      setIsVideoModalOpen(false);
      // Reset video form
      setVideoForm({
        title: '',
        description: '',
        url: '',
        thumbnail: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80',
        partnerId: partners[0]?.id || '',
        category: 'Praias',
        isPremium: false
      });
    } catch (error: any) {
      console.error('Error saving video:', error);
      toast.error('Erro ao salvar vídeo: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const handleSaveRoteiro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRoteiro) {
      await updateRoteiroVip({ ...editingRoteiro, ...roteiroForm } as RoteiroVIP);
    } else {
      await addRoteiroVip(roteiroForm as Omit<RoteiroVIP, 'id'>);
    }
    setIsRoteiroModalOpen(false);
  };

  const handleSaveEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEvento) {
      await updateEventoVip({ ...editingEvento, ...eventoForm } as EventoVIP);
    } else {
      await addEventoVip(eventoForm as Omit<EventoVIP, 'id'>);
    }
    setIsEventoModalOpen(false);
  };




  const handleDeleteVideoClick = (id: string) => {
    deleteVideo(id);
    toast.error('Vídeo removido.');
  };

  const handleDeletePartnerClick = (id: string) => {
    deletePartner(id);
    toast.error('Parceiro removido.');
  };

  const handleDeleteCouponClick = (id: string) => {
    deleteCoupon(id);
    toast.error('Cupom removido.');
  };

  const handleDeleteRoteiroClick = (id: string) => {
    if (window.confirm("Deseja realmente excluir este roteiro?")) {
      deleteRoteiroVip(id);
    }
  };

  const handleDeleteEventoClick = (id: string) => {
    if (window.confirm("Deseja realmente excluir este evento?")) {
      deleteEventoVip(id);
    }
  };

  const [vipSettingsForm, setVipSettingsForm] = useState({
    preco_anual: '',
    vip_plan_duration_months: 1
  });

  useEffect(() => {
    if (vipConfig) {
      setVipSettingsForm({
        preco_anual: vipConfig.preco_anual,
        vip_plan_duration_months: vipConfig.vip_plan_duration_months || 1
      });
    }
  }, [vipConfig]);

  const [financialSettingsForm, setFinancialSettingsForm] = useState({
    vip_price: '29.90',
    vip_price_annual: '299.00',
    max_parcelas_mensal: '1',
    max_parcelas_anual: '12'
  });

  useEffect(() => {
    if (financialConfig) {
      setFinancialSettingsForm(prev => {
        // Só atualiza o form se houver mudança REAL nos dados vindo do context
        // Isso evita que o cursor pule ou que o valor digite resete durante o salvamento
        const newPrice = financialConfig.vip_price.toString();
        const newAnnualPrice = financialConfig.vip_price_annual?.toString() || '299.00';
        const newMaxMensal = financialConfig.max_parcelas_mensal?.toString() || '1';
        const newMaxAnual = financialConfig.max_parcelas_anual?.toString() || '12';

        if (prev.vip_price !== newPrice || 
            prev.vip_price_annual !== newAnnualPrice ||
            prev.max_parcelas_mensal !== newMaxMensal ||
            prev.max_parcelas_anual !== newMaxAnual) {
          return {
            vip_price: newPrice,
            vip_price_annual: newAnnualPrice,
            max_parcelas_mensal: newMaxMensal,
            max_parcelas_anual: newMaxAnual
          };
        }
        return prev;
      });
    }
  }, [financialConfig]);

  const handleSaveVipSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      // 1. Executa as atualizações no banco
      const results = await Promise.all([
        updateVipConfig({
          preco_anual: financialSettingsForm.vip_price_annual,
          vip_plan_duration_months: vipSettingsForm.vip_plan_duration_months
        }),
        updateFinancialConfig({
          vip_price: Number(financialSettingsForm.vip_price),
          vip_price_annual: Number(financialSettingsForm.vip_price_annual),
          max_parcelas_mensal: Number(financialSettingsForm.max_parcelas_mensal),
          max_parcelas_anual: Number(financialSettingsForm.max_parcelas_anual)
        })
      ]);

      // 2. O context (AppContext) já chama fetchData() dentro de updateVipConfig/updateFinancialConfig.
      // 3. O useEffect baseado em vipConfig/financialConfig deve reagir automaticamente.
      
      toast.success("Configurações atualizadas com sucesso");
    } catch (error) {
      console.error("Erro ao salvar configurações VIP:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setIsUploading(false);
    }
  };

  const [generalSettingsForm, setGeneralSettingsForm] = useState({
    whatsapp_link: 'https://wa.me/'
  });

  useEffect(() => {
    if (generalConfig) {
      let whatsappValue = generalConfig.whatsapp_link || '';
      if (whatsappValue && !whatsappValue.startsWith('http') && /^\d+$/.test(whatsappValue)) {
        whatsappValue = `https://wa.me/${whatsappValue}`;
      } else if (!whatsappValue) {
        whatsappValue = 'https://wa.me/';
      }
      setGeneralSettingsForm({
        whatsapp_link: whatsappValue
      });
    }
  }, [generalConfig]);

  const handleSaveGeneralSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateGeneralConfig(generalSettingsForm);
  };

  const [appSettingsForm, setAppSettingsForm] = useState({
    hero_bg_image: '',
    hero_gradient_intensity: 80,
    hero_title: '',
    hero_subtitle: '',
    tide_release_time: '00:00',
    tide_open_time: '00:00',
    tide_close_time: '23:59'
  });

  useEffect(() => {
    if (appSettings) {
      setAppSettingsForm({
        hero_bg_image: appSettings.hero_bg_image || '',
        hero_gradient_intensity: appSettings.hero_gradient_intensity || 80,
        hero_title: appSettings.hero_title || '',
        hero_subtitle: appSettings.hero_subtitle || '',
        tide_release_time: appSettings.tide_release_time || '00:00',
        tide_open_time: appSettings.tide_open_time || '00:00',
        tide_close_time: appSettings.tide_close_time || '23:59'
      });
    }
  }, [appSettings]);



  const renderDashboard = () => (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-black text-ocean tracking-tight">Painel de Gestão</h1>
          <div className="flex items-center gap-3 mt-1.5">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-gray-100 shadow-sm shrink-0">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                <div className="w-full h-full bg-ocean/5 flex items-center justify-center text-ocean text-[10px] font-black">
                  {user?.name?.[0] || 'A'}
                </div>
              )}
            </div>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-vibrant-green rounded-full animate-pulse" />
              Olá, {user?.name || 'Administrador'}. O sistema está atualizado.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <button 
            onClick={() => setIsAdminModalOpen(true)}
            className="flex-1 md:flex-none bg-ocean text-white font-black px-6 py-4 rounded-2xl shadow-xl shadow-ocean/10 flex items-center justify-center gap-2 hover:bg-ocean-deep hover:-translate-y-0.5 transition-all active:scale-95"
          >
            <Users size={18} />
            Novo Administrador
          </button>
          <button 
            onClick={() => handleOpenPartnerModal()}
            className="flex-1 md:flex-none bg-vibrant-green text-white font-bold px-6 py-4 rounded-2xl shadow-xl shadow-vibrant-green/20 flex items-center justify-center gap-2 hover:bg-[#1eb054] hover:-translate-y-0.5 transition-all active:scale-95"
          >
            <Plus size={18} />
            Novo Parceiro
          </button>
          <button 
            onClick={() => { logout(); navigate({ to: '/login' }); }}
            className="flex-1 md:flex-none bg-white text-gray-500 font-bold px-6 py-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center gap-2 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all active:scale-95"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, i) => (
          <div 
            key={i} 
            onClick={() => handleStatClick(stat.tab, stat.filter)}
            className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
          >
            <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-gray-100`}>
              <stat.icon size={22} />
            </div>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
            <div className="flex items-center gap-2">
              <h3 className={`text-3xl font-black tracking-tighter ${stat.error ? 'text-red-500' : 'text-ocean'}`}>{stat.value}</h3>
              {stat.loading && (
                <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
              )}
              {stat.error && (
                <Info size={14} className="text-red-400" />
              )}
            </div>

          </div>
        ))}
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h3 className="font-black text-xl text-ocean">Parceiros Recentes</h3>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input type="text" placeholder="Pesquisar..." className="bg-gray-50/50 border border-gray-100 rounded-xl py-2.5 pl-11 pr-4 text-sm w-full focus:ring-2 focus:ring-ocean/5 outline-none transition-all" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px] border-separate border-spacing-0">
              <thead>
                <tr className="bg-gray-50/20">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">Nome</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">Categoria</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {partners.slice(0, 5).map((partner) => (
                  <tr key={partner.id} className="hover:bg-gray-50/30 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <img src={partner.image} className="w-12 h-12 rounded-xl object-cover shadow-sm ring-4 ring-gray-50" />
                        <span className="font-bold text-gray-700">{partner.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs font-black text-gray-400 uppercase tracking-tight">{partner.category}</span>
                    </td>
                    <td className="px-8 py-6">
                      {partner.isPremium ? (
                        <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider">Premium</span>
                      ) : (
                        <span className="bg-gray-50 text-gray-400 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider">Grátis</span>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:text-ocean hover:bg-gray-100 transition-all">
                            <MoreHorizontal size={20} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-2xl shadow-2xl border-gray-100 p-2">
                          <DropdownMenuItem onClick={() => handleOpenPartnerModal(partner)} className="gap-2 cursor-pointer font-bold py-3 rounded-xl">
                            <Edit size={16} /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeletePartnerClick(partner.id)} className="gap-2 cursor-pointer font-bold py-3 text-red-500 focus:text-red-500 rounded-xl">
                            <Trash2 size={16} /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-8 flex flex-col">
          <h3 className="font-black text-xl text-ocean mb-8">Cupons Ativos</h3>
          <div className="space-y-4 flex-1">
            {coupons.slice(0, 4).map((coupon) => (
              <div key={coupon.id} className="p-6 bg-gray-50/30 border border-gray-50 rounded-2xl flex items-center justify-between hover:border-vibrant-green/30 transition-all group">
                <div>
                  <h4 className="font-bold text-ocean text-sm leading-tight mb-1">{coupon.title}</h4>
                  <p className="text-[10px] text-vibrant-green font-black uppercase tracking-widest">{coupon.discount} de desconto</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-ocean hover:shadow-md transition-all">
                      <MoreHorizontal size={18} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-2xl shadow-2xl border-gray-100 p-2">
                    <DropdownMenuItem onClick={() => handleOpenCouponModal(coupon)} className="gap-2 cursor-pointer font-bold py-3 rounded-xl">
                      <Edit size={16} /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDeleteCouponClick(coupon.id)} className="gap-2 cursor-pointer font-bold py-3 text-red-500 focus:text-red-500 rounded-xl">
                      <Trash2 size={16} /> Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
          <button 
            onClick={() => handleOpenCouponModal()}
            className="w-full mt-8 py-5 border-2 border-dashed border-gray-100 rounded-2xl text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] hover:border-vibrant-green/50 hover:text-vibrant-green hover:bg-vibrant-green/5 transition-all"
          >
            + Criar Novo Cupom
          </button>
        </div>
      </div>
    </>
  );


  const renderPartners = () => (
    <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h3 className="font-black text-2xl text-ocean tracking-tight">Gerenciar Parceiros</h3>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
            <Store size={14} className="text-vibrant-green" />
            Controle total de estabelecimentos cadastrados no ecossistema.
          </p>
        </div>
        <button 
          onClick={() => handleOpenPartnerModal()}
          className="bg-vibrant-green text-white font-bold px-6 py-4 rounded-2xl shadow-xl shadow-vibrant-green/20 flex items-center justify-center gap-2 hover:bg-[#1eb054] hover:-translate-y-0.5 transition-all active:scale-95"
        >
          <Plus size={18} />
          Novo Parceiro
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[800px] border-separate border-spacing-0">
          <thead>
            <tr className="bg-gray-50/20">
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">Parceiro</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">Categoria</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">Preço</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">Localização</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 text-center">Tipo</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {partners.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-8 py-24 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-200">
                    <Store size={64} className="mb-6 opacity-10" />
                    <p className="font-bold uppercase text-[10px] tracking-widest">Nenhum parceiro cadastrado ainda.</p>
                    <button 
                      onClick={() => handleOpenPartnerModal()}
                      className="mt-6 text-ocean font-black text-xs underline"
                    >
                      Cadastrar primeiro parceiro
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              partners.map((partner) => (
                <tr key={partner.id} className="hover:bg-gray-50/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <img src={partner.image} className="w-14 h-14 rounded-2xl object-cover shadow-sm ring-4 ring-gray-50" />
                      <div>
                        <span className="font-bold text-ocean block leading-tight mb-1">{partner.name}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-amber-500 font-black">★ {partner.rating.toFixed(1)}</span>
                          <span className="text-[10px] text-gray-300 font-bold uppercase tracking-tight">• {partner.totalReviews} avaliações</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{partner.category}</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-xs font-black text-ocean">{partner.price || '--'}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <MapPin size={14} className="text-gray-300" />
                      <span className="truncate max-w-[150px]">{partner.location}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    {partner.isPremium ? (
                      <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider">Premium</span>
                    ) : (
                      <span className="bg-gray-50 text-gray-400 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider">Grátis</span>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={() => handleOpenPartnerModal(partner)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:text-ocean hover:bg-gray-100 transition-all shadow-sm bg-white border border-gray-100"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeletePartnerClick(partner.id)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm bg-white border border-gray-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}

          </tbody>
        </table>
      </div>
    </div>
  );


  const renderNightlife = () => {
    const nightlifePartners = partners.filter(p => p.category === 'Vida Noturna');
    
    return (
      <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-8">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h3 className="font-black text-2xl text-ocean tracking-tight">Gestão de Vida Noturna</h3>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
              <Music size={14} className="text-vibrant-green" />
              Gerencie bares, shows e eventos noturnos.
            </p>
          </div>
          <button 
            onClick={() => {
              setPartnerForm({ 
                name: '',
                category: 'Vida Noturna',
                location: '',
                description: '',
                isPremium: false,
                image: 'https://images.unsplash.com/photo-1514525253361-bee8a19740c1?auto=format&fit=crop&w=800&q=80',
                rating: 5.0,
                whatsapp: '',
                images: [],
                latitude: undefined,
                longitude: undefined,
                google_maps_link: '',
                price: '',
                nightlife_type: 'Bar',
                operating_hours: ''
              });
              setIsPartnerModalOpen(true);
            }}
            className="bg-vibrant-green text-white font-bold px-6 py-4 rounded-2xl shadow-xl shadow-vibrant-green/20 flex items-center justify-center gap-2 hover:bg-[#1eb054] hover:-translate-y-0.5 transition-all active:scale-95"
          >
            <Plus size={18} />
            Novo Estabelecimento
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px] border-separate border-spacing-0">
            <thead>
              <tr className="bg-gray-50/20">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">Estabelecimento</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">Tipo</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">Horário</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">Preço</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {nightlifePartners.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-200">
                      <Music size={64} className="mb-6 opacity-10" />
                      <p className="font-bold uppercase text-[10px] tracking-widest">Nenhum estabelecimento cadastrado ainda.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                nightlifePartners.map((partner) => (
                  <tr key={partner.id} className="hover:bg-gray-50/30 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <img src={partner.image} className="w-14 h-14 rounded-2xl object-cover shadow-sm ring-4 ring-gray-50" />
                        <div>
                          <span className="font-bold text-ocean block leading-tight mb-1">{partner.name}</span>
                          <span className="text-[10px] text-gray-400">{partner.location}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{partner.nightlife_type || '--'}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs font-bold text-gray-500">{partner.operating_hours || '--'}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs font-black text-ocean">{partner.price || '--'}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => handleOpenPartnerModal(partner)}
                          className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:text-ocean hover:bg-gray-100 transition-all shadow-sm bg-white border border-gray-100"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeletePartnerClick(partner.id)}
                          className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm bg-white border border-gray-100"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderVideos = () => (
    <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-8">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h3 className="font-black text-2xl text-ocean tracking-tight">Gerenciar Vídeos</h3>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
            <PlayCircle size={14} className="text-vibrant-green" />
            Conteúdo em vídeo vertical para a aba de Reels e Stories.
          </p>
        </div>
        <button 
          onClick={() => handleOpenVideoModal()}
          className="bg-vibrant-green text-white font-bold px-6 py-4 rounded-2xl shadow-xl shadow-vibrant-green/20 flex items-center justify-center gap-2 hover:bg-[#1eb054] hover:-translate-y-0.5 transition-all active:scale-95"
        >
          <Plus size={18} />
          Novo Vídeo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {videos.map((video) => {
          const partner = partners.find(p => p.id === video.partnerId);
          return (
            <div key={video.id} className="border border-gray-100 rounded-[24px] overflow-hidden group flex flex-col h-full bg-white shadow-sm hover:shadow-xl transition-all duration-300">
              <div 
                className="relative aspect-[9/16] w-full overflow-hidden bg-black cursor-pointer"
                onClick={() => setSelectedVideoForPreview(video)}
              >
                <img 
                  src={video.thumbnail} 
                  alt={video.title} 
                  className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ocean/80 via-transparent to-transparent flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 group-hover:scale-110 group-hover:bg-vibrant-green group-hover:border-transparent transition-all duration-300">
                    <Play size={28} fill="currentColor" />
                  </div>
                </div>
                <div className="absolute top-6 right-6">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 hover:bg-white/20 transition-all">
                        <MoreHorizontal size={20} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-2xl shadow-2xl p-2 border-gray-100">
                      <DropdownMenuItem onClick={() => handleOpenVideoModal(video)} className="gap-2 cursor-pointer font-bold py-3 rounded-xl">
                        <Edit size={16} /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteVideoClick(video.id)} className="gap-2 cursor-pointer font-bold py-3 text-red-500 focus:text-red-500 rounded-xl">
                        <Trash2 size={16} /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {video.isPremium && (
                  <div className="absolute top-6 left-6 bg-amber-500 text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-lg shadow-amber-500/20 flex items-center gap-1.5">
                    <Ticket size={12} fill="currentColor" />
                    VIP
                  </div>
                )}
              </div>
              <div className="p-8 flex-1 flex flex-col">
                <h4 className="font-black text-xl text-ocean mb-3 leading-tight group-hover:text-vibrant-green transition-colors">{video.title}</h4>
                {video.description && (
                  <p className="text-sm text-gray-500 mb-8 line-clamp-2 leading-relaxed font-medium">{video.description}</p>
                )}
                <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-vibrant-green border border-gray-100 shadow-inner">
                      <Store size={14} />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest leading-none mb-1">Parceiro</p>
                      <p className="text-xs font-black text-ocean">{partner?.name || 'Geral'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {videos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-gray-100 rounded-[24px] bg-gray-50/20">
          <div className="w-20 h-20 rounded-3xl bg-gray-100 flex items-center justify-center text-gray-300 mb-6 shadow-inner">
            <PlayCircle size={40} />
          </div>
          <p className="text-gray-400 font-bold uppercase text-xs tracking-[0.2em]">Nenhum vídeo carregado</p>
          <button 
            onClick={() => handleOpenVideoModal()}
            className="mt-8 bg-ocean text-white font-black px-8 py-4 rounded-2xl hover:bg-ocean-deep transition-all active:scale-95 shadow-xl shadow-ocean/20"
          >
            Adicionar Primeiro Vídeo
          </button>
        </div>
      )}
    </div>
  );

  const renderCoupons = () => (
    <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-8">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h3 className="font-black text-2xl text-ocean tracking-tight">Gerenciar Cupons</h3>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
            <Ticket size={14} className="text-vibrant-green" />
            Promoções e ofertas exclusivas para turistas.
          </p>
        </div>
        <button 
          onClick={() => handleOpenCouponModal()}
          className="bg-vibrant-green text-white font-bold px-6 py-4 rounded-2xl shadow-xl shadow-vibrant-green/20 flex items-center justify-center gap-2 hover:bg-[#1eb054] hover:-translate-y-0.5 transition-all active:scale-95"
        >
          <Plus size={18} />
          Novo Cupom
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {allCoupons.map((coupon) => {
          const partner = partners.find(p => p.id === coupon.partnerId);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const isExpired = coupon.validUntil ? new Date(coupon.validUntil) < today : false;
          const displayStatus = isExpired ? 'expired' : coupon.status;

          
          return (
            <div key={coupon.id} className="border border-gray-100 rounded-[24px] p-8 relative overflow-hidden bg-white shadow-sm hover:border-vibrant-green/30 hover:shadow-xl transition-all duration-300 group">

              <div className="absolute top-6 right-6 transition-all z-20">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white shadow-md border border-gray-100 text-gray-400 hover:text-ocean transition-all">
                      <MoreHorizontal size={20} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-2xl shadow-2xl p-2 border-gray-100">
                    <DropdownMenuItem onClick={() => handleOpenCouponModal(coupon)} className="gap-2 cursor-pointer font-bold py-3 rounded-xl">
                      <Edit size={16} /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDeleteCouponClick(coupon.id)} className="gap-2 cursor-pointer font-bold py-3 text-red-500 focus:text-red-500 rounded-xl">
                      <Trash2 size={16} /> Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center text-vibrant-green shadow-inner">
                    <Ticket size={28} />
                  </div>
                  <div>
                    <span className="text-lg font-black text-vibrant-green leading-none">{coupon.discount} OFF</span>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-1.5">Desconto Especial</p>
                  </div>
                  <div className="ml-auto">
                    {displayStatus === 'expired' ? (
                      <span className="bg-red-50 text-red-400 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider border border-red-100">Expirado</span>
                    ) : displayStatus === 'active' ? (
                      <span className="bg-green-100 text-green-600 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider">Ativo</span>
                    ) : (
                      <span className="bg-gray-100 text-gray-400 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider">Inativo</span>
                    )}

                  </div>
                </div>
                <h4 className="font-black text-xl text-ocean mb-3 leading-tight line-clamp-2">{coupon.title}</h4>
                <div className="flex flex-col gap-2 mb-8">
                  <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                    <Store size={14} className="text-gray-300" />
                    <span className="truncate">{partner?.name || 'Geral'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                    <Ticket size={14} className="text-gray-300" />
                    <span className="font-black text-ocean bg-gray-50 px-2 py-1 rounded-md text-xs">{coupon.code || 'SEM CÓDIGO'}</span>
                  </div>
                </div>
                
                <div className="mt-auto pt-8 border-t border-gray-50 flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1.5">Válido até</span>
                    <span className="text-sm font-black text-gray-700">{new Date(coupon.validUntil).toLocaleDateString('pt-BR')}</span>
                  </div>
                  {coupon.isPremium && (
                    <span className="bg-amber-500 text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-lg shadow-amber-500/20">VIP</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {coupons.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-gray-100 rounded-[24px] bg-gray-50/20">
          <div className="w-20 h-20 rounded-3xl bg-gray-100 flex items-center justify-center text-gray-300 mb-6 shadow-inner">
            <Ticket size={40} />
          </div>
          <p className="text-gray-400 font-bold uppercase text-xs tracking-[0.2em]">Nenhum cupom cadastrado ainda</p>
          <button 
            onClick={() => handleOpenCouponModal()}
            className="mt-8 bg-ocean text-white font-black px-8 py-4 rounded-2xl hover:bg-ocean-deep transition-all active:scale-95 shadow-xl shadow-ocean/20"
          >
            Criar Primeiro Cupom
          </button>
        </div>
      )}

    </div>
  );


  const renderUsers = () => {
    const filteredUsers = userFilter === 'premium' 
      ? allProfiles.filter(p => p.is_premium) 
      : allProfiles;

    return (
      <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gray-50/10">
          <div>
            <h3 className="font-black text-2xl text-ocean tracking-tight">Gerenciar Usuários</h3>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
              <Users size={14} className="text-vibrant-green" />
              {userFilter === 'premium' ? 'Visualizando assinantes VIP ativos.' : 'Todos os membros da comunidade Alagoas.'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsAdminModalOpen(true)}
              className="bg-vibrant-green text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-vibrant-green/10 flex items-center justify-center gap-2 hover:bg-[#1eb054] transition-all active:scale-95 text-[10px] uppercase tracking-widest"
            >
              <Plus size={14} />
              Novo Administrador
            </button>
            <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100 shadow-inner">
            <button 
              onClick={() => setUserFilter('all')}
              className={`px-6 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${userFilter === 'all' ? 'bg-ocean text-white shadow-xl shadow-ocean/20' : 'text-gray-400 hover:text-ocean'}`}
            >
              Todos
            </button>
            <button 
              onClick={() => setUserFilter('premium')}
              className={`px-6 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${userFilter === 'premium' ? 'bg-amber-500 text-white shadow-xl shadow-amber-500/20' : 'text-gray-400 hover:text-amber-500'}`}
            >
              VIP
            </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px] border-separate border-spacing-0">
            <thead>
              <tr className="bg-gray-50/20">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">Usuário</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">Permissão</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 text-center">Status</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 text-center">Membro desde</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isProfilesLoading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-24 text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-ocean mx-auto mb-6 opacity-10" />
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Sincronizando base de dados...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-200">
                      <Users size={64} className="mb-6 opacity-10" />
                      <p className="font-bold uppercase text-[10px] tracking-widest">Nenhum usuário nesta categoria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((profile) => (
                  <tr key={profile.id} className="hover:bg-gray-50/30 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-ocean font-black text-sm border border-gray-100 shadow-inner">
                          {profile.full_name?.[0] || profile.email?.[0] || '?'}
                        </div>
                        <div>
                          <span className="font-black text-ocean block leading-tight mb-0.5">{profile.full_name || 'Usuário'}</span>
                          <span className="text-xs text-gray-400 font-medium">{profile.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider border ${profile.role === 'admin' ? "bg-red-50 text-red-600 border-red-100" : "bg-gray-50 text-gray-400 border-gray-100"}`}>
                        {profile.role}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="flex justify-center">
                        {profile.is_premium ? (
                          <span className="bg-amber-50 text-amber-600 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider flex items-center gap-1.5 border border-amber-100 shadow-sm">
                            <Ticket size={12} fill="currentColor" /> VIP Member
                          </span>
                        ) : (
                          <span className="text-gray-300 text-[10px] font-black uppercase tracking-widest">Plano Gratuito</span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className="text-xs font-black text-gray-400 uppercase tracking-tight">
                        {new Date(profile.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:text-ocean hover:bg-gray-100 transition-all ml-auto">
                            <MoreHorizontal size={20} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-2xl border-gray-100 p-2">
                          <DropdownMenuItem 
                            disabled={profile.role === 'admin'}
                            onClick={async () => {
                              try {
                                const { data: { session } } = await supabase.auth.getSession();
                                if (!session) {
                                  toast.error("Sessão expirada. Faça login novamente.");
                                  return;
                                }
                                const { error } = await supabase.functions.invoke('manage-users', {
                                  body: { action: 'toggle-vip', targetUserId: profile.id, premiumStatus: !profile.is_premium },
                                  headers: { Authorization: `Bearer ${session.access_token}` }
                                });
                                if (error) throw error;
                                toast.success(profile.is_premium ? "VIP removido" : "Usuário agora é VIP!");
                                fetchProfiles();
                              } catch (err: any) {
                                toast.error("Erro ao alterar status: " + err.message);
                              }
                            }}
                            className={`gap-2 cursor-pointer font-bold py-3 rounded-xl ${profile.role === 'admin' ? 'opacity-50 grayscale' : ''}`}
                          >
                            <Ticket size={16} className={profile.is_premium ? "text-gray-400" : "text-amber-500"} />
                            {profile.is_premium ? 'Remover VIP' : 'Tornar VIP'}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            disabled={profile.role === 'admin'}
                            onClick={async () => {
                              if (window.confirm(`Tem certeza que deseja EXCLUIR permanentemente a conta de ${profile.full_name || profile.email}?`)) {
                                try {
                                  const { data: { session } } = await supabase.auth.getSession();
                                  if (!session) {
                                    toast.error("Sessão expirada. Faça login novamente.");
                                    return;
                                  }
                                  const { error } = await supabase.functions.invoke('manage-users', {
                                    body: { action: 'delete-user', targetUserId: profile.id },
                                    headers: { Authorization: `Bearer ${session.access_token}` }
                                  });
                                  if (error) throw error;
                                  toast.success("Usuário excluído com sucesso");
                                  fetchProfiles();
                                } catch (err: any) {
                                  toast.error("Erro ao excluir usuário: " + err.message);
                                }
                              }
                            }}
                            className={`gap-2 cursor-pointer font-bold py-3 text-red-500 focus:text-red-500 rounded-xl ${profile.role === 'admin' ? 'opacity-50 grayscale' : ''}`}
                          >
                            <Trash2 size={16} /> Excluir Conta
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderRoteiros = () => (
    <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-8">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h3 className="font-black text-2xl text-ocean tracking-tight">Gerenciar Roteiros VIP</h3>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
            <Compass size={14} className="text-vibrant-green" />
            Roteiros exclusivos para membros premium.
          </p>
        </div>
        <button 
          onClick={() => handleOpenRoteiroModal()}
          className="bg-vibrant-green text-white font-bold px-6 py-4 rounded-2xl shadow-xl shadow-vibrant-green/20 flex items-center justify-center gap-2 hover:bg-[#1eb054] hover:-translate-y-0.5 transition-all active:scale-95"
        >
          <Plus size={18} />
          Novo Roteiro
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {roteirosVip.map((roteiro) => (
          <div key={roteiro.id} className="border border-gray-100 rounded-[24px] p-8 bg-white shadow-sm hover:border-vibrant-green/30 transition-all duration-300 group relative">
            <div className="absolute top-6 right-6 transition-all z-20">
              <div className="flex gap-2">
                <button 
                  onClick={() => handleOpenRoteiroModal(roteiro)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white shadow-md border border-gray-100 text-gray-400 hover:text-ocean transition-all"
                >
                  <Edit size={18} />
                </button>
                <button 
                  onClick={() => handleDeleteRoteiroClick(roteiro.id)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white shadow-md border border-gray-100 text-red-400 hover:text-red-500 transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <div className="w-full aspect-video rounded-2xl bg-gray-100 overflow-hidden mb-6 shadow-inner border border-gray-100 relative">
              {(roteiro.image_url || roteiro.icone_url) ? (
                <img src={roteiro.image_url || roteiro.icone_url} className="w-full h-full object-cover" alt={roteiro.titulo} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-blue-500">
                  <Compass size={28} />
                </div>
              )}
              {roteiro.passos && roteiro.passos.length > 0 && (
                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/20 shadow-lg flex items-center gap-1.5">
                  <Clock size={12} className="text-vibrant-green" />
                  <span className="text-[10px] font-black text-ocean uppercase">{roteiro.passos.length} Paradas</span>
                </div>
              )}
            </div>
            <h4 className="font-black text-xl text-ocean mb-2 leading-tight">{roteiro.titulo}</h4>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-4">{roteiro.subtitulo}</p>
            <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed font-medium mb-4">{roteiro.descricao_completa}</p>
          </div>
        ))}
      </div>

      {roteirosVip.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-gray-100 rounded-[24px] bg-gray-50/20">
          <div className="w-20 h-20 rounded-3xl bg-gray-100 flex items-center justify-center text-gray-300 mb-6">
            <Compass size={40} />
          </div>
          <p className="text-gray-400 font-bold uppercase text-xs tracking-[0.2em]">Nenhum roteiro cadastrado</p>
        </div>
      )}
    </div>
  );

  const renderEventos = () => (
    <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-8">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h3 className="font-black text-2xl text-ocean tracking-tight">Gerenciar Eventos VIP</h3>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
            <Calendar size={14} className="text-vibrant-green" />
            Alertas de eventos exclusivos.
          </p>
        </div>
        <button 
          onClick={() => handleOpenEventoModal()}
          className="bg-vibrant-green text-white font-bold px-6 py-4 rounded-2xl shadow-xl shadow-vibrant-green/20 flex items-center justify-center gap-2 hover:bg-[#1eb054] hover:-translate-y-0.5 transition-all active:scale-95"
        >
          <Plus size={18} />
          Novo Evento
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {eventosVip.map((evento) => (
          <div key={evento.id} className="border border-gray-100 rounded-[24px] p-8 bg-white shadow-sm hover:border-vibrant-green/30 transition-all duration-300 group relative">
            <div className="absolute top-6 right-6 transition-all z-20">
              <div className="flex gap-2">
                <button 
                  onClick={() => handleOpenEventoModal(evento)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white shadow-md border border-gray-100 text-gray-400 hover:text-ocean transition-all"
                >
                  <Edit size={18} />
                </button>
                <button 
                  onClick={() => handleDeleteEventoClick(evento.id)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white shadow-md border border-gray-100 text-red-400 hover:text-red-500 transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <div className="w-full aspect-video rounded-2xl bg-gray-100 overflow-hidden mb-6 shadow-inner border border-gray-100">
              {evento.icone_url ? (
                <img src={evento.icone_url} className="w-full h-full object-cover" alt={evento.titulo} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-purple-500">
                  <Calendar size={28} />
                </div>
              )}
            </div>
            <h4 className="font-black text-xl text-ocean mb-2 leading-tight">{evento.titulo}</h4>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-4">{new Date(evento.data_categoria).toLocaleString('pt-BR')}</p>
            <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed font-medium mb-4">{evento.descricao_completa}</p>
          </div>
        ))}
      </div>

      {eventosVip.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-gray-100 rounded-[24px] bg-gray-50/20">
          <div className="w-20 h-20 rounded-3xl bg-gray-100 flex items-center justify-center text-gray-300 mb-6">
            <Calendar size={40} />
          </div>
          <p className="text-gray-400 font-bold uppercase text-xs tracking-[0.2em]">Nenhum evento cadastrado</p>
        </div>
      )}
    </div>
  );


  const renderNotifications = () => (
    <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gray-50/10">
        <div>
          <h3 className="font-black text-2xl text-ocean tracking-tight">Notificações</h3>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
            <Bell size={14} className="text-vibrant-green" />
            Feed de atividades em tempo real dos seus conteúdos.
          </p>
        </div>
        {notifications.length > 0 && (
          <button 
            onClick={() => {
              if (window.confirm("Deseja realmente excluir todas as notificações?")) {
                deleteAllNotifications();
              }
            }}
            className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white transition-all rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] shadow-sm border border-red-100"
          >
            <Trash2 size={14} /> Limpar Tudo
          </button>
        )}
      </div>
      <div className="divide-y divide-gray-50">
        {notifications.length === 0 ? (
          <div className="p-32 text-center bg-gray-50/20">
            <Bell size={64} className="mx-auto text-gray-200 mb-6 opacity-10" />
            <p className="text-gray-300 font-bold uppercase text-[10px] tracking-[0.2em]">Tudo limpo por aqui</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div 
              key={n.id} 
              className={`p-8 flex items-start gap-6 hover:bg-gray-50/50 transition-all cursor-pointer border-l-4 ${!n.read ? 'bg-ocean/5 border-vibrant-green' : 'border-transparent'}`}
              onClick={() => {
                console.log("[Admin] Clicked notification:", n.id, "type:", n.type, "videoId:", n.videoId);
                markNotificationAsRead(n.id);
                if (n.videoId) {
                  const videoIdx = videos.findIndex(v => v.id === n.videoId);
                  if (videoIdx !== -1) {
                    setShouldOpenComments(n.type === 'comment');
                    setActiveStoryIndex(videoIdx);
                  }
                } else if (n.type === 'review' || n.type === 'new_user') {
                  // Navigate to corresponding tab
                  setActiveTab(n.type === 'review' ? 'partners' : 'users');
                }
              }}
            >
              <div className="w-14 h-14 rounded-2xl bg-white overflow-hidden shrink-0 shadow-md border border-gray-100 flex items-center justify-center">
                {n.senderAvatar ? (
                  <img src={n.senderAvatar} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center font-black text-lg ${
                    n.type === 'like' ? 'bg-red-50 text-red-500' : 
                    n.type === 'comment' ? 'bg-blue-50 text-blue-500' :
                    n.type === 'review' ? 'bg-yellow-50 text-yellow-500' :
                    'bg-green-50 text-green-500'
                  }`}>
                    {n.type === 'like' ? '❤️' : 
                     n.type === 'comment' ? '💬' :
                     n.type === 'review' ? '⭐' :
                     '👤'}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-600 leading-relaxed mb-1">
                      <span className="font-black text-ocean text-base">{n.senderName}</span> 
                      {n.type === 'like' && ' curtiu seu vídeo'}
                      {n.type === 'comment' && ' comentou no seu vídeo'}
                      {n.type === 'review' && ' avaliou um parceiro'}
                      {n.type === 'new_user' && ' acabou de se cadastrar!'}
                      {n.videoTitle && n.type !== 'new_user' && (
                        <> <span className="font-black text-ocean italic">"{n.videoTitle}"</span></>
                      )}
                    </p>
                    
                    {(n.type === 'comment' || n.type === 'review') && n.content && (
                      <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 mt-2 mb-3 relative">
                        <MessageSquare size={14} className="absolute -top-2 -left-2 text-vibrant-green bg-white rounded-full p-0.5 shadow-sm" />
                        <p className="text-sm text-gray-500 italic font-medium leading-relaxed">"{n.content}"</p>
                      </div>
                    )}

                    {n.type === 'comment' && (
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          if(n.sourceId && window.confirm("Deseja realmente excluir este comentário?")) {
                            deleteVideoComment(n.sourceId, n.videoId);
                          }
                        }}
                        className="w-fit flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-red-100 shadow-sm mt-2"
                      >
                        <Trash2 size={12} /> Excluir Comentário
                      </button>
                    )}

                    <p className="mt-2 text-[10px] text-gray-300 font-bold uppercase tracking-widest flex items-center gap-2">
                      {new Date(n.createdAt).toLocaleString('pt-BR')}
                      {!n.read && (
                        <span className="px-2 py-0.5 rounded bg-vibrant-green text-white animate-pulse">Novo</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );



  const renderFinancial = () => {
    if (isFinancialLoading && financialStats.recentPayments.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-12 h-12 animate-spin text-vibrant-green mb-4" />
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">Carregando dados financeiros...</p>
        </div>
      );
    }

    if (financialError) {
      return (
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
          <div className="bg-red-50 p-6 rounded-[32px] border border-red-100 max-w-md">
            <X className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-ocean font-black text-lg mb-2">Erro ao carregar dados</h3>
            <p className="text-gray-500 text-sm mb-6">{financialError}</p>
            <Button onClick={fetchFinancialData} className="bg-ocean text-white rounded-xl font-bold">
              Tentar Novamente
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-10">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-black text-ocean tracking-tight">Painel Financeiro</h1>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
              <DollarSign size={14} className="text-vibrant-green" />
              Visão geral de assinaturas e faturamento.
            </p>
          </div>
          <Button 
            onClick={fetchFinancialData} 
            disabled={isFinancialLoading}
            variant="outline"
            className="rounded-xl border-gray-100 font-bold"
          >
            {isFinancialLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Settings className="w-4 h-4 mr-2" />}
            Atualizar Dados
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-100">
              <Users size={22} />
            </div>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Assinantes VIP Ativos</p>
            <h3 className="text-3xl font-black text-ocean tracking-tighter">{financialStats.activeVips}</h3>
          </div>

          <div className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-orange-100">
              <Calendar size={22} />
            </div>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Vencendo em 5 dias</p>
            <h3 className="text-3xl font-black text-ocean tracking-tighter">{financialStats.expiringSoon}</h3>
          </div>

          <div className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-green-100">
              <DollarSign size={22} />
            </div>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Faturamento Total</p>
            <h3 className="text-3xl font-black text-ocean tracking-tighter">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financialStats.totalBilling)}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/10">
            <h3 className="font-black text-xl text-ocean">Histórico de Pagamentos</h3>
          </div>
          <div className="overflow-x-auto">
            {financialStats.recentPayments.length === 0 ? (
              <div className="px-8 py-20 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8 text-gray-200" />
                </div>
                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                  Nenhum dado financeiro disponível no momento.
                </p>
              </div>
            ) : (
              <table className="w-full text-left min-w-[700px] border-separate border-spacing-0">
                <thead>
                  <tr className="bg-gray-50/20">
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">Data/Hora</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">Cliente</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">Plano</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">Método</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 text-right">Valor (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {financialStats.recentPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50/30 transition-colors">
                      <td className="px-8 py-6 text-sm font-bold text-ocean">
                        {new Date(payment.created_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-ocean">{payment.profiles?.full_name || 'N/A'}</span>
                          <span className="text-[10px] text-gray-400 font-medium">{payment.profiles?.email || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider border ${
                          payment.plan_type === 'anual' 
                            ? 'bg-purple-50 text-purple-600 border-purple-100' 
                            : 'bg-blue-50 text-blue-600 border-blue-100'
                        }`}>
                          {payment.plan_type}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                          {payment.payment_method}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <span className="text-sm font-black text-ocean">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payment.amount)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  };


  return (
    <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab} unreadNotificationsCount={unreadCount}>
      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'notifications' && renderNotifications()}
      {activeTab === 'financial' && renderFinancial()}
      {activeTab === 'banners' && <BannerManagement />}
      {activeTab === 'appearance' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black text-[#0F172A] tracking-tight">Aparência</h2>
              <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Personalize a identidade visual do aplicativo</p>
            </div>
          </div>

          <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm space-y-12">
            {/* Live Preview Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <Play size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#0F172A]">Pré-visualização em Tempo Real</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase">Como os turistas verão o topo do app</p>
                </div>
              </div>

              <div className="relative w-full max-w-2xl mx-auto aspect-[16/10] md:aspect-[21/9] rounded-[40px] overflow-hidden shadow-2xl border border-gray-100">
                <div 
                  className="w-full h-full p-8 md:p-12 flex flex-col justify-center transition-all duration-300"
                  style={{
                    backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.6) ${appSettingsForm.hero_gradient_intensity}%, rgba(0, 0, 0, 0) ${appSettingsForm.hero_gradient_intensity + 50}%), url('${appSettingsForm.hero_bg_image || 'https://fxkrpadnrdewpbfmawzo.supabase.co/storage/v1/object/public/imagens/FOTO%20MACEIO%20A%20NOITE.jpg'}')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  <div className="max-w-md">
                    <h1 className="text-3xl md:text-5xl font-black text-white leading-none mb-2 tracking-tight">
                      {appSettingsForm.hero_title || 'Descubra'} <span className="text-[#22c55e]">Alagoas.</span>
                    </h1>
                    <p className="text-white text-base md:text-xl font-bold mb-4">
                      {appSettingsForm.hero_subtitle || 'Economize em cada saída.'}
                    </p>
                    <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl py-2 px-4 flex items-center gap-2 w-fit">
                      <span className="text-sm">🏷️</span>
                      <p className="text-white text-[10px] md:text-xs font-medium">
                        Economia de até <span className="font-black text-[#22c55e]">50%</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-px bg-gray-100 w-full" />

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <ImageIcon size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#0F172A]">Tela Inicial (Hero)</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase">Imagem de fundo da seção principal</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
                  <button
                    type="button"
                    onClick={() => setUploadModes(prev => ({ ...prev, hero: 'file' }))}
                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                      uploadModes.hero === 'file' 
                        ? 'bg-white text-ocean shadow-sm' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Fazer Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadModes(prev => ({ ...prev, hero: 'link' }))}
                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                      uploadModes.hero === 'link' 
                        ? 'bg-white text-ocean shadow-sm' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Colar Link
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  <div className="relative aspect-[16/7] rounded-3xl overflow-hidden bg-gray-50 border border-gray-100 group shadow-inner">
                    {appSettingsForm.hero_bg_image ? (
                      <img src={appSettingsForm.hero_bg_image} className="w-full h-full object-cover" alt="Hero Background Preview" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2">
                        <ImageIcon size={48} strokeWidth={1} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Sem imagem selecionada</span>
                      </div>
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
                        <Loader2 className="w-10 h-10 text-white animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      {uploadModes.hero === 'link' && (
                        <Label className="font-black text-xs uppercase tracking-widest text-gray-400">URL da Imagem</Label>
                      )}
                      <div className="flex gap-2">
                        {uploadModes.hero === 'file' ? (
                          <Button 
                            type="button" 
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/*';
                              input.onchange = async (e: any) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setIsUploading(true);
                                  try {
                                    const fileExt = file.name.split('.').pop();
                                    const fileName = `hero_${Math.random().toString(36).substring(2)}.${fileExt}`;
                                    const { error } = await supabase.storage.from('partners').upload(fileName, file);
                                    if (error) throw error;
                                    const { data: { publicUrl } } = supabase.storage.from('partners').getPublicUrl(fileName);
                                    setAppSettingsForm({ ...appSettingsForm, hero_bg_image: publicUrl });
                                    toast.success('Imagem enviada com sucesso!');
                                  } catch (err) {
                                    toast.error('Erro ao enviar imagem');
                                  } finally {
                                    setIsUploading(false);
                                  }
                                }
                              };
                              input.click();
                            }}
                            disabled={isUploading}
                            className="bg-white text-ocean border border-gray-100 font-black px-6 py-6 rounded-xl w-full flex items-center justify-center gap-2 hover:bg-gray-50 transition-all"
                          >
                            <Upload size={18} />
                            {isUploading ? 'ENVIANDO...' : 'ENVIAR ARQUIVO'}
                          </Button>
                        ) : (
                          <Input 
                            value={appSettingsForm.hero_bg_image} 
                            onChange={(e) => setAppSettingsForm({...appSettingsForm, hero_bg_image: e.target.value})}
                            className="rounded-xl border-gray-100 h-14 font-medium"
                            placeholder="https://imgur.com/link-da-imagem.jpg"
                          />
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 font-medium italic mt-2">Recomendado: 1920x840px ou superior para melhor qualidade em desktops.</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Label className="font-black text-xs uppercase tracking-widest text-gray-400">Intensidade do Degradê (Contraste para o Texto)</Label>
                        <span className="text-sm font-black text-ocean bg-gray-100 px-3 py-1 rounded-lg">{appSettingsForm.hero_gradient_intensity}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={appSettingsForm.hero_gradient_intensity} 
                        onChange={(e) => setAppSettingsForm({...appSettingsForm, hero_gradient_intensity: parseInt(e.target.value)})}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-ocean"
                      />
                      <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        <span>Limpa (0%)</span>
                        <span>Sombra Forte (100%)</span>
                      </div>
                    </div>

                    <div className="h-px bg-gray-100 w-full !my-8" />

                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                          <Edit size={20} />
                        </div>
                        <h3 className="text-base font-black text-[#0F172A]">Textos da Tela Inicial</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="font-black text-xs uppercase tracking-widest text-gray-400">Título Principal</Label>
                          <Input 
                            value={appSettingsForm.hero_title} 
                            onChange={(e) => setAppSettingsForm({...appSettingsForm, hero_title: e.target.value})}
                            className="rounded-xl border-gray-100 h-12 font-bold"
                            placeholder="Ex: Descubra Alagoas."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-black text-xs uppercase tracking-widest text-gray-400">Subtítulo</Label>
                          <Input 
                            value={appSettingsForm.hero_subtitle} 
                            onChange={(e) => setAppSettingsForm({...appSettingsForm, hero_subtitle: e.target.value})}
                            className="rounded-xl border-gray-100 h-12 font-medium"
                            placeholder="Ex: Economize em cada saída."
                          />
                        </div>
                      </div>
                      
                      <div className="h-px bg-gray-100 w-full !my-8" />
                    </div>

                    <Button 
                      onClick={() => updateAppSettings(appSettingsForm)}
                      className="w-full bg-[#0F172A] hover:bg-[#1e293b] text-white font-black py-7 rounded-2xl shadow-xl shadow-slate-200 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    >
                      <Save size={18} />
                      SALVAR ALTERAÇÕES
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'access-rules' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black text-[#0F172A] tracking-tight">Configuração Tábua de Marés</h2>
              <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Configure as restrições e visualizações para usuários comuns</p>
            </div>
          </div>

          <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm space-y-12 max-w-2xl">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-50 flex items-center justify-center text-cyan-600">
                  <Waves size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#0F172A]">Tábua de Marés</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-tight">Liberação antecipada para usuários Grátis</p>
                </div>
              </div>
              
              <div className="space-y-4 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="tide_open_time" className="font-black text-xs uppercase tracking-widest text-gray-500">Horário de Abertura</Label>
                    <Input 
                      id="tide_open_time"
                      type="time" 
                      value={appSettingsForm.tide_open_time || '00:00'} 
                      onChange={(e) => setAppSettingsForm({...appSettingsForm, tide_open_time: e.target.value})}
                      className="w-full h-14 bg-white border-gray-200 rounded-xl font-bold text-xl px-6 focus:ring-4 focus:ring-ocean/5 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tide_close_time" className="font-black text-xs uppercase tracking-widest text-gray-500">Horário de Fechamento</Label>
                    <Input 
                      id="tide_close_time"
                      type="time" 
                      value={appSettingsForm.tide_close_time || '23:59'} 
                      onChange={(e) => setAppSettingsForm({...appSettingsForm, tide_close_time: e.target.value})}
                      className="w-full h-14 bg-white border-gray-200 rounded-xl font-bold text-xl px-6 focus:ring-4 focus:ring-ocean/5 transition-all"
                    />
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl flex gap-3 mt-4">
                  <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs text-blue-900 font-bold uppercase tracking-tight">Como funciona:</p>
                    <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
                      Todos os dias futuros da semana permanecem 100% bloqueados para usuários comuns, sendo um recurso exclusivo do plano VIP. A maré do dia atual (hoje) ficará visível para usuários gratuitos apenas dentro do intervalo de horário definido abaixo. Fora desse período, até mesmo a maré de hoje exibirá o cadeado VIP.
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => updateAppSettings(appSettingsForm)}
                className="w-full bg-[#0F172A] hover:bg-[#1e293b] text-white font-black py-7 rounded-2xl shadow-xl shadow-slate-200 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <Save size={18} />
                SALVAR CONFIGURAÇÕES
              </Button>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'partners' && renderPartners()}
      {activeTab === 'tides-data' && <TidesDataManagement />}
      {activeTab === 'nightlife' && renderNightlife()}
      {activeTab === 'coupons' && renderCoupons()}
      {activeTab === 'videos' && renderVideos()}
      {activeTab === 'roteiros' && renderRoteiros()}
      {activeTab === 'eventos' && renderEventos()}
      
      {activeTab === 'users' && renderUsers()}
      {activeTab === 'vip-settings' && (
        <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-10 max-w-2xl">
          <div className="mb-10">
            <h3 className="font-black text-3xl text-ocean tracking-tight">Configurações VIP</h3>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
              <CreditCard size={14} className="text-vibrant-green" />
              Gestão de precificação e fluxo de checkout premium.
            </p>
          </div>
          
          <form onSubmit={handleSaveVipSettings} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Label htmlFor="vip_price" className="font-black text-xs uppercase tracking-widest text-ocean/50">Valor da Assinatura VIP (Plano Principal)</Label>
                <div className="relative group">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-ocean/20 group-focus-within:text-vibrant-green transition-colors text-xl">R$</span>
                  <Input 
                    id="vip_price" 
                    value={financialSettingsForm.vip_price} 
                    onChange={(e) => setFinancialSettingsForm({...financialSettingsForm, vip_price: e.target.value})}
                    className="rounded-2xl border-gray-100 py-8 pl-16 text-2xl font-black text-ocean focus:ring-4 focus:ring-vibrant-green/5 transition-all shadow-sm bg-gray-50/30"
                    placeholder="29,90"
                    required 
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label htmlFor="vip_duration" className="font-black text-xs uppercase tracking-widest text-ocean/50">Duração do Plano (Em Meses)</Label>
                <Select 
                  value={vipSettingsForm.vip_plan_duration_months?.toString() || "1"}
                  onValueChange={(val) => setVipSettingsForm(prev => ({ ...prev, vip_plan_duration_months: parseInt(val) }))}
                >
                  <SelectTrigger id="vip_duration" className="rounded-2xl border-gray-100 h-[72px] text-xl font-black text-ocean focus:ring-4 focus:ring-vibrant-green/5 transition-all shadow-sm bg-gray-50/30">
                    <SelectValue placeholder="Selecione a duração" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-gray-100 shadow-2xl">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                      <SelectItem key={m} value={m.toString()} className="py-3 font-bold rounded-xl">
                        {m} {m === 1 ? 'mês' : 'meses'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <Label htmlFor="vip_price_annual" className="font-black text-xs uppercase tracking-widest text-ocean/50">Valor da Assinatura VIP Anual (Mercado Pago)</Label>
              <div className="relative group">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-ocean/20 group-focus-within:text-vibrant-green transition-colors text-xl">R$</span>
                <Input 
                  id="vip_price_annual" 
                  value={financialSettingsForm.vip_price_annual} 
                  onChange={(e) => setFinancialSettingsForm({...financialSettingsForm, vip_price_annual: e.target.value})}
                  className="rounded-2xl border-gray-100 py-8 pl-16 text-2xl font-black text-ocean focus:ring-4 focus:ring-vibrant-green/5 transition-all shadow-sm bg-gray-50/30"
                  placeholder="299,00"
                  required 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Label htmlFor="max_parcelas_mensal" className="font-black text-xs uppercase tracking-widest text-ocean/50">Máximo de Parcelas (Plano Mensal)</Label>
                <Input 
                  id="max_parcelas_mensal" 
                  type="number"
                  min="1"
                  max="12"
                  value={financialSettingsForm.max_parcelas_mensal} 
                  onChange={(e) => setFinancialSettingsForm({...financialSettingsForm, max_parcelas_mensal: e.target.value})}
                  className="rounded-2xl border-gray-100 py-6 text-xl font-black text-ocean focus:ring-4 focus:ring-vibrant-green/5 transition-all shadow-sm bg-gray-50/30"
                />
              </div>

              <div className="space-y-4">
                <Label htmlFor="max_parcelas_anual" className="font-black text-xs uppercase tracking-widest text-ocean/50">Máximo de Parcelas (Plano Anual)</Label>
                <Input 
                  id="max_parcelas_anual" 
                  type="number"
                  min="1"
                  max="12"
                  value={financialSettingsForm.max_parcelas_anual} 
                  onChange={(e) => setFinancialSettingsForm({...financialSettingsForm, max_parcelas_anual: e.target.value})}
                  className="rounded-2xl border-gray-100 py-6 text-xl font-black text-ocean focus:ring-4 focus:ring-vibrant-green/5 transition-all shadow-sm bg-gray-50/30"
                />
              </div>
            </div>


            <Button 
              type="submit" 
              className="w-full bg-vibrant-green hover:bg-[#1eb054] text-white font-black h-20 rounded-2xl shadow-xl shadow-vibrant-green/20 flex items-center justify-center gap-4 transition-all active:scale-[0.98] group text-lg disabled:opacity-70"
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <Save size={24} className="group-hover:rotate-12 transition-transform" />
                  Salvar Configurações VIP
                </>
              )}
            </Button>
          </form>
        </div>
      )}

      {activeTab === 'general-settings' && (
        <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-10 max-w-2xl">
          <div className="mb-10">
            <h3 className="font-black text-3xl text-ocean tracking-tight">Contato e Suporte</h3>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
              <MessageSquare size={14} className="text-vibrant-green" />
              Canal oficial de atendimento aos turistas e parceiros.
            </p>
          </div>
          
          <form onSubmit={handleSaveGeneralSettings} className="space-y-10">
            <div className="space-y-4">
              <Label htmlFor="whatsapp_link" className="font-black text-xs uppercase tracking-widest text-ocean/50">Link Direto do WhatsApp</Label>
              <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-ocean/20 group-focus-within:text-vibrant-green transition-colors">
                  <MessageSquare size={20} />
                </div>
                <Input 
                  id="whatsapp_link" 
                  value={generalSettingsForm.whatsapp_link} 
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val.startsWith('https://wa.me/') && val.length > 0) {
                      if (/^\d+$/.test(val)) {
                        setGeneralSettingsForm({...generalSettingsForm, whatsapp_link: `https://wa.me/${val}`});
                      } else {
                        setGeneralSettingsForm({...generalSettingsForm, whatsapp_link: val});
                      }
                    } else {
                      setGeneralSettingsForm({...generalSettingsForm, whatsapp_link: val});
                    }
                  }}
                  className="rounded-2xl border-gray-100 py-8 pl-16 focus:ring-4 focus:ring-vibrant-green/5 transition-all shadow-sm font-medium bg-gray-50/30"
                  placeholder="https://wa.me/5582999999999"
                  required 
                />
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight italic">* Use o formato completo incluindo o código do país (55)</p>
            </div>

            <Button
              type="submit"
              className="w-full bg-ocean text-white font-black h-20 rounded-2xl shadow-xl shadow-ocean/20 flex items-center justify-center gap-4 hover:bg-ocean-deep transition-all active:scale-[0.98] group text-lg"
            >
              <Save size={24} className="group-hover:rotate-12 transition-transform" />
              Salvar Configurações de Contato
            </Button>
          </form>
        </div>
      )}


      {/* Partner Modal */}
      <Dialog open={isPartnerModalOpen} onOpenChange={setIsPartnerModalOpen}>
        <DialogContent className="sm:max-w-[700px] rounded-xl overflow-hidden p-0 flex flex-col max-h-[90vh] border-none shadow-2xl">
          <DialogTitle className="sr-only">Editar Parceiro</DialogTitle>
          <DialogHeader className="p-8 pb-4 bg-gray-50/50">
            <DialogTitle className="text-2xl font-black text-[#0F172A] tracking-tight">
              {editingPartner ? 'Editar Parceiro' : 'Novo Parceiro'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSavePartner} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-bold text-gray-700">Nome do Estabelecimento</Label>
                  <Input 
                    id="name" 
                    value={partnerForm.name} 
                    onChange={(e) => setPartnerForm({...partnerForm, name: e.target.value})}
                    className="rounded-xl border-gray-200 py-6"
                    placeholder="Ex: Bar do Cuscuz"
                    required 
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="category" className="font-black text-xs uppercase tracking-widest text-gray-400">Categoria</Label>
                  <Select 
                    value={partnerForm.category} 
                    onValueChange={(val: Category) => setPartnerForm({...partnerForm, category: val})}
                  >
                    <SelectTrigger className="rounded-xl border-gray-100 h-[56px] focus:ring-4 focus:ring-slate-50 transition-all font-bold">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-white border-gray-100 shadow-2xl">
                      <SelectItem value="Praias" className="font-bold py-3">Praias</SelectItem>
                      <SelectItem value="Restaurantes" className="font-bold py-3">Restaurantes</SelectItem>
                      <SelectItem value="Passeios" className="font-bold py-3">Passeios</SelectItem>
                      <SelectItem value="Hotéis" className="font-bold py-3">Hotéis</SelectItem>
                      <SelectItem value="Vida Noturna" className="font-bold py-3">Vida Noturna</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="price" className="font-black text-xs uppercase tracking-widest text-gray-400">Preço / Ingresso</Label>
                  <Input 
                    id="price" 
                    value={partnerForm.price || ''} 
                    onChange={(e) => setPartnerForm({...partnerForm, price: e.target.value})}
                    className="rounded-xl border-gray-100 py-7 focus:ring-4 focus:ring-slate-50 transition-all font-bold"
                    placeholder="Ex: R$ 45 ou Gratuito"
                  />
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="location" className="font-black text-xs uppercase tracking-widest text-gray-400">Endereço (Texto)</Label>
                  <Input 
                    id="location" 
                    value={partnerForm.location} 
                    onChange={(e) => setPartnerForm({...partnerForm, location: e.target.value})}
                    className="rounded-xl border-gray-100 py-7 focus:ring-4 focus:ring-slate-50 transition-all font-bold"
                    placeholder="Ex: Av. Silvio Viana, Ponta Verde"
                    required 
                  />
                </div>

                {partnerForm.category === 'Vida Noturna' && (
                  <>
                    <div className="space-y-3">
                      <Label htmlFor="nightlife_type" className="font-black text-xs uppercase tracking-widest text-gray-400">Tipo (Bar/Show/Evento)</Label>
                      <Select 
                        value={partnerForm.nightlife_type || 'Bar'} 
                        onValueChange={(val: 'Bar' | 'Show' | 'Evento') => setPartnerForm({...partnerForm, nightlife_type: val})}
                      >
                        <SelectTrigger className="rounded-xl border-gray-100 h-[56px] focus:ring-4 focus:ring-slate-50 transition-all font-bold">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl bg-white border-gray-100 shadow-2xl">
                          <SelectItem value="Bar" className="font-bold py-3">Bar</SelectItem>
                          <SelectItem value="Show" className="font-bold py-3">Show</SelectItem>
                          <SelectItem value="Evento" className="font-bold py-3">Evento</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="operating_hours" className="font-black text-xs uppercase tracking-widest text-gray-400">Horário de Funcionamento</Label>
                      <Input 
                        id="operating_hours" 
                        value={partnerForm.operating_hours || ''} 
                        onChange={(e) => setPartnerForm({...partnerForm, operating_hours: e.target.value})}
                        className="rounded-xl border-gray-100 py-7 focus:ring-4 focus:ring-slate-50 transition-all font-bold"
                        placeholder="Ex: 18h às 02h"
                      />
                    </div>
                  </>
                )}

                {/* Canais de Atendimento e Redes */}
                <div className="md:col-span-2 space-y-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-4 bg-vibrant-green rounded-full" />
                    <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-[#0F172A]">Canais de Atendimento e Redes</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="whatsapp" className="font-black text-[10px] uppercase tracking-widest text-gray-400">WhatsApp (Número ou Link)</Label>
                      <Input 
                        id="whatsapp" 
                        value={partnerForm.whatsapp || ''} 
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val.startsWith('https://wa.me/') && val.length > 0) {
                            // If they try to delete the prefix, or paste something else
                            // If it looks like just a number, prepend the prefix
                            if (/^\d+$/.test(val)) {
                              setPartnerForm({...partnerForm, whatsapp: `https://wa.me/${val}`});
                            } else {
                              setPartnerForm({...partnerForm, whatsapp: val});
                            }
                          } else {
                            setPartnerForm({...partnerForm, whatsapp: val});
                          }
                        }}
                        className="py-7 font-bold rounded-xl border-gray-100 focus-visible:ring-4 focus-within:ring-slate-50 transition-all"
                        placeholder="https://wa.me/5582999999999"
                      />
                    </div>


                    <div className="space-y-3">
                      <Label htmlFor="google_maps_link" className="font-black text-[10px] uppercase tracking-widest text-gray-400">Localização (Link GPS ou Endereço)</Label>
                      <Input 
                        id="google_maps_link" 
                        value={partnerForm.google_maps_link || ''} 
                        onChange={(e) => setPartnerForm({...partnerForm, google_maps_link: e.target.value})}
                        className="py-7 font-bold rounded-xl border-gray-100 focus-visible:ring-4 focus-within:ring-slate-50 transition-all"
                        placeholder="Link do Google Maps ou Nome do local"
                      />
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight italic">* O sistema tenta extrair coordenadas automaticamente se for um link do Maps.</p>
                    </div>
                  </div>
                </div>
              <div className="space-y-4 md:col-span-2">
                <div className="flex items-center justify-between">
                  <Label className="font-black text-xs uppercase tracking-widest text-[#0F172A]">Localização no Mapa</Label>
                  <span className="text-[10px] text-[#0F172A] font-black bg-[#0F172A]/5 px-2.5 py-1 rounded-md">TOQUE NO MAPA PARA MARCAR</span>
                </div>
                <div className="h-[250px] min-h-[250px] w-full rounded-xl overflow-hidden border border-gray-100 shadow-inner z-0 ring-4 ring-gray-50/50">
                  <MapContainer 
                    center={[-9.6498, -35.7089]} 
                    zoom={9} 
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={true}
                  >
                    <MapResizeHandler />
                    <TileLayer
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                      attribution='&copy; Esri'
                    />
                    <TileLayer
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                      attribution='&copy; Esri'
                    />
                    <SearchField 
                      onLocationSelect={(lat, lng) => {
                        setPartnerForm({ ...partnerForm, latitude: lat, longitude: lng });
                        toast.success("Localização encontrada!");
                      }} 
                    />
                    <LocationPicker 
                      position={partnerForm.latitude && partnerForm.longitude ? [partnerForm.latitude, partnerForm.longitude] : undefined}
                      onLocationSelect={(lat, lng) => {
                        setPartnerForm({ ...partnerForm, latitude: lat, longitude: lng });
                        toast.success("Pin posicionado com sucesso!");
                      }} 
                    />
                  </MapContainer>
                </div>
              </div>

              {/* Hidden Lat/Lng fields - State is updated via map or link extraction */}
              <input type="hidden" name="latitude" value={partnerForm.latitude || ''} />
              <input type="hidden" name="longitude" value={partnerForm.longitude || ''} />


              <div className="space-y-4 md:col-span-2">
                <Label className="font-black text-xs uppercase tracking-widest text-gray-400">Imagem de Destaque</Label>
                
                <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
                  <button
                    type="button"
                    onClick={() => setUploadModes(prev => ({ ...prev, partner: 'file' }))}
                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                      uploadModes.partner === 'file' 
                        ? 'bg-white text-ocean shadow-sm' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Fazer Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadModes(prev => ({ ...prev, partner: 'link' }))}
                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                      uploadModes.partner === 'link' 
                        ? 'bg-white text-ocean shadow-sm' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Colar Link
                  </button>
                </div>

                <div className="flex items-center gap-6 p-6 bg-gray-50/50 border border-gray-100 rounded-xl group transition-all">
                  <div className="relative w-28 h-28 rounded-xl overflow-hidden shadow-md ring-4 ring-white shrink-0">
                    <img src={partnerForm.image} className="w-full h-full object-cover" />
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    {uploadModes.partner === 'file' ? (
                      <div className="space-y-3">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-tight">Envie uma foto do seu dispositivo</p>
                        <Button 
                          type="button" 
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          className="bg-white text-[#0F172A] border border-gray-100 font-black px-6 py-3 rounded-lg shadow-sm hover:bg-gray-50 transition-all flex items-center gap-2 w-fit"
                        >
                          <Upload size={16} />
                          {isUploading ? 'Enviando...' : 'Selecionar Arquivo'}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-tight">Cole a URL da imagem externa</p>
                        <Input 
                          value={partnerForm.image} 
                          onChange={(e) => setPartnerForm({...partnerForm, image: e.target.value})}
                          className="rounded-lg border-gray-100 py-4 h-12 text-sm focus:ring-2 focus:ring-[#0F172A]/5"
                          placeholder="https://exemplo.com/imagem.jpg"
                        />
                      </div>
                    )}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      className="hidden" 
                      accept="image/*"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 md:col-span-2">
                <Label className="font-black text-xs uppercase tracking-widest text-gray-400">Galeria de Fotos (Destaque + Extras)</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(partnerForm.images || []).map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 group">
                      <img src={img} className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => {
                          const newImages = (partnerForm.images || []).filter((_, i) => i !== idx);
                          setPartnerForm({...partnerForm, images: newImages});
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full transition-opacity"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  <div className="flex flex-col gap-2">
                    <button 
                      type="button"
                      disabled={isUploading}
                      onClick={() => galleryFileInputRef.current?.click()}
                      className="w-full h-12 rounded-xl border-2 border-dashed border-gray-100 flex items-center justify-center gap-2 text-gray-400 hover:bg-gray-50 transition-all"
                    >
                      <Plus size={16} />
                      <span className="text-[10px] font-black uppercase">Upload</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        const url = window.prompt('Cole a URL da imagem:');
                        if (url) {
                          setPartnerForm(prev => ({
                            ...prev,
                            images: [...(prev.images || []), url]
                          }));
                        }
                      }}
                      className="w-full h-12 rounded-xl border-2 border-dashed border-gray-100 flex items-center justify-center gap-2 text-gray-400 hover:bg-gray-50 transition-all"
                    >
                      <ExternalLink size={16} />
                      <span className="text-[10px] font-black uppercase">Link URL</span>
                    </button>
                  </div>
                  <input 
                    type="file" 
                    ref={galleryFileInputRef} 
                    onChange={handleGalleryFileChange} 
                    className="hidden" 
                    accept="image/*"
                    multiple
                  />
                </div>
              </div>

              <div className="space-y-3 md:col-span-2">
                <Label htmlFor="description" className="font-black text-xs uppercase tracking-widest text-gray-400">Descrição Detalhada</Label>
                <Textarea 
                  id="description" 
                  value={partnerForm.description} 
                  onChange={(e) => setPartnerForm({...partnerForm, description: e.target.value})}
                  className="rounded-xl border-gray-100 min-h-[120px] p-5 focus:ring-4 focus:ring-slate-50 transition-all font-medium leading-relaxed"
                  placeholder="Conte mais sobre este parceiro..."
                  required 
                />
              </div>

              <div className="space-y-4 md:col-span-2">
                <Label className="font-black text-xs uppercase tracking-widest text-gray-400">Opções de Reserva/Ingresso</Label>
                <div className="space-y-3">
                  {(partnerForm.reservation_options || []).map((opt, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input 
                        placeholder="Nome (ex: Mesa 4 pessoas)" 
                        value={opt.name}
                        onChange={(e) => {
                          const newOpts = [...(partnerForm.reservation_options || [])];
                          newOpts[idx].name = e.target.value;
                          setPartnerForm({...partnerForm, reservation_options: newOpts});
                        }}
                        className="rounded-xl border-gray-100 py-6"
                      />
                      <Input 
                        placeholder="Valor (ex: R$ 120,00)" 
                        value={opt.price}
                        onChange={(e) => {
                          const newOpts = [...(partnerForm.reservation_options || [])];
                          newOpts[idx].price = e.target.value;
                          setPartnerForm({...partnerForm, reservation_options: newOpts});
                        }}
                        className="rounded-xl border-gray-100 py-6 w-32"
                      />
                      <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={() => {
                          const newOpts = partnerForm.reservation_options?.filter((_, i) => i !== idx);
                          setPartnerForm({...partnerForm, reservation_options: newOpts});
                        }}
                        className="text-red-500"
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  ))}
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setPartnerForm({
                        ...partnerForm, 
                        reservation_options: [...(partnerForm.reservation_options || []), { name: '', price: '' }]
                      });
                    }}
                    className="w-full border-dashed border-gray-200 text-gray-400 font-bold text-xs py-6 rounded-xl"
                  >
                    + Adicionar Opção de Reserva
                  </Button>
                </div>
              </div>

              <div className="md:col-span-2 p-5 bg-blue-50/30 rounded-xl border border-blue-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <Label htmlFor="show_reservation_button" className="font-black text-sm text-[#0F172A] cursor-pointer">Ativar Botão "RESERVAR"</Label>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Permite que turistas façam reservas pelo WhatsApp</p>
                  </div>
                </div>
                <input 
                  id="show_reservation_button" 
                  type="checkbox" 
                  checked={partnerForm.show_reservation_button} 
                  onChange={(e) => setPartnerForm({...partnerForm, show_reservation_button: e.target.checked})}
                  className="w-6 h-6 rounded-md border-gray-200 text-blue-500 focus:ring-blue-500 transition-all cursor-pointer"
                />
              </div>


              <div className="md:col-span-2 p-5 bg-orange-50/30 rounded-xl border border-orange-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                    <Ticket size={20} />
                  </div>
                  <div>
                    <Label htmlFor="isPremium" className="font-black text-sm text-[#0F172A] cursor-pointer">Destacar como VIP</Label>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Aparecerá com destaque para os turistas</p>
                  </div>
                </div>
                <input 
                  id="isPremium" 
                  type="checkbox" 
                  checked={partnerForm.isPremium} 
                  onChange={(e) => setPartnerForm({...partnerForm, isPremium: e.target.checked})}
                  className="w-6 h-6 rounded-md border-gray-200 text-orange-500 focus:ring-orange-500 transition-all cursor-pointer"
                />
              </div>
            </div>
            </div>
            <DialogFooter className="p-8 bg-gray-50/50 border-t border-gray-100 flex flex-col md:flex-row gap-3">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="flex-1 md:flex-none border-gray-100 text-gray-400 font-black px-8 py-6 rounded-xl hover:bg-gray-100 hover:text-gray-600">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" className="flex-1 bg-[#22c55e] hover:bg-[#1eb054] text-white font-black px-8 py-6 rounded-xl shadow-xl shadow-green-100 flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
                <Save size={18} />
                {editingPartner ? 'Salvar Alterações' : 'Confirmar Cadastro'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Admin Modal */}
      <Dialog open={isAdminModalOpen} onOpenChange={setIsAdminModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <DialogTitle className="sr-only">Adicionar Postagem</DialogTitle>
          <DialogHeader className="p-8 pb-4 bg-gray-50/50">
            <DialogTitle className="text-2xl font-black text-ocean tracking-tight flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-ocean/10 flex items-center justify-center text-ocean">
                <Users size={24} />
              </div>
              Novo Administrador
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateAdmin} className="p-8 pt-4 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-name" className="font-bold text-gray-700">Nome Completo</Label>
                <Input
                  id="admin-name"
                  value={adminForm.name}
                  onChange={(e) => setAdminForm({...adminForm, name: e.target.value})}
                  placeholder="Nome do novo admin"
                  className="rounded-xl border-gray-100 py-6"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-email" className="font-bold text-gray-700">E-mail</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({...adminForm, email: e.target.value})}
                  placeholder="exemplo@email.com"
                  className="rounded-xl border-gray-100 py-6"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password" className="font-bold text-gray-700">Senha Temporária</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={adminForm.password}
                  onChange={(e) => setAdminForm({...adminForm, password: e.target.value})}
                  placeholder="No mínimo 6 caracteres"
                  className="rounded-xl border-gray-100 py-6"
                  required
                />
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="rounded-xl border-gray-100 font-bold py-6">
                  Cancelar
                </Button>
              </DialogClose>
              <Button 
                type="submit" 
                disabled={isAdminCreating}
                className="bg-vibrant-green hover:bg-[#1eb054] text-white font-black py-6 rounded-xl shadow-xl shadow-vibrant-green/10 flex items-center justify-center gap-2 flex-1"
              >
                {isAdminCreating ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Plus size={18} />
                )}
                {isAdminCreating ? 'Criando...' : 'Criar Administrador'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Coupon Modal */}
      <Dialog open={isCouponModalOpen} onOpenChange={setIsCouponModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-xl overflow-hidden p-0 border-none shadow-2xl flex flex-col max-h-[90vh]">
          <DialogTitle className="sr-only">Editar Postagem</DialogTitle>
          <DialogHeader className="p-8 pb-4 bg-gray-50/50">
            <DialogTitle className="text-2xl font-black text-[#0F172A] tracking-tight">
              {editingCoupon ? 'Editar Cupom' : 'Novo Cupom'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveCoupon} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-8 pt-4 space-y-6">
              <div className="space-y-3">
                <Label htmlFor="title" className="font-black text-xs uppercase tracking-widest text-gray-400">Título da Promoção</Label>
                <Input 
                  id="title" 
                  value={couponForm.title} 
                  onChange={(e) => setCouponForm({...couponForm, title: e.target.value})}
                  className="rounded-xl border-gray-100 py-7 focus:ring-4 focus:ring-slate-50 transition-all font-bold"
                  placeholder="Ex: 15% de desconto no almoço"
                  required 
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="code" className="font-black text-xs uppercase tracking-widest text-gray-400">Código do Cupom (para resgate)</Label>
                <Input 
                  id="code" 
                  value={couponForm.code || ''} 
                  onChange={(e) => {
                    const newValue = e.target.value.toUpperCase();
                    setCouponForm(prev => ({...prev, code: newValue}));
                  }}
                  className="rounded-xl border-gray-100 py-7 focus:ring-4 focus:ring-slate-50 transition-all font-bold uppercase"
                  placeholder="Ex: VIPALAGOAS10"
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="discount" className="font-black text-xs uppercase tracking-widest text-gray-400">Desconto (%)</Label>
                  <Input 
                    id="discount" 
                    value={couponForm.discount} 
                    onChange={(e) => setCouponForm({...couponForm, discount: e.target.value})}
                    className="rounded-xl border-gray-100 py-7 focus:ring-4 focus:ring-slate-50 transition-all font-black text-[#22c55e]"
                    placeholder="Ex: 15%"
                    required 
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="validUntil" className="font-black text-xs uppercase tracking-widest text-gray-400">Data de Expiração</Label>
                  <Input 
                    id="validUntil" 
                    type="date"
                    value={couponForm.validUntil} 
                    onChange={(e) => setCouponForm({...couponForm, validUntil: e.target.value})}
                    className="rounded-xl border-gray-100 py-7 focus:ring-4 focus:ring-slate-50 transition-all font-bold"
                    required 
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label htmlFor="partnerId" className="font-black text-xs uppercase tracking-widest text-gray-400">Vincular a um Parceiro</Label>
                <Select 
                  value={couponForm.partnerId} 
                  onValueChange={(val) => setCouponForm({...couponForm, partnerId: val})}
                >
                  <SelectTrigger className="rounded-xl border-gray-100 h-[56px] focus:ring-4 focus:ring-slate-50 transition-all font-bold">
                    <SelectValue placeholder="Selecione o estabelecimento" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-white border-gray-100 shadow-2xl">
                    {partners.map(p => (
                      <SelectItem key={p.id} value={p.id} className="font-bold py-3">{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-5 bg-orange-50/30 rounded-xl border border-orange-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                    <Ticket size={20} />
                  </div>
                  <div>
                    <Label htmlFor="couponIsPremium" className="font-black text-sm text-[#0F172A] cursor-pointer">Cupom Exclusivo VIP</Label>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Apenas assinantes poderão resgatar</p>
                  </div>
                </div>
                <input 
                  id="couponIsPremium" 
                  type="checkbox" 
                  checked={couponForm.isPremium} 
                  onChange={(e) => setCouponForm({...couponForm, isPremium: e.target.checked})}
                  className="w-6 h-6 rounded-md border-gray-200 text-orange-500 focus:ring-orange-500 transition-all cursor-pointer"
                />
              <div className="p-5 bg-blue-50/30 rounded-xl border border-blue-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                    <Check size={20} />
                  </div>
                  <div>
                    <Label htmlFor="couponStatus" className="font-black text-sm text-[#0F172A] cursor-pointer">Cupom Ativo</Label>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Define se o cupom aparece para os turistas</p>
                  </div>
                </div>
                <input 
                  id="couponStatus" 
                  type="checkbox" 
                  checked={couponForm.status === 'active'} 
                  onChange={(e) => setCouponForm({...couponForm, status: e.target.checked ? 'active' : 'inactive'})}
                  className="w-6 h-6 rounded-md border-gray-200 text-blue-500 focus:ring-blue-500 transition-all cursor-pointer"
                />
              </div>

            </div>
            </div>
            <DialogFooter className="p-8 bg-gray-50/50 border-t border-gray-100 flex flex-col md:flex-row gap-3">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="flex-1 md:flex-none border-gray-100 text-gray-400 font-black px-8 py-6 rounded-xl hover:bg-gray-100">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" className="flex-1 bg-[#22c55e] hover:bg-[#1eb054] text-white font-black px-8 py-6 rounded-xl shadow-xl shadow-green-100 flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
                <Save size={18} />
                {editingCoupon ? 'Atualizar Cupom' : 'Criar Cupom Agora'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Video Modal */}
      <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-xl overflow-hidden p-0 border-none shadow-2xl flex flex-col max-h-[90vh]">
          <DialogTitle className="sr-only">Adicionar Cupom</DialogTitle>
          <DialogHeader className="p-8 pb-4 bg-gray-50/50">
            <DialogTitle className="text-2xl font-black text-[#0F172A] tracking-tight">
              {editingVideo ? 'Editar Vídeo' : 'Novo Vídeo'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveVideo} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-8 pt-4 space-y-6">
              <div className="space-y-3">
                <Label htmlFor="v-title" className="font-black text-xs uppercase tracking-widest text-gray-400">Título do Vídeo</Label>
                <Input 
                  id="v-title" 
                  value={videoForm.title} 
                  onChange={(e) => setVideoForm({...videoForm, title: e.target.value})}
                  className="rounded-xl border-gray-100 py-7 focus:ring-4 focus:ring-slate-50 transition-all font-bold"
                  placeholder="Ex: Pôr do sol na Lagoa"
                  required 
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="v-description" className="font-black text-xs uppercase tracking-widest text-gray-400">Descrição</Label>
                <Textarea 
                  id="v-description" 
                  value={videoForm.description} 
                  onChange={(e) => setVideoForm({...videoForm, description: e.target.value})}
                  className="rounded-xl border-gray-100 p-5 min-h-[100px] focus:ring-4 focus:ring-slate-50 transition-all font-medium leading-relaxed"
                  placeholder="Descreva brevemente o conteúdo..."
                />
              </div>

              <div className="space-y-4">
                <Label className="font-black text-xs uppercase tracking-widest text-[#0F172A]">Mídia e Capa</Label>
                
                <div className="flex items-center justify-between">
                  <Label className="font-black text-xs uppercase tracking-widest text-gray-400">Vídeo</Label>
                  <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setUploadModes(prev => ({ ...prev, video: 'file' }))}
                      className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                        uploadModes.video === 'file' 
                          ? 'bg-white text-ocean shadow-sm' 
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      Fazer Upload
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadModes(prev => ({ ...prev, video: 'link' }))}
                      className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                        uploadModes.video === 'link' 
                          ? 'bg-white text-ocean shadow-sm' 
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      Colar Link
                    </button>
                  </div>
                </div>

                {uploadModes.video === 'file' ? (
                  <div 
                    onClick={() => !isUploading && videoFileInputRef.current?.click()}
                    className={`aspect-video rounded-xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center cursor-pointer hover:border-[#22c55e] hover:bg-green-50/30 transition-all overflow-hidden bg-gray-50/50 group relative ${isUploading ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    {isUploading ? (
                      <Loader2 className="w-8 h-8 animate-spin text-[#22c55e]" />
                    ) : videoForm.url ? (
                      <div className="w-full h-full relative">
                        <VideoPlayer url={videoForm.url} />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity">
                          <span className="text-white text-[10px] font-black uppercase tracking-widest">Trocar Vídeo</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="text-gray-300 group-hover:text-[#22c55e] mb-2" size={24} />
                        <span className="text-[10px] font-black text-gray-400 group-hover:text-[#22c55e] uppercase tracking-widest">Vídeo</span>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-tight">URL do Vídeo (YouTube ou Direto)</p>
                    <Input 
                      value={videoForm.url} 
                      onChange={(e) => setVideoForm({...videoForm, url: e.target.value})}
                      className="rounded-lg border-gray-100 py-4 h-12 text-sm focus:ring-2 focus:ring-[#0F172A]/5"
                      placeholder="https://youtube.com/watch?v=..."
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label className="font-black text-xs uppercase tracking-widest text-gray-400">Capa do Vídeo</Label>
                  <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setUploadModes(prev => ({ ...prev, thumbnail: 'file' }))}
                      className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                        uploadModes.thumbnail === 'file' 
                          ? 'bg-white text-ocean shadow-sm' 
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      Fazer Upload
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadModes(prev => ({ ...prev, thumbnail: 'link' }))}
                      className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                        uploadModes.thumbnail === 'link' 
                          ? 'bg-white text-ocean shadow-sm' 
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      Colar Link
                    </button>
                  </div>
                </div>

                {uploadModes.thumbnail === 'file' ? (
                  <div 
                    onClick={() => videoThumbnailRef.current?.click()}
                    className="aspect-video rounded-xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center cursor-pointer hover:border-[#22c55e] hover:bg-green-50/30 transition-all overflow-hidden bg-gray-50/50 group relative"
                  >
                    {videoForm.thumbnail ? (
                      <div className="w-full h-full relative">
                        <img src={videoForm.thumbnail} alt="Capa" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity">
                          <span className="text-white text-[10px] font-black uppercase tracking-widest">Trocar Capa</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="text-gray-300 group-hover:text-[#22c55e] mb-2" size={24} />
                        <span className="text-[10px] font-black text-gray-400 group-hover:text-[#22c55e] uppercase tracking-widest">Miniatura</span>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-tight">URL da Capa (Link da Imagem)</p>
                    <Input 
                      value={videoForm.thumbnail} 
                      onChange={(e) => setVideoForm({...videoForm, thumbnail: e.target.value})}
                      className="rounded-lg border-gray-100 py-4 h-12 text-sm focus:ring-2 focus:ring-[#0F172A]/5"
                      placeholder="https://exemplo.com/imagem.jpg"
                    />
                  </div>
                )}
                
                <input type="file" ref={videoFileInputRef} onChange={handleVideoFileChange} accept="video/*" className="hidden" />
                <input type="file" ref={videoThumbnailRef} onChange={handleThumbnailFileChange} accept="image/*" className="hidden" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="v-category" className="font-black text-xs uppercase tracking-widest text-gray-400">Categoria</Label>
                  <Select value={videoForm.category} onValueChange={(val: any) => setVideoForm({...videoForm, category: val})}>
                    <SelectTrigger className="rounded-xl border-gray-100 h-[56px] focus:ring-4 focus:ring-slate-50 transition-all font-bold">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-white border-gray-100 shadow-2xl">
                      <SelectItem value="Praias" className="font-bold py-3">Praias</SelectItem>
                      <SelectItem value="Restaurantes" className="font-bold py-3">Restaurantes</SelectItem>
                      <SelectItem value="Passeios" className="font-bold py-3">Passeios</SelectItem>
                      <SelectItem value="Eventos" className="font-bold py-3">Eventos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="v-partnerId" className="font-black text-xs uppercase tracking-widest text-gray-400">Parceiro</Label>
                  <Select value={videoForm.partnerId} onValueChange={(val) => setVideoForm({...videoForm, partnerId: val})}>
                    <SelectTrigger className="rounded-xl border-gray-100 h-[56px] focus:ring-4 focus:ring-slate-50 transition-all font-bold">
                      <SelectValue placeholder="Vincular" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-white border-gray-100 shadow-2xl">
                      <SelectItem value="general" className="font-bold py-3 text-gray-400 italic">Sem vínculo</SelectItem>
                      {partners.map(p => (
                        <SelectItem key={p.id} value={p.id} className="font-bold py-3">{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-5 bg-orange-50/30 rounded-xl border border-orange-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                    <PlayCircle size={20} />
                  </div>
                  <div>
                    <Label htmlFor="v-isPremium" className="font-black text-sm text-[#0F172A] cursor-pointer">Conteúdo Exclusivo VIP</Label>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Restrito para assinantes premium</p>
                  </div>
                </div>
                <input 
                  id="v-isPremium" 
                  type="checkbox" 
                  checked={videoForm.isPremium} 
                  onChange={(e) => setVideoForm({...videoForm, isPremium: e.target.checked})}
                  className="w-6 h-6 rounded-md border-gray-200 text-orange-500 focus:ring-orange-500 transition-all cursor-pointer"
                />
              </div>
            </div>
            <DialogFooter className="p-8 bg-gray-50/50 border-t border-gray-100 flex flex-col md:flex-row gap-3">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="flex-1 md:flex-none border-gray-100 text-gray-400 font-black px-8 py-6 rounded-xl hover:bg-gray-100">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" className="flex-1 bg-[#22c55e] hover:bg-[#1eb054] text-white font-black px-8 py-6 rounded-xl shadow-xl shadow-green-100 flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
                <Play size={18} fill="currentColor" />
                {editingVideo ? 'Atualizar Vídeo' : 'Publicar Vídeo'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Roteiro VIP Modal */}
      <Dialog open={isRoteiroModalOpen} onOpenChange={setIsRoteiroModalOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-2xl overflow-hidden p-0 border-none shadow-2xl flex flex-col max-h-[90vh]">
          <DialogTitle className="sr-only">Editar Cupom</DialogTitle>
          <DialogHeader className="p-8 pb-4 bg-gray-50/50">
            <DialogTitle className="text-2xl font-black text-[#0F172A] tracking-tight">
              {editingRoteiro ? 'Editar Roteiro VIP' : 'Novo Roteiro VIP'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveRoteiro} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-8 pt-4 space-y-6">
              <div className="space-y-4">
                <Label className="font-black text-xs uppercase tracking-widest text-gray-400">Imagem de Capa do Roteiro</Label>
                
                <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
                  <button
                    type="button"
                    onClick={() => setUploadModes(prev => ({ ...prev, roteiro: 'file' }))}
                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                      uploadModes.roteiro === 'file' 
                        ? 'bg-white text-ocean shadow-sm' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Fazer Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadModes(prev => ({ ...prev, roteiro: 'link' }))}
                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                      uploadModes.roteiro === 'link' 
                        ? 'bg-white text-ocean shadow-sm' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Colar Link
                  </button>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 group">
                    {(roteiroForm.image_url || roteiroForm.icone_url) ? (
                      <img src={roteiroForm.image_url || roteiroForm.icone_url} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Upload size={32} />
                      </div>
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-3">
                    {uploadModes.roteiro === 'file' ? (
                      <Button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="bg-white text-ocean border border-gray-100 font-black px-6 py-2 rounded-xl w-fit"
                      >
                        <Upload size={16} className="mr-2" />
                        {isUploading ? 'Enviando...' : 'Selecionar Imagem'}
                      </Button>
                    ) : (
                      <Input 
                        value={roteiroForm.image_url || roteiroForm.icone_url || ''} 
                        onChange={(e) => setRoteiroForm({...roteiroForm, image_url: e.target.value, icone_url: e.target.value})}
                        className="rounded-xl border-gray-100 h-12"
                        placeholder="https://exemplo.com/roteiro.jpg"
                      />
                    )}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setIsUploading(true);
                          try {
                            const fileExt = file.name.split('.').pop();
                            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
                            const { error } = await supabase.storage.from('partners').upload(fileName, file);
                            if (error) throw error;
                            const { data: { publicUrl } } = supabase.storage.from('partners').getPublicUrl(fileName);
                            setRoteiroForm({ ...roteiroForm, image_url: publicUrl, icone_url: publicUrl });
                            toast.success('Imagem enviada!');
                          } catch (err) {
                            toast.error('Erro ao enviar imagem');
                          } finally {
                            setIsUploading(false);
                          }
                        }
                      }} 
                      className="hidden" 
                      accept="image/*"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="r-titulo" className="font-black text-xs uppercase tracking-widest text-gray-400">Título do Roteiro</Label>
                  <Input 
                    id="r-titulo" 
                    value={roteiroForm.titulo} 
                    onChange={(e) => setRoteiroForm({...roteiroForm, titulo: e.target.value})}
                    className="rounded-xl border-gray-100 py-6 font-bold"
                    placeholder="Título do roteiro"
                    required 
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="r-subtitulo" className="font-black text-xs uppercase tracking-widest text-gray-400">Subtítulo</Label>
                  <Input 
                    id="r-subtitulo" 
                    value={roteiroForm.subtitulo} 
                    onChange={(e) => setRoteiroForm({...roteiroForm, subtitulo: e.target.value})}
                    className="rounded-xl border-gray-100 py-6 font-bold"
                    placeholder="Subtítulo curto"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="r-descricao" className="font-black text-xs uppercase tracking-widest text-gray-400">Descrição Geral</Label>
                <Textarea 
                  id="r-descricao" 
                  value={roteiroForm.descricao_completa} 
                  onChange={(e) => setRoteiroForm({...roteiroForm, descricao_completa: e.target.value})}
                  className="rounded-xl border-gray-100 min-h-[100px] p-5 font-medium"
                  placeholder="Detalhes gerais..."
                  required 
                />
              </div>

              {/* Dynamic steps section */}
              <div className="space-y-6 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <Label className="font-black text-xs uppercase tracking-widest text-ocean/50">Paradas / Timeline do Dia</Label>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      const newPassos = [...(roteiroForm.passos || []), {
                        id: crypto.randomUUID(),
                        roteiro_id: editingRoteiro?.id || '',
                        horario: '',
                        titulo: '',
                        descricao: '',
                        image_url: '',
                        ordem: (roteiroForm.passos?.length || 0)
                      }];
                      setRoteiroForm({...roteiroForm, passos: newPassos});
                    }}
                    className="rounded-xl border-vibrant-green/20 text-vibrant-green font-bold text-xs h-10 px-4 hover:bg-vibrant-green hover:text-white transition-all"
                  >
                    <PlusCircle size={14} className="mr-2" />
                    Adicionar Parada
                  </Button>
                </div>

                <div className="space-y-8">
                  {roteiroForm.passos?.map((passo, index) => (
                    <div key={index} className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 space-y-4 relative group/step">
                      <button 
                        type="button"
                        onClick={() => {
                          const newPassos = roteiroForm.passos?.filter((_, i) => i !== index);
                          setRoteiroForm({...roteiroForm, passos: newPassos});
                        }}
                        className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-50 text-red-500 border border-red-100 flex items-center justify-center transition-all shadow-sm z-10"
                      >
                        <X size={14} />
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-3 space-y-2">
                          <Label className="text-[10px] font-black uppercase text-gray-400">Horário</Label>
                          <div className="relative">
                            <Clock size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                            <Input 
                              value={passo.horario}
                              onChange={(e) => {
                                const newPassos = [...(roteiroForm.passos || [])];
                                newPassos[index].horario = e.target.value;
                                setRoteiroForm({...roteiroForm, passos: newPassos});
                              }}
                              className="rounded-xl border-gray-100 pl-8 h-10 font-bold"
                              placeholder="08:00"
                            />
                          </div>
                        </div>
                        <div className="md:col-span-9 space-y-2">
                          <Label className="text-[10px] font-black uppercase text-gray-400">Título da Parada</Label>
                          <Input 
                            value={passo.titulo}
                            onChange={(e) => {
                              const newPassos = [...(roteiroForm.passos || [])];
                              newPassos[index].titulo = e.target.value;
                              setRoteiroForm({...roteiroForm, passos: newPassos});
                            }}
                            className="rounded-xl border-gray-100 h-10 font-bold"
                            placeholder="Ex: Café da manhã na Padaria"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-gray-400">Descrição da Atividade</Label>
                        <Textarea 
                          value={passo.descricao}
                          onChange={(e) => {
                            const newPassos = [...(roteiroForm.passos || [])];
                            newPassos[index].descricao = e.target.value;
                            setRoteiroForm({...roteiroForm, passos: newPassos});
                          }}
                          className="rounded-xl border-gray-100 min-h-[80px] font-medium"
                          placeholder="O que fazer neste local..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-gray-400">Link do Google Maps</Label>
                        <Input 
                          value={passo.google_maps_url || ''}
                          onChange={(e) => {
                            const newPassos = [...(roteiroForm.passos || [])];
                            newPassos[index].google_maps_url = e.target.value;
                            setRoteiroForm({...roteiroForm, passos: newPassos});
                          }}
                          className="rounded-xl border-gray-100 h-10 font-medium"
                          placeholder="Link para este local..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-gray-400">Foto do Local</Label>
                        <div className="flex gap-2">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-100">
                            {passo.image_url ? (
                              <img src={passo.image_url} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <ImageIcon size={16} />
                              </div>
                            )}
                          </div>
                          <Input 
                            value={passo.image_url}
                            onChange={(e) => {
                              const newPassos = [...(roteiroForm.passos || [])];
                              newPassos[index].image_url = e.target.value;
                              setRoteiroForm({...roteiroForm, passos: newPassos});
                            }}
                            className="rounded-xl border-gray-100 h-10 flex-1 text-xs"
                            placeholder="URL da foto..."
                          />
                          <Button 
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/*';
                              input.onchange = async (e: any) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setIsUploading(true);
                                  try {
                                    const fileExt = file.name.split('.').pop();
                                    const fileName = `step_${index}_${Math.random().toString(36).substring(2)}.${fileExt}`;
                                    const { error } = await supabase.storage.from('partners').upload(fileName, file);
                                    if (error) throw error;
                                    const { data: { publicUrl } } = supabase.storage.from('partners').getPublicUrl(fileName);
                                    const newPassos = [...(roteiroForm.passos || [])];
                                    newPassos[index].image_url = publicUrl;
                                    setRoteiroForm({...roteiroForm, passos: newPassos});
                                    toast.success('Foto da parada enviada!');
                                  } catch (err) {
                                    toast.error('Erro ao enviar foto');
                                  } finally {
                                    setIsUploading(false);
                                  }
                                }
                              };
                              input.click();
                            }}
                            className="rounded-xl h-10 px-3"
                          >
                            <Upload size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {(roteiroForm.passos?.length || 0) === 0 && (
                    <div className="p-10 border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center text-center">
                      <Clock size={32} className="text-gray-200 mb-2" />
                      <p className="text-[10px] font-black uppercase text-gray-300 tracking-widest">Nenhuma parada adicionada</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="space-y-3">
                  <Label htmlFor="r-local" className="font-black text-xs uppercase tracking-widest text-gray-400">Cidade/Região</Label>
                  <Input 
                    id="r-local" 
                    value={roteiroForm.localizacao_nome} 
                    onChange={(e) => setRoteiroForm({...roteiroForm, localizacao_nome: e.target.value})}
                    className="rounded-xl border-gray-100 py-6"
                    placeholder="Ex: Praia do Francês"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="r-maps" className="font-black text-xs uppercase tracking-widest text-gray-400">Link Localização Principal</Label>
                  <Input 
                    id="r-maps" 
                    value={roteiroForm.google_maps_link} 
                    onChange={(e) => setRoteiroForm({...roteiroForm, google_maps_link: e.target.value})}
                    className="rounded-xl border-gray-100 py-6"
                    placeholder="URL do Google Maps"
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="p-8 bg-gray-50/50 border-t border-gray-100 flex flex-col md:flex-row gap-3">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="flex-1 md:flex-none border-gray-100 text-gray-400 font-black px-8 py-6 rounded-xl hover:bg-gray-100">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" className="flex-1 bg-[#22c55e] hover:bg-[#1eb054] text-white font-black px-8 py-6 rounded-xl shadow-xl shadow-green-100 flex items-center justify-center gap-2 transition-all">
                <Save size={18} />
                {editingRoteiro ? 'Atualizar Roteiro' : 'Salvar Roteiro'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Evento VIP Modal */}
      <Dialog open={isEventoModalOpen} onOpenChange={setIsEventoModalOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-2xl overflow-hidden p-0 border-none shadow-2xl flex flex-col max-h-[90vh]">
          <DialogHeader className="p-8 pb-4 bg-gray-50/50">
            <DialogTitle className="text-2xl font-black text-[#0F172A] tracking-tight">
              {editingEvento ? 'Editar Evento VIP' : 'Novo Evento VIP'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEvento} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-8 pt-4 space-y-6">
              <div className="space-y-4">
                <Label className="font-black text-xs uppercase tracking-widest text-gray-400">Imagem de Capa do Evento</Label>
                
                <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
                  <button
                    type="button"
                    onClick={() => setUploadModes(prev => ({ ...prev, evento: 'file' }))}
                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                      uploadModes.evento === 'file' 
                        ? 'bg-white text-ocean shadow-sm' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Fazer Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadModes(prev => ({ ...prev, evento: 'link' }))}
                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                      uploadModes.evento === 'link' 
                        ? 'bg-white text-ocean shadow-sm' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Colar Link
                  </button>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 group">
                    {eventoForm.icone_url ? (
                      <img src={eventoForm.icone_url} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Upload size={32} />
                      </div>
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-3">
                    {uploadModes.evento === 'file' ? (
                      <Button 
                        type="button" 
                        onClick={() => galleryFileInputRef.current?.click()}
                        disabled={isUploading}
                        className="bg-white text-ocean border border-gray-100 font-black px-6 py-2 rounded-xl w-fit"
                      >
                        <Upload size={16} className="mr-2" />
                        {isUploading ? 'Enviando...' : 'Selecionar Imagem'}
                      </Button>
                    ) : (
                      <Input 
                        value={eventoForm.icone_url || ''} 
                        onChange={(e) => setEventoForm({...eventoForm, icone_url: e.target.value})}
                        className="rounded-xl border-gray-100 h-12"
                        placeholder="https://exemplo.com/evento.jpg"
                      />
                    )}
                    <input 
                      type="file" 
                      ref={galleryFileInputRef} 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setIsUploading(true);
                          try {
                            const fileExt = file.name.split('.').pop();
                            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
                            const { error } = await supabase.storage.from('partners').upload(fileName, file);
                            if (error) throw error;
                            const { data: { publicUrl } } = supabase.storage.from('partners').getPublicUrl(fileName);
                            setEventoForm({ ...eventoForm, icone_url: publicUrl });
                            toast.success('Imagem enviada!');
                          } catch (err) {
                            toast.error('Erro ao enviar imagem');
                          } finally {
                            setIsUploading(false);
                          }
                        }
                      }} 
                      className="hidden" 
                      accept="image/*"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="e-titulo" className="font-black text-xs uppercase tracking-widest text-gray-400">Título</Label>
                  <Input 
                    id="e-titulo" 
                    value={eventoForm.titulo} 
                    onChange={(e) => setEventoForm({...eventoForm, titulo: e.target.value})}
                    className="rounded-xl border-gray-100 py-6 font-bold"
                    placeholder="Título do evento"
                    required 
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="e-data" className="font-black text-xs uppercase tracking-widest text-gray-400">Data e Hora</Label>
                  <Input 
                    id="e-data" 
                    type="datetime-local"
                    value={eventoForm.data_categoria} 
                    onChange={(e) => setEventoForm({...eventoForm, data_categoria: e.target.value})}
                    className="rounded-xl border-gray-100 py-6 font-bold"
                    required 
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="e-descricao" className="font-black text-xs uppercase tracking-widest text-gray-400">Descrição Completa</Label>
                <Textarea 
                  id="e-descricao" 
                  value={eventoForm.descricao_completa} 
                  onChange={(e) => setEventoForm({...eventoForm, descricao_completa: e.target.value})}
                  className="rounded-xl border-gray-100 min-h-[120px] p-5 font-medium"
                  placeholder="Detalhes do evento..."
                  required 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="e-local" className="font-black text-xs uppercase tracking-widest text-gray-400">Nome do Local</Label>
                  <Input 
                    id="e-local" 
                    value={eventoForm.localizacao_nome} 
                    onChange={(e) => setEventoForm({...eventoForm, localizacao_nome: e.target.value})}
                    className="rounded-xl border-gray-100 py-6"
                    placeholder="Ex: Restaurante X"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="e-maps" className="font-black text-xs uppercase tracking-widest text-gray-400">Link Localização (Google Maps)</Label>
                  <Input 
                    id="e-maps" 
                    value={eventoForm.google_maps_link} 
                    onChange={(e) => setEventoForm({...eventoForm, google_maps_link: e.target.value})}
                    className="rounded-xl border-gray-100 py-6"
                    placeholder="URL do Google Maps"
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="p-8 bg-gray-50/50 border-t border-gray-100 flex flex-col md:flex-row gap-3">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="flex-1 md:flex-none border-gray-100 text-gray-400 font-black px-8 py-6 rounded-xl hover:bg-gray-100">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" className="flex-1 bg-[#22c55e] hover:bg-[#1eb054] text-white font-black px-8 py-6 rounded-xl shadow-xl shadow-green-100 flex items-center justify-center gap-2 transition-all">
                <Save size={18} />
                {editingEvento ? 'Atualizar Evento' : 'Salvar Evento'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Video Preview Modal */}
      <Dialog open={!!selectedVideoForPreview} onOpenChange={(open) => !open && setSelectedVideoForPreview(null)}>
        <DialogContent className="sm:max-w-[800px] p-0 bg-black border-none rounded-[32px] overflow-hidden aspect-[9/16] md:aspect-video flex items-center justify-center">
          <DialogTitle className="sr-only">Visualizar Vídeo</DialogTitle>
          <DialogTitle className="sr-only">Visualização de Vídeo</DialogTitle>
          {selectedVideoForPreview && (
            <div className="w-full h-full relative">
              <button 
                onClick={() => setSelectedVideoForPreview(null)}
                className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 hover:bg-white/20 transition-all"
              >
                <X size={20} />
              </button>
              <VideoPlayer 
                url={selectedVideoForPreview.url} 
                className="w-full h-full"
              />
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 via-black/40 to-transparent text-white pointer-events-none">
                <h3 className="text-2xl font-black mb-1 tracking-tight">{selectedVideoForPreview.title}</h3>
                <p className="text-sm opacity-70 font-medium leading-relaxed max-w-lg">{selectedVideoForPreview.description}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Story Viewer for Notifications */}
      {activeStoryIndex !== null && (
        <StoryViewer 
          videos={videos}
          initialIndex={activeStoryIndex}
          startWithCommentsOpen={shouldOpenComments}
          onClose={() => {
            setActiveStoryIndex(null);
            setShouldOpenComments(false);
          }}
        />
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
