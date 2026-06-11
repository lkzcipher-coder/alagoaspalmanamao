export type Category = 'Praias' | 'Restaurantes' | 'Passeios' | 'Hotéis' | 'Vida Noturna';
export type VideoCategory = 'Praias' | 'Passeios de jangada' | 'Passeios de buggy' | 'Passeios de lancha' | 'Restaurantes' | 'Eventos' | 'Pontos turísticos';


export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface ReservationOption {
  name: string;
  price: string;
}

export interface Partner {
  id: string;
  name: string;
  category?: Category;
  location?: string;
  description: string;
  rating: number;
  totalReviews: number;
  image: string;
  whatsapp: string;
  isPremium: boolean;
  isTest?: boolean;
  images: string[];
  reviews?: Review[];
  latitude?: number;
  longitude?: number;
  google_maps_link?: string;
  price?: string;
  nightlife_type?: 'Bar' | 'Show' | 'Evento';
  operating_hours?: string;
  
  reservation_options?: ReservationOption[];
  show_reservation_button?: boolean;
}

export interface Coupon {
  id: string;
  title: string;
  discount: string;
  partnerId: string;
  isPremium: boolean;
  validUntil: string;
  code?: string;
  status?: 'active' | 'inactive';
}

export interface Video {
  id: string;
  url: string;
  title: string;
  description?: string;
  partnerId: string;
  thumbnail: string;
  category?: VideoCategory;
  isPremium: boolean;
  likesCount: number;
  commentsCount: number;
  userHasLiked?: boolean;
}

export interface RoteiroPasso {
  id: string;
  roteiro_id: string;
  horario: string;
  titulo: string;
  descricao?: string;
  image_url?: string;
  google_maps_url?: string;
  ordem: number;
}

export interface RoteiroVIP {
  id: string;
  titulo: string;
  subtitulo: string;
  descricao_completa: string;
  icone_url: string; // This remains as legacy/secondary if needed, but we'll use image_url mainly
  image_url?: string; // Main cover image
  localizacao_nome?: string;
  google_maps_link?: string;
  passos?: RoteiroPasso[];
}

export interface EventoVIP {
  id: string;
  titulo: string;
  data_categoria: string;
  descricao_completa: string;
  icone_url: string;
  image_url?: string; // Cover image for events too
  localizacao_nome?: string;
  google_maps_link?: string;
}


export interface Notification {
  id: string;
  userId: string;
  type: 'like' | 'comment';
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  videoId: string;
  videoTitle?: string;
  content?: string;
  sourceId?: string;
  read: boolean;
  createdAt: string;
}

export type UserRole = 'user' | 'admin';


export interface AppState {
  userRole: UserRole;
  isPremiumUser: boolean;
  currentLocation: string;
  partners: Partner[];
  coupons: Coupon[];
  videos: Video[];
  favorites: string[];
  notifications: Notification[];
}

export interface FinancialConfig {
  id: string;
  vip_price: number;
  vip_price_annual: number;
  max_parcelas_mensal: number;
  max_parcelas_anual: number;
  updated_at: string;
}

export interface AppSettings {
  id: number;
  hero_bg_image: string | null;
  hero_gradient_intensity: number;
  hero_title: string | null;
  hero_subtitle: string | null;
  tide_release_hour: number;
  tide_release_time: string;
  tide_open_time: string;
  tide_close_time: string;
  updated_at: string;
}
