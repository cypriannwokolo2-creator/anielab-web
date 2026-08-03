// Hand-written types mirroring supabase/migrations/20260801000000_init_schema.sql.
// Regenerate after schema changes with:
//   supabase gen types typescript --linked > src/types/supabase.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          stellar_address: string
          display_name: string | null
          avatar_ipfs_cid: string | null
          auth_method: 'email' | 'wallet' | null
          created_at: string
        }
        Insert: {
          id?: string
          stellar_address: string
          display_name?: string | null
          avatar_ipfs_cid?: string | null
          auth_method?: 'email' | 'wallet' | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      projects: {
        Row: {
          id: string
          owner_id: string
          title: string
          description: string | null
          cover_ipfs_cid: string | null
          contract_id: string | null
          funding_goal: number | null
          status: 'draft' | 'active' | 'funded' | 'archived'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          title: string
          description?: string | null
          cover_ipfs_cid?: string | null
          contract_id?: string | null
          funding_goal?: number | null
          status?: 'draft' | 'active' | 'funded' | 'archived'
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['projects']['Insert']>
      }
      contributions: {
        Row: {
          id: string
          project_id: string
          user_id: string
          role: string
          share_pct: number
          ipfs_cid: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          role: string
          share_pct: number
          ipfs_cid?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['contributions']['Insert']>
      }
      auth_challenges: {
        Row: {
          id: string
          stellar_address: string
          nonce: string
          expires_at: string
          used_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          stellar_address: string
          nonce: string
          expires_at: string
          used_at?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['auth_challenges']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
