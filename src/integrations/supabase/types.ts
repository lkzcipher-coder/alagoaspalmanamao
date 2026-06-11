export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          created_at: string
          hero_bg_image: string | null
          hero_gradient_intensity: number | null
          hero_subtitle: string | null
          hero_title: string | null
          id: number
          tide_close_time: string | null
          tide_open_time: string | null
          tide_release_hour: number | null
          tide_release_time: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          hero_bg_image?: string | null
          hero_gradient_intensity?: number | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id: number
          tide_close_time?: string | null
          tide_open_time?: string | null
          tide_release_hour?: number | null
          tide_release_time?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          hero_bg_image?: string | null
          hero_gradient_intensity?: number | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: number
          tide_close_time?: string | null
          tide_open_time?: string | null
          tide_release_hour?: number | null
          tide_release_time?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      avaliacoes: {
        Row: {
          comentario: string | null
          created_at: string
          id: string
          nota: number
          parceiro_id: string
          usuario_id: string
        }
        Insert: {
          comentario?: string | null
          created_at?: string
          id?: string
          nota: number
          parceiro_id: string
          usuario_id: string
        }
        Update: {
          comentario?: string | null
          created_at?: string
          id?: string
          nota?: number
          parceiro_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_parceiro_id_fkey"
            columns: ["parceiro_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comentarios: {
        Row: {
          content: string
          created_at: string
          id: string
          user_id: string
          video_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          user_id: string
          video_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_comments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes_financeiras: {
        Row: {
          created_at: string
          id: string
          max_parcelas_anual: number | null
          max_parcelas_mensal: number | null
          updated_at: string
          vip_price: number
          vip_price_annual: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          max_parcelas_anual?: number | null
          max_parcelas_mensal?: number | null
          updated_at?: string
          vip_price?: number
          vip_price_annual?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          max_parcelas_anual?: number | null
          max_parcelas_mensal?: number | null
          updated_at?: string
          vip_price?: number
          vip_price_annual?: number | null
        }
        Relationships: []
      }
      configuracoes_gerais: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          whatsapp_link: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          whatsapp_link: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          whatsapp_link?: string
        }
        Relationships: []
      }
      configuracoes_vip: {
        Row: {
          created_at: string
          id: string
          link_checkout: string
          preco_anual: string
          updated_at: string
          vip_plan_duration_months: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          link_checkout?: string
          preco_anual?: string
          updated_at?: string
          vip_plan_duration_months?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          link_checkout?: string
          preco_anual?: string
          updated_at?: string
          vip_plan_duration_months?: number | null
        }
        Relationships: []
      }
      coupon_secrets: {
        Row: {
          code: string
          coupon_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          code: string
          coupon_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          code?: string
          coupon_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_secrets_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: true
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string | null
          created_at: string
          discount: string
          id: string
          is_premium: boolean
          partner_id: string | null
          status: string | null
          title: string
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          discount: string
          id?: string
          is_premium?: boolean
          partner_id?: string | null
          status?: string | null
          title: string
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string
          discount?: string
          id?: string
          is_premium?: boolean
          partner_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos_vip: {
        Row: {
          created_at: string
          data_categoria: string | null
          descricao_completa: string
          google_maps_link: string | null
          icone_url: string | null
          id: string
          localizacao_nome: string | null
          subtitulo: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_categoria?: string | null
          descricao_completa: string
          google_maps_link?: string | null
          icone_url?: string | null
          id?: string
          localizacao_nome?: string | null
          subtitulo?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_categoria?: string | null
          descricao_completa?: string
          google_maps_link?: string | null
          icone_url?: string | null
          id?: string
          localizacao_nome?: string | null
          subtitulo?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      favoritos: {
        Row: {
          created_at: string
          id: string
          partner_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          partner_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          partner_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favoritos_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          content: string | null
          created_at: string
          id: string
          read: boolean
          sender_id: string | null
          source_id: string | null
          type: string
          user_id: string
          video_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          read?: boolean
          sender_id?: string | null
          source_id?: string | null
          type: string
          user_id: string
          video_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          read?: boolean
          sender_id?: string | null
          source_id?: string | null
          type?: string
          user_id?: string
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacoes_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacoes_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          google_maps_link: string | null
          id: string
          image: string | null
          images: string[] | null
          instagram_url: string | null
          is_premium: boolean
          is_test: boolean | null
          latitude: number | null
          location: string | null
          longitude: number | null
          name: string
          nightlife_type: string | null
          operating_hours: string | null
          price: string | null
          rating: number | null
          reservation_options: Json | null
          show_reservation_button: boolean | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          google_maps_link?: string | null
          id?: string
          image?: string | null
          images?: string[] | null
          instagram_url?: string | null
          is_premium?: boolean
          is_test?: boolean | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          name: string
          nightlife_type?: string | null
          operating_hours?: string | null
          price?: string | null
          rating?: number | null
          reservation_options?: Json | null
          show_reservation_button?: boolean | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          google_maps_link?: string | null
          id?: string
          image?: string | null
          images?: string[] | null
          instagram_url?: string | null
          is_premium?: boolean
          is_test?: boolean | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          name?: string
          nightlife_type?: string | null
          operating_hours?: string | null
          price?: string | null
          rating?: number | null
          reservation_options?: Json | null
          show_reservation_button?: boolean | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      payment_history: {
        Row: {
          amount: number
          created_at: string
          id: string
          mp_payment_id: string
          payment_method: string
          plan_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          mp_payment_id: string
          payment_method: string
          plan_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          mp_payment_id?: string
          payment_method?: string
          plan_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          status: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          status?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          favorites_limit: number
          full_name: string | null
          id: string
          is_premium: boolean
          premium_expiry_date: string | null
          premium_start_date: string | null
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          favorites_limit?: number
          full_name?: string | null
          id: string
          is_premium?: boolean
          premium_expiry_date?: string | null
          premium_start_date?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          favorites_limit?: number
          full_name?: string | null
          id?: string
          is_premium?: boolean
          premium_expiry_date?: string | null
          premium_start_date?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      promotional_banners: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_active: boolean
          target_link: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean
          target_link?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean
          target_link?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          partner_id: string | null
          rating: number
          user_id: string | null
          user_name: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          partner_id?: string | null
          rating: number
          user_id?: string | null
          user_name: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          partner_id?: string | null
          rating?: number
          user_id?: string | null
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      roteiro_passos: {
        Row: {
          created_at: string
          descricao: string | null
          google_maps_url: string | null
          horario: string
          id: string
          image_url: string | null
          ordem: number
          roteiro_id: string
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          google_maps_url?: string | null
          horario: string
          id?: string
          image_url?: string | null
          ordem?: number
          roteiro_id: string
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          google_maps_url?: string | null
          horario?: string
          id?: string
          image_url?: string | null
          ordem?: number
          roteiro_id?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roteiro_passos_roteiro_id_fkey"
            columns: ["roteiro_id"]
            isOneToOne: false
            referencedRelation: "roteiros_vip"
            referencedColumns: ["id"]
          },
        ]
      }
      roteiros_vip: {
        Row: {
          created_at: string
          descricao_completa: string
          google_maps_link: string | null
          icone_url: string | null
          id: string
          image_url: string | null
          localizacao_nome: string | null
          subtitulo: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao_completa: string
          google_maps_link?: string | null
          icone_url?: string | null
          id?: string
          image_url?: string | null
          localizacao_nome?: string | null
          subtitulo?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao_completa?: string
          google_maps_link?: string | null
          icone_url?: string | null
          id?: string
          image_url?: string | null
          localizacao_nome?: string | null
          subtitulo?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      tide_destinations: {
        Row: {
          created_at: string
          id: string
          is_premium: boolean | null
          latitude: number
          longitude: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_premium?: boolean | null
          latitude: number
          longitude: number
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_premium?: boolean | null
          latitude?: number
          longitude?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          created_at: string
          partner_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          partner_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          partner_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      video_likes: {
        Row: {
          created_at: string
          id: string
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_likes_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_secrets: {
        Row: {
          created_at: string | null
          id: string
          url: string
          video_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          url: string
          video_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          url?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_secrets_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: true
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          category: string | null
          comments_count: number
          created_at: string
          description: string | null
          id: string
          is_premium: boolean
          likes_count: number
          partner_id: string | null
          thumbnail: string | null
          title: string
          url: string | null
        }
        Insert: {
          category?: string | null
          comments_count?: number
          created_at?: string
          description?: string | null
          id?: string
          is_premium?: boolean
          likes_count?: number
          partner_id?: string | null
          thumbnail?: string | null
          title: string
          url?: string | null
        }
        Update: {
          category?: string | null
          comments_count?: number
          created_at?: string
          description?: string | null
          id?: string
          is_premium?: boolean
          likes_count?: number
          partner_id?: string | null
          thumbnail?: string | null
          title?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "videos_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      partner_stats: {
        Row: {
          media_nota: number | null
          parceiro_id: string | null
          total_avaliacoes: number | null
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_parceiro_id_fkey"
            columns: ["parceiro_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      public_profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_premium_expiry: { Args: never; Returns: undefined }
      get_coupon_code: { Args: { target_id: string }; Returns: string }
      get_server_time: { Args: never; Returns: Json }
      get_video_url: { Args: { target_id: string }; Returns: string }
      notify_all_admins: {
        Args: {
          p_content?: string
          p_sender_id: string
          p_source_id?: string
          p_type: string
          p_video_id?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
