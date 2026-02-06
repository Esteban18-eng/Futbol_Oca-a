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
    PostgrestVersion: "13.0.4"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      categorias: {
        Row: {
          created_at: string | null
          id: string
          nombre: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          nombre: string
        }
        Update: {
          created_at?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      ciudades: {
        Row: {
          created_at: string | null
          departamento_id: string | null
          id: string
          nombre: string
        }
        Insert: {
          created_at?: string | null
          departamento_id?: string | null
          id?: string
          nombre: string
        }
        Update: {
          created_at?: string | null
          departamento_id?: string | null
          id?: string
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "ciudades_departamento_id_fkey"
            columns: ["departamento_id"]
            isOneToOne: false
            referencedRelation: "departamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      departamentos: {
        Row: {
          created_at: string | null
          id: string
          nombre: string
          pais_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          nombre: string
          pais_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nombre?: string
          pais_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "departamentos_pais_id_fkey"
            columns: ["pais_id"]
            isOneToOne: false
            referencedRelation: "paises"
            referencedColumns: ["id"]
          },
        ]
      }
      escuelas: {
        Row: {
          created_at: string | null
          id: string
          logo_file_type: string | null
          logo_url: string | null
          nombre: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          logo_file_type?: string | null
          logo_url?: string | null
          nombre: string
        }
        Update: {
          created_at?: string | null
          id?: string
          logo_file_type?: string | null
          logo_url?: string | null
          nombre?: string
        }
        Relationships: []
      }
      jugadores: {
        Row: {
          activo: boolean | null
          apellido: string
          categoria_id: string
          ciudad: string
          ciudad_id: string | null
          created_at: string | null
          departamento: string
          departamento_id: string | null
          documento: string
          documento_pdf_url: string | null
          eps: string | null
          escuela_id: string
          fecha_nacimiento: string
          foto_perfil_url: string | null
          id: string
          nombre: string
          pais: string
          pais_id: string | null
          registro_civil_url: string | null
          tipo_eps: string
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          apellido: string
          categoria_id: string
          ciudad: string
          ciudad_id?: string | null
          created_at?: string | null
          departamento: string
          departamento_id?: string | null
          documento: string
          documento_pdf_url?: string | null
          eps?: string | null
          escuela_id: string
          fecha_nacimiento: string
          foto_perfil_url?: string | null
          id?: string
          nombre: string
          pais?: string
          pais_id?: string | null
          registro_civil_url?: string | null
          tipo_eps: string
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          apellido?: string
          categoria_id?: string
          ciudad?: string
          ciudad_id?: string | null
          created_at?: string | null
          departamento?: string
          departamento_id?: string | null
          documento?: string
          documento_pdf_url?: string | null
          eps?: string | null
          escuela_id?: string
          fecha_nacimiento?: string
          foto_perfil_url?: string | null
          id?: string
          nombre?: string
          pais?: string
          pais_id?: string | null
          registro_civil_url?: string | null
          tipo_eps?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jugadores_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jugadores_ciudad_id_fkey"
            columns: ["ciudad_id"]
            isOneToOne: false
            referencedRelation: "ciudades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jugadores_departamento_id_fkey"
            columns: ["departamento_id"]
            isOneToOne: false
            referencedRelation: "departamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jugadores_escuela_id_fkey"
            columns: ["escuela_id"]
            isOneToOne: false
            referencedRelation: "escuelas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jugadores_pais_id_fkey"
            columns: ["pais_id"]
            isOneToOne: false
            referencedRelation: "paises"
            referencedColumns: ["id"]
          },
        ]
      }
      paises: {
        Row: {
          codigo: string | null
          created_at: string | null
          id: string
          nombre: string
        }
        Insert: {
          codigo?: string | null
          created_at?: string | null
          id?: string
          nombre: string
        }
        Update: {
          codigo?: string | null
          created_at?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          activo: boolean | null
          apellido: string
          created_at: string | null
          email: string
          escuela_id: string | null
          id: string
          last_password_reset: string | null
          nombre: string
          reset_token: string | null
          rol: Database["public"]["Enums"]["user_role"]
          supabase_password: string | null
          system_password: string | null
        }
        Insert: {
          activo?: boolean | null
          apellido: string
          created_at?: string | null
          email: string
          escuela_id?: string | null
          id: string
          last_password_reset?: string | null
          nombre: string
          reset_token?: string | null
          rol?: Database["public"]["Enums"]["user_role"]
          supabase_password?: string | null
          system_password?: string | null
        }
        Update: {
          activo?: boolean | null
          apellido?: string
          created_at?: string | null
          email?: string
          escuela_id?: string | null
          id?: string
          last_password_reset?: string | null
          nombre?: string
          reset_token?: string | null
          rol?: Database["public"]["Enums"]["user_role"]
          supabase_password?: string | null
          system_password?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_escuela_id_fkey"
            columns: ["escuela_id"]
            isOneToOne: false
            referencedRelation: "escuelas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_coach_club_id: { Args: never; Returns: number }
      get_players_for_coach: {
        Args: { coach_id_param: number }
        Returns: {
          active: boolean
          age: number
          avatar_url: string
          birth_date: string
          category: string
          club: string
          created_at: string
          document: string
          eps: string
          eps_type: string
          first_name: string
          full_name: string
          id: number
          last_name: string
        }[]
      }
      simple_hash: { Args: { password: string }; Returns: string }
      validate_login: {
        Args: { doc: string; pass: string }
        Returns: {
          club_id: number
          club_name: string
          coach_id: number
          document: string
          email: string
          first_name: string
          full_name: string
          last_name: string
          phone: string
          role: string
        }[]
      }
    }
    Enums: {
      user_role: "admin" | "entrenador"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      user_role: ["admin", "entrenador"],
    },
  },
} as const
