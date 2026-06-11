import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Partner, Coupon, Video, UserRole, Category, Review, RoteiroVIP, EventoVIP, FinancialConfig, AppSettings } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

interface VipConfig {
  id: string;
  preco_anual: string;
  vip_plan_duration_months?: number | null;
  link_checkout?: string;
}

interface GeneralConfig {
  id: string;
  whatsapp_link: string;
}

interface AppContextType {
  userRole: UserRole;
  isPremiumUser: boolean;
  isUserPremium: () => boolean;
  setIsPremiumUser: (status: boolean) => Promise<void>;
  currentLocation: string;
  setCurrentLocation: (loc: string) => void;
  partners: Partner[];
  addPartner: (partner: Omit<Partner, 'id'>) => Promise<void>;
  updatePartner: (partner: Partner) => Promise<void>;
  deletePartner: (id: string) => Promise<void>;
  addReview: (partnerId: string, review: Omit<Review, 'id' | 'date'>) => Promise<void>;
  deleteReview: (reviewId: string, partnerId: string) => Promise<void>;
  updateReview: (reviewId: string, partnerId: string, rating: number, comment: string) => Promise<void>;
  coupons: Coupon[];
  allCoupons: Coupon[];
  addCoupon: (coupon: Omit<Coupon, 'id'>) => Promise<void>;
  updateCoupon: (coupon: Coupon) => Promise<void>;
  deleteCoupon: (id: string) => Promise<void>;
  videos: Video[];
  addVideo: (video: Omit<Video, 'id' | 'likesCount' | 'commentsCount'>) => Promise<void>;
  updateVideo: (video: Video) => Promise<void>;
  deleteVideo: (id: string) => Promise<void>;
  toggleVideoLike: (videoId: string) => Promise<void>;
  addVideoComment: (videoId: string, content: string) => Promise<void>;
  deleteVideoComment: (commentId: string, videoId: string) => Promise<void>;
  updateVideoComment: (commentId: string, content: string) => Promise<void>;
  notifications: any[];
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  favorites: string[];
  toggleFavorite: (partnerId: string) => Promise<void>;
  isFavorite: (partnerId: string) => boolean;
  roteirosVip: RoteiroVIP[];
  addRoteiroVip: (roteiro: Omit<RoteiroVIP, 'id'>) => Promise<void>;
  updateRoteiroVip: (roteiro: RoteiroVIP) => Promise<void>;
  deleteRoteiroVip: (id: string) => Promise<void>;
  eventosVip: EventoVIP[];
  addEventoVip: (evento: Omit<EventoVIP, 'id'>) => Promise<void>;
  updateEventoVip: (evento: EventoVIP) => Promise<void>;
  deleteEventoVip: (id: string) => Promise<void>;
  showUpsell: boolean;
  setShowUpsell: (status: boolean) => void;
  isLoading: boolean;
  vipConfig: VipConfig | null;
  updateVipConfig: (config: Partial<VipConfig>) => Promise<void>;
  generalConfig: GeneralConfig | null;
  updateGeneralConfig: (config: Partial<GeneralConfig>) => Promise<void>;
  serverDate: Date;
  financialConfig: FinancialConfig | null;
  updateFinancialConfig: (config: Partial<FinancialConfig>) => Promise<void>;
  appSettings: AppSettings | null;
  updateAppSettings: (config: Partial<AppSettings>) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentLocation, setCurrentLocation] = useState<string>('Maceió');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [allCoupons, setAllCoupons] = useState<Coupon[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [roteirosVip, setRoteirosVip] = useState<RoteiroVIP[]>([]);
  const [eventosVip, setEventosVip] = useState<EventoVIP[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showUpsell, setShowUpsell] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [vipConfig, setVipConfig] = useState<VipConfig | null>(null);
  const [generalConfig, setGeneralConfig] = useState<GeneralConfig | null>(null);
  const [financialConfig, setFinancialConfig] = useState<FinancialConfig | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [serverDate, setServerDate] = useState<Date>(new Date());
  
  const isFetchingRef = useRef(false);

  const userRole = user?.role || 'user';
  const isPremiumUser = user?.isPremium || false;
  
  const isUserPremium = useCallback(() => {
    return isPremiumUser || user?.role === 'admin';
  }, [isPremiumUser, user?.role]);

  const setIsPremiumUser = async (status: boolean) => {
    if (!user) return;
    
    if (status) {
      try {
        await supabase.from('payments').insert([{
          user_id: user.id,
          amount: 29.90,
          status: 'completed'
        }]);
      } catch (err) {
        console.error("Erro ao registrar pagamento:", err);
      }
    }

    const { error } = await supabase.from('profiles').update({ is_premium: status }).eq('id', user.id);
    if (error) {
      toast.error("Erro ao atualizar status Premium");
      return;
    }
    toast.success(status ? "Parabéns! Você agora é VIP!" : "Status Premium atualizado");
    window.location.reload(); 
  };

  const fetchNotifications = useCallback(async () => {
    if (!user || user.role !== 'admin') return;
    
    try {
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*, sender:profiles!sender_id(id, full_name, avatar_url), video:videos!video_id(id, title)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (data) {
        setNotifications(data.map((n: any) => ({
          id: n.id,
          userId: n.user_id,
          type: n.type,
          senderId: n.sender_id,
          senderName: n.sender?.full_name || 'Usuário',
          senderAvatar: n.sender?.avatar_url || null,
          videoId: n.video_id,
          videoTitle: n.video?.title || null,
          content: n.content,
          sourceId: n.source_id,
          read: n.read,
          createdAt: n.created_at
        })));
      }
    } catch (err) {
      console.error("[App] Error fetching notifications:", err);
    }
  }, [user]);

  const fetchData = useCallback(async (isInitial = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    
    if (isInitial) setIsLoading(true);
    
    try {
      const [
        partnersResponse,
        couponsResponse,
        videosResponse,
        favoritesResponse,
        vipResponse,
        generalResponse,
        financialResponse,
        appSettingsResponse,
        likesResponse,
        roteirosResponse,
        eventosResponse,
        serverTimeResponse = { data: null, error: null }
      ] = await Promise.all([
        supabase.from('partners').select(`
          *, 
          partner_stats (media_nota, total_avaliacoes),
          avaliacoes (
            id, nota, comentario, created_at,
            profiles (id, full_name, avatar_url)
          )
        `).order('created_at', { ascending: false }),
        supabase.from('coupons').select('*, coupon_secrets(code)').order('created_at', { ascending: false }),
        supabase.from('videos').select('*').order('created_at', { ascending: false }),
        user ? supabase.from('favoritos').select('partner_id').eq('user_id', user.id) : Promise.resolve({ data: [], error: null }),
        supabase.from('configuracoes_vip').select('*').maybeSingle(),
        supabase.from('configuracoes_gerais').select('*').maybeSingle(),
        supabase.from('configuracoes_financeiras').select('*').maybeSingle(),
        supabase.from('app_settings').select('*').eq('id', 1).maybeSingle(),
        user ? supabase.from('video_likes').select('video_id').eq('user_id', user.id) : Promise.resolve({ data: [], error: null }),
        supabase.from('roteiros_vip').select('*, roteiro_passos(*)').order('created_at', { ascending: true }),
        supabase.from('eventos_vip').select('*').order('created_at', { ascending: true }),
        supabase.rpc('get_server_time')
      ]);

      const userLikedVideos = new Set((likesResponse?.data || []).map((l: any) => l.video_id));

      if (partnersResponse.data) {
        setPartners(partnersResponse.data.map(p => {
          const stats = p.partner_stats?.[0] || { media_nota: 0, total_avaliacoes: 0 };
          return {
            id: p.id,
            name: p.name,
            category: p.category as Category,
            location: p.location || '',
            description: p.description || '',
            rating: Number(stats.media_nota) || 0,
            totalReviews: Number(stats.total_avaliacoes) || 0,
            image: p.image || '',
            whatsapp: p.whatsapp || '',
            isPremium: p.is_premium,
            isTest: p.is_test || false,
            images: p.images || [],
            latitude: p.latitude ? Number(p.latitude) : undefined,
            longitude: p.longitude ? Number(p.longitude) : undefined,
            google_maps_link: p.google_maps_link || '',
            price: p.price || '',
            nightlife_type: p.nightlife_type as any,
            operating_hours: p.operating_hours || '',
            reviews: (p.avaliacoes || []).map((r: any) => ({
              id: r.id,
              userId: r.profiles?.id || '',
              userName: r.profiles?.full_name || 'Usuário',
              rating: r.nota,
              comment: r.comentario || '',
              date: new Date(r.created_at).toLocaleDateString('pt-BR')
            }))
          };
        }));
      }

      if (couponsResponse.data) {
        const mappedCoupons = (couponsResponse.data as any[]).map(c => ({
          id: c.id,
          title: c.title,
          discount: c.discount,
          partnerId: c.partner_id || '',
          isPremium: c.is_premium,
          validUntil: c.valid_until || '',
          code: Array.isArray(c.coupon_secrets) ? c.coupon_secrets[0]?.code : (c.coupon_secrets?.code || ''),
          status: (c.status as 'active' | 'inactive') || 'active'
        }));
        setAllCoupons(mappedCoupons);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        setCoupons(mappedCoupons.filter(c => {
          const expiryDate = c.validUntil ? new Date(c.validUntil) : null;
          // O cupom é visível se estiver ativo E (não tiver data de validade OU a data de validade for hoje ou no futuro)
          const isExpired = expiryDate ? expiryDate < today : false;
          return c.status === 'active' && !isExpired;
        }));


      }

      if (videosResponse.data) {
        setVideos((videosResponse.data as any[]).map(v => {
          return {
            id: v.id,
            url: v.url || '',
            title: v.title,
            description: v.description || '',
            partnerId: v.partner_id || '',
            thumbnail: v.thumbnail || '',
            category: v.category as any,
            isPremium: v.is_premium,
            likesCount: v.likes_count || 0,
            commentsCount: v.comments_count || 0,
            userHasLiked: userLikedVideos.has(v.id)
          };
        }));
      }

      if (favoritesResponse.data) setFavorites(favoritesResponse.data.map(f => f.partner_id));
      if (vipResponse.data) setVipConfig(vipResponse.data);
      if (generalResponse.data) setGeneralConfig(generalResponse.data);
      if (financialResponse.data) setFinancialConfig(financialResponse.data as any);
      if (appSettingsResponse.data) setAppSettings({
        ...appSettingsResponse.data,
        hero_gradient_intensity: appSettingsResponse.data.hero_gradient_intensity ?? 80,
        hero_title: appSettingsResponse.data.hero_title || 'Descubra Alagoas.',
        hero_subtitle: appSettingsResponse.data.hero_subtitle || 'Economize em cada saída.',
        tide_release_hour: appSettingsResponse.data.tide_release_hour ?? 0,
        tide_release_time: appSettingsResponse.data.tide_release_time || '00:00'
      } as AppSettings);
      if (roteirosResponse.data) setRoteirosVip(roteirosResponse.data.map((r: any) => ({ 
        ...r, 
        subtitulo: r.subtitulo || '',
        passos: (r.roteiro_passos || []).sort((a: any, b: any) => a.ordem - b.ordem)
      })));
      if (eventosResponse.data) setEventosVip(eventosResponse.data.map((e: any) => ({ ...e, data_categoria: e.data_categoria || '' })));
      
      const serverTimeData = serverTimeResponse?.data as any;
      if (serverTimeData?.brazil_time) setServerDate(new Date(serverTimeData.brazil_time));

      await fetchNotifications();

    } catch (err) {
      console.error("[App] Error in full fetchData:", err);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [user, fetchNotifications]);

  useEffect(() => {
    fetchData(true);
    
    const tablesToWatch = [
      'partners', 'videos', 'notificacoes', 'avaliacoes', 'comentarios', 
      'coupons', 'profiles', 'video_likes', 'favoritos',
      'configuracoes_vip', 'configuracoes_gerais', 'configuracoes_financeiras',
      'app_settings',
      'roteiros_vip', 'eventos_vip', 'roteiro_passos'
    ];

    const channels = tablesToWatch.map(table => {
      return supabase
        .channel(`${table}-realtime`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
          if (table === 'notificacoes') {
            fetchNotifications();
          } else {
            fetchData();
          }
        })
        .subscribe();
    });
    
    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [fetchData, fetchNotifications]);

  const markNotificationAsRead = useCallback(async (id: string) => {
    const { error } = await supabase.from('notificacoes').update({ read: true }).eq('id', id);
    if (error) return;
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllNotificationsAsRead = useCallback(async () => {
    if (!user || user.role !== 'admin') return;
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await supabase.from('notificacoes').update({ read: true }).eq('user_id', user.id).eq('read', false);
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  }, [user]);

  const deleteAllNotifications = async () => {
    if (!user || user.role !== 'admin') return;
    try {
      const { error } = await supabase.from('notificacoes').delete().eq('user_id', user.id);
      if (error) throw error;
      setNotifications([]);
      toast.success("Notificações excluídas");
    } catch (err) {
      toast.error("Erro ao excluir notificações");
    }
  };

  const deleteVideoComment = async (commentId: string, videoId: string) => {
    try {
      const { error } = await supabase.from('comentarios').delete().eq('id', commentId);
      if (error) throw error;
      setVideos(prev => prev.map(v => v.id === videoId ? { ...v, commentsCount: Math.max(0, v.commentsCount - 1) } : v));
      setNotifications(prev => prev.filter(n => n.sourceId !== commentId));
      toast.success("Comentário excluído");
    } catch (err) {
      toast.error("Erro ao excluir comentário");
    }
  };

  const updateVideoComment = async (commentId: string, content: string) => {
    try {
      await supabase.from('comentarios').update({ content }).eq('id', commentId);
      toast.success("Comentário editado");
    } catch (err) {
      toast.error("Erro ao editar comentário");
    }
  };

  const addPartner = async (p: Omit<Partner, 'id'>) => {
    const { data, error } = await supabase.from('partners').insert([{
      name: p.name,
      category: p.category,
      location: p.location,
      description: p.description,
      rating: p.rating,
      image: p.image,
      whatsapp: p.whatsapp,
      is_premium: p.isPremium,
      images: p.images,
      latitude: p.latitude,
      longitude: p.longitude,
      google_maps_link: p.google_maps_link,
      price: p.price,
      nightlife_type: p.nightlife_type,
      operating_hours: p.operating_hours,
      reservation_options: p.reservation_options as any,
      show_reservation_button: p.show_reservation_button
    }]).select().single();

    if (error) {
      toast.error("Erro ao adicionar parceiro");
      return;
    }

    if (data) {
      const newPartner: Partner = { ...p, id: data.id, totalReviews: 0, reviews: [] };
      setPartners(prev => [...prev, newPartner]);
      toast.success("Parceiro adicionado");
    }
  };

  const updatePartner = async (p: Partner) => {
    const { error } = await supabase.from('partners').update({
      name: p.name,
      category: p.category,
      location: p.location,
      description: p.description,
      rating: p.rating,
      image: p.image,
      whatsapp: p.whatsapp,
      is_premium: p.isPremium,
      images: p.images,
      latitude: p.latitude,
      longitude: p.longitude,
      google_maps_link: p.google_maps_link,
      price: p.price,
      nightlife_type: p.nightlife_type,
      operating_hours: p.operating_hours,
      reservation_options: p.reservation_options as any,
      show_reservation_button: p.show_reservation_button
    }).eq('id', p.id);

    if (error) {
      toast.error("Erro ao atualizar parceiro");
      return;
    }

    setPartners(prev => prev.map(item => item.id === p.id ? p : item));
    toast.success("Parceiro atualizado");
  };

  const deletePartner = async (id: string) => {
    const { error } = await supabase.from('partners').delete().eq('id', id);
    if (error) {
      toast.error("Erro ao excluir parceiro");
      return;
    }
    setPartners(prev => prev.filter(item => item.id !== id));
    toast.success("Parceiro excluído");
  };

  const addReview = async (partnerId: string, reviewData: Omit<Review, 'id' | 'date'>) => {
    if (!user) return;
    const { error } = await supabase.from('avaliacoes').upsert([{
      parceiro_id: partnerId,
      usuario_id: user.id,
      nota: reviewData.rating,
      comentario: reviewData.comment
    }]);

    if (error) {
      toast.error("Erro ao avaliar");
      return;
    }
    fetchData();
    toast.success("Avaliação enviada");
  };

  const deleteReview = async (reviewId: string, partnerId: string) => {
    const { error } = await supabase.from('avaliacoes').delete().eq('id', reviewId);
    if (error) {
      toast.error("Erro ao excluir avaliação");
      return;
    }
    fetchData();
    toast.success("Avaliação excluída");
  };

  const updateReview = async (reviewId: string, partnerId: string, rating: number, comment: string) => {
    const { error } = await supabase.from('avaliacoes').update({ nota: rating, comentario: comment }).eq('id', reviewId);
    if (error) {
      toast.error("Erro ao editar avaliação");
      return;
    }
    fetchData();
    toast.success("Avaliação editada");
  };

  const addCoupon = async (c: Omit<Coupon, 'id'>) => {
    console.log("Iniciando addCoupon no Supabase:", {
      title: c.title,
      code: c.code
    });

    const { data, error } = await supabase.from('coupons').insert([{
      title: c.title,
      discount: c.discount,
      partner_id: c.partnerId,
      is_premium: c.isPremium,
      valid_until: c.validUntil || null,
      status: c.status || 'active'
    }]).select().single();

    if (error) {
      console.error("Erro ao adicionar cupom na tabela coupons:", error);
      toast.error("Erro ao adicionar cupom");
      return;
    }

    if (data) {
      const { error: secretError } = await supabase.from('coupon_secrets').insert([
        { coupon_id: data.id, code: c.code || '' }
      ]);
      
      if (secretError) {
        console.error("Erro ao adicionar código na tabela coupon_secrets:", secretError);
        toast.error("Erro ao salvar código do cupom");
      }

      fetchData();
      toast.success("Cupom adicionado com sucesso");
    }
  };

  const updateCoupon = async (c: Coupon) => {
    console.log("Iniciando updateCoupon no Supabase:", {
      id: c.id,
      title: c.title,
      code: c.code
    });

    const { error: couponError } = await supabase.from('coupons').update({
      title: c.title,
      discount: c.discount,
      partner_id: c.partnerId,
      is_premium: c.isPremium,
      valid_until: c.validUntil || null,
      status: c.status || 'active'
    }).eq('id', c.id);

    if (couponError) {
      console.error("Erro ao atualizar tabela coupons:", couponError);
      toast.error("Erro ao atualizar cupom");
      return;
    }

    const { error: secretError } = await supabase.from('coupon_secrets').upsert([
      { coupon_id: c.id, code: c.code || '' }
    ], { onConflict: 'coupon_id' });

    if (secretError) {
      console.error("Erro ao atualizar tabela coupon_secrets:", secretError);
      toast.error("Erro ao atualizar código do cupom");
      return;
    }

    await fetchData();
    toast.success("Cupom atualizado com sucesso");
  };

  const deleteCoupon = async (id: string) => {
    const { error } = await supabase.from('coupons').delete().eq('id', id);
    if (error) {
      toast.error("Erro ao excluir cupom");
      return;
    }
    fetchData();
    toast.success("Cupom excluído");
  };

  const addVideo = async (v: Omit<Video, 'id' | 'likesCount' | 'commentsCount'>) => {
    const { data, error } = await supabase.from('videos').insert([{
      title: v.title,
      description: v.description,
      partner_id: v.partnerId === 'general' ? null : v.partnerId,
      thumbnail: v.thumbnail,
      category: v.category,
      is_premium: v.isPremium,
      url: v.url || ''
    }]).select().single();

    if (error) {
      console.error("Error adding video entry:", error);
      toast.error("Erro ao adicionar registro do vídeo");
      return;
    }

    if (data) {
      toast.success("Vídeo publicado com sucesso!");
      await fetchData();
    }
  };

  const updateVideo = async (v: Video) => {
    const { error } = await supabase.from('videos').update({
      title: v.title,
      description: v.description,
      partner_id: v.partnerId === 'general' ? null : v.partnerId,
      thumbnail: v.thumbnail,
      category: v.category,
      is_premium: v.isPremium,
      url: v.url || ''
    }).eq('id', v.id);

    if (error) {
      console.error("Error updating video entry:", error);
      toast.error("Erro ao atualizar dados do vídeo");
      return;
    }

    toast.success("Vídeo atualizado com sucesso!");
    await fetchData();
  };

  const deleteVideo = async (id: string) => {
    const { error } = await supabase.from('videos').delete().eq('id', id);
    if (error) {
      toast.error("Erro ao excluir vídeo");
      return;
    }
    fetchData();
    toast.success("Vídeo excluído");
  };

  const toggleVideoLike = async (videoId: string) => {
    if (!user) {
      toast.error("Faça login para curtir!");
      return;
    }
    
    const video = videos.find(v => v.id === videoId);
    if (!video) return;

    const hasLiked = video.userHasLiked;
    
    // Otimismo no UI
    setVideos(prev => prev.map(v => v.id === videoId ? { 
      ...v, 
      userHasLiked: !hasLiked, 
      likesCount: hasLiked ? Math.max(0, v.likesCount - 1) : v.likesCount + 1 
    } : v));

    try {
      console.log("[AppContext] Interação Like - User ID:", user.id);
      const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle();
      
      if (!profile) {
        await supabase.from('profiles').insert({ id: user.id, email: user.email });
      }

      if (hasLiked) {
        // Remover like
        const { error: deleteError } = await supabase
          .from('video_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('video_id', videoId);
        
        if (deleteError) throw deleteError;
        toast.success("Vídeo descurtido");
      } else {
        // Adicionar like
        const { error: insertError } = await supabase
          .from('video_likes')
          .insert([{ user_id: user.id, video_id: videoId }]);
        
        if (insertError) throw insertError;

        if (user.role !== 'admin') {
          const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin').limit(1);
          const adminId = admins?.[0]?.id;
          if (adminId) {
            await supabase.from('notificacoes').insert([{
              user_id: adminId,
              type: 'like',
              sender_id: user.id,
              video_id: videoId,
              content: `${user.name || 'Alguém'} curtiu seu vídeo "${video.title}"`,
              read: false
            }]);
          }
        }
        toast.success("Vídeo curtido!");
      }
    } catch (err) {
      console.error("Erro ao alternar like do vídeo:", err);
      // Reverter estado local em caso de erro
      fetchData(); 
    }
  };

  const addVideoComment = async (videoId: string, content: string) => {
    if (!user) {
      toast.error("Faça login para comentar!");
      return;
    }
    if (!content.trim()) return;
    
    try {
      // DEBUG: Verificar existência do perfil antes de interagir (Erro 23503)
      console.log("[AppContext] Interação Comentário - User ID:", user.id);
      const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle();
      
      if (!profile) {
        console.warn("[AppContext] Perfil não encontrado, criando emergencialmente...");
        await supabase.from('profiles').insert({ id: user.id, email: user.email });
      }

      // Otimismo no UI para o contador de comentários
      setVideos(prev => prev.map(v => v.id === videoId ? { 
        ...v, 
        commentsCount: v.commentsCount + 1 
      } : v));

      const { data, error } = await supabase
        .from('comentarios')
        .insert([{ video_id: videoId, user_id: user.id, content }])
        .select()
        .single();

      if (error) throw error;
      
      if (user.role !== 'admin') {
        const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin').limit(1);
        const adminId = admins?.[0]?.id;
        const video = videos.find(v => v.id === videoId);
        
        if (adminId) {
          await supabase.from('notificacoes').insert([{
            user_id: adminId,
            type: 'comment',
            sender_id: user.id,
            video_id: videoId,
            source_id: data.id,
            content: `${user.name || 'Alguém'} comentou no seu vídeo "${video?.title || ''}": ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
            read: false
          }]);
        }
      }

      await fetchData(); 
      toast.success("Comentário enviado");
    } catch (err) {
      console.error("Erro ao comentar:", err);
      toast.error("Erro ao enviar comentário");
    }
  };

  const toggleFavorite = async (partnerId: string) => {
    if (!user) return;
    const isFav = favorites.includes(partnerId);
    if (isFav) {
      await supabase.from('favoritos').delete().eq('user_id', user.id).eq('partner_id', partnerId);
      setFavorites(prev => prev.filter(id => id !== partnerId));
    } else {
      await supabase.from('favoritos').insert([{ user_id: user.id, partner_id: partnerId }]);
      setFavorites(prev => [...prev, partnerId]);
    }
  };

  const isFavorite = (partnerId: string) => favorites.includes(partnerId);

  const addRoteiroVip = async (r: Omit<RoteiroVIP, 'id'>) => {
    const { passos, ...roteiroData } = r;
    
    // Sanitize roteiro data - remove any potential non-db fields
    const sanitizedRoteiro = {
      titulo: roteiroData.titulo,
      subtitulo: roteiroData.subtitulo,
      descricao_completa: roteiroData.descricao_completa,
      icone_url: roteiroData.icone_url,
      image_url: roteiroData.image_url,
      localizacao_nome: roteiroData.localizacao_nome,
      google_maps_link: roteiroData.google_maps_link
    };

    const { data, error } = await supabase.from('roteiros_vip').insert([sanitizedRoteiro]).select().single();
    
    if (error) {
      console.error("Erro ao adicionar roteiro:", error);
      toast.error("Erro ao adicionar roteiro");
      return;
    }

    if (passos && passos.length > 0 && data) {
      const passosToInsert = passos.map((p, index) => ({
        roteiro_id: data.id,
        horario: p.horario,
        titulo: p.titulo,
        descricao: p.descricao,
        image_url: p.image_url,
        google_maps_url: p.google_maps_url,
        ordem: p.ordem ?? index
      }));

      const { error: passosError } = await supabase.from('roteiro_passos').insert(passosToInsert);
      if (passosError) {
        console.error("Erro ao salvar passos:", passosError);
        toast.error("Roteiro criado, mas erro ao salvar passos.");
      }
    }
    
    fetchData();
    toast.success("Roteiro adicionado");
  };

  const updateRoteiroVip = async (r: RoteiroVIP) => {
    const { passos, ...roteiroData } = r;
    
    // Sanitize roteiro data for update - exclude id and system columns
    const sanitizedRoteiro = {
      titulo: roteiroData.titulo,
      subtitulo: roteiroData.subtitulo,
      descricao_completa: roteiroData.descricao_completa,
      icone_url: roteiroData.icone_url,
      image_url: roteiroData.image_url,
      localizacao_nome: roteiroData.localizacao_nome,
      google_maps_link: roteiroData.google_maps_link,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('roteiros_vip').update(sanitizedRoteiro).eq('id', r.id);
    
    if (error) {
      console.error("Erro ao atualizar roteiro:", error);
      toast.error("Erro ao atualizar roteiro");
      return;
    }

    // Update steps: delete and re-insert
    if (passos) {
      // First delete existing steps
      const { error: deleteError } = await supabase.from('roteiro_passos').delete().eq('roteiro_id', r.id);
      
      if (deleteError) {
        console.error("Erro ao limpar passos antigos:", deleteError);
      }

      if (passos.length > 0) {
        const passosToInsert = passos.map((p, index) => ({
          roteiro_id: r.id,
          horario: p.horario,
          titulo: p.titulo,
          descricao: p.descricao,
          image_url: p.image_url,
          google_maps_url: p.google_maps_url,
          ordem: p.ordem ?? index
        }));

        const { error: passosError } = await supabase.from('roteiro_passos').insert(passosToInsert);
        if (passosError) {
          console.error("Erro ao atualizar passos:", passosError);
          toast.error("Roteiro atualizado, mas erro ao salvar passos.");
        }
      }
    }

    fetchData();
    toast.success("Roteiro atualizado");
  };

  const deleteRoteiroVip = async (id: string) => {
    const { error } = await supabase.from('roteiros_vip').delete().eq('id', id);
    if (error) {
      toast.error("Erro ao excluir roteiro");
      return;
    }
    fetchData();
    toast.success("Roteiro excluído");
  };

  const addEventoVip = async (e: Omit<EventoVIP, 'id'>) => {
    // Sanitize event data
    const sanitizedEvento = {
      titulo: e.titulo,
      descricao_completa: e.descricao_completa,
      icone_url: e.icone_url,
      data_categoria: e.data_categoria,
      localizacao_nome: e.localizacao_nome,
      google_maps_link: e.google_maps_link
    };

    const { error } = await supabase.from('eventos_vip').insert([sanitizedEvento]);
    if (error) {
      console.error("Erro ao adicionar evento:", error);
      toast.error("Erro ao adicionar evento");
      return;
    }
    fetchData();
    toast.success("Evento adicionado");
  };

  const updateEventoVip = async (e: EventoVIP) => {
    // Sanitize event data for update
    const sanitizedEvento = {
      titulo: e.titulo,
      descricao_completa: e.descricao_completa,
      icone_url: e.icone_url,
      data_categoria: e.data_categoria,
      localizacao_nome: e.localizacao_nome,
      google_maps_link: e.google_maps_link,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('eventos_vip').update(sanitizedEvento).eq('id', e.id);
    if (error) {
      console.error("Erro ao atualizar evento:", error);
      toast.error("Erro ao atualizar evento");
      return;
    }
    fetchData();
    toast.success("Evento atualizado");
  };

  const deleteEventoVip = async (id: string) => {
    const { error } = await supabase.from('eventos_vip').delete().eq('id', id);
    if (error) {
      toast.error("Erro ao excluir evento");
      return;
    }
    fetchData();
    toast.success("Evento excluído");
  };

  const updateVipConfig = async (config: Partial<VipConfig>) => {
    if (!vipConfig?.id) return;
    
    setVipConfig(prev => prev ? { ...prev, ...config } : null);

    const { error } = await supabase.from('configuracoes_vip').update(config).eq('id', vipConfig.id);
    if (error) {
      toast.error("Erro ao atualizar config VIP");
      fetchData();
      return;
    }
    await fetchData();
    toast.success("Config VIP atualizada");
  };

  const updateGeneralConfig = async (config: Partial<GeneralConfig>) => {
    if (!generalConfig?.id) return;
    const { error } = await supabase.from('configuracoes_gerais').update(config).eq('id', generalConfig.id);
    if (error) {
      toast.error("Erro ao atualizar config geral");
      return;
    }
    fetchData();
    toast.success("Config geral atualizada");
  };

  const updateFinancialConfig = async (config: Partial<FinancialConfig>) => {
    if (!financialConfig?.id) return;
    
    // 1. Atualiza o estado local IMEDIATAMENTE para refletir no formulário sem delay
    setFinancialConfig(prev => prev ? {
      ...prev,
      ...config,
      updated_at: new Date().toISOString()
    } : null);

    const { error } = await supabase.from('configuracoes_financeiras').update({
      vip_price: config.vip_price,
      vip_price_annual: config.vip_price_annual,
      max_parcelas_mensal: config.max_parcelas_mensal,
      max_parcelas_anual: config.max_parcelas_anual,
      updated_at: new Date().toISOString()
    }).eq('id', financialConfig.id);

    if (error) {
      toast.error("Erro ao atualizar config financeira");
      // Reverte o estado em caso de erro
      fetchData();
      return;
    }
    
    // 2. Garante o sincronismo final com o banco
    await fetchData();
    toast.success("Config financeira atualizada");
  };

  const updateAppSettings = async (config: Partial<AppSettings>) => {
    try {
      const { error } = await supabase
        .from('app_settings')
        .update(config)
        .eq('id', 1);

      if (error) throw error;
      setAppSettings(prev => prev ? { ...prev, ...config } : null);
      toast.success("Configurações atualizadas");
    } catch (err) {
      console.error("Erro ao atualizar configurações:", err);
      toast.error("Erro ao atualizar configurações");
    }
  };

  return (
    <AppContext.Provider value={{
      userRole, isPremiumUser, isUserPremium, setIsPremiumUser, currentLocation, setCurrentLocation,
      partners, addPartner, updatePartner, deletePartner, addReview, deleteReview, updateReview,
      coupons, allCoupons, addCoupon, updateCoupon, deleteCoupon,
      videos, addVideo, updateVideo, deleteVideo, toggleVideoLike, addVideoComment, deleteVideoComment, updateVideoComment,
      notifications, markNotificationAsRead, markAllNotificationsAsRead, deleteAllNotifications,
      favorites, toggleFavorite, isFavorite,
      roteirosVip, addRoteiroVip, updateRoteiroVip, deleteRoteiroVip,
      eventosVip, addEventoVip, updateEventoVip, deleteEventoVip,
      showUpsell, setShowUpsell, isLoading, vipConfig, updateVipConfig,
      generalConfig, updateGeneralConfig, serverDate, financialConfig, updateFinancialConfig,
      appSettings, updateAppSettings
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useApp must be used within an AppProvider');
  return context;
};