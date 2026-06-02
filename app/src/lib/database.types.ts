export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type TaskType    = 'habit' | 'daily' | 'quest'
export type Difficulty  = 'easy' | 'medium' | 'hard'
export type HabitDir    = 'pos' | 'neg' | 'both'
export type CosmeticSlot = 'background' | 'body' | 'bottom' | 'top' | 'hair' | 'accessory'
export type UnlockType  = 'shop' | 'achievement' | 'prestige' | 'starter'
export type MetricSource = 'manual' | 'vision' | 'bank'
export type SubmissionStatus = 'pending' | 'verified' | 'review' | 'rejected'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          level: number
          xp: number
          gold: number
          gems: number
          hp: number
          max_hp: number
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string }
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          type: TaskType
          title: string
          attr: string
          difficulty: Difficulty
          dir: HabitDir | null
          streak: number
          done: boolean
          count: number
          attr_points: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['tasks']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['tasks']['Row']>
      }
      events: {
        Row: {
          id: number
          user_id: string
          type: string
          xp_delta: number
          gold_delta: number
          payload: Json
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['events']['Row'], 'id' | 'created_at'>
        Update: never
      }
      cosmetics: {
        Row: {
          id: string
          slot: CosmeticSlot
          name: string
          rarity: string
          layer_z: number
          asset_url: string
          unlock_type: UnlockType
          price_gold: number | null
          price_real: number | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['cosmetics']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['cosmetics']['Row']>
      }
      inventory: {
        Row: { user_id: string; cosmetic_id: string; acquired_at: string }
        Insert: Omit<Database['public']['Tables']['inventory']['Row'], 'acquired_at'>
        Update: never
      }
      character: {
        Row: {
          user_id: string
          background: string | null
          body: string | null
          bottom: string | null
          top: string | null
          hair: string | null
          accessory: string | null
        }
        Insert: Partial<Database['public']['Tables']['character']['Row']> & { user_id: string }
        Update: Partial<Database['public']['Tables']['character']['Row']>
      }
      achievements: {
        Row: {
          id: string
          key: string
          title: string
          description: string | null
          tier: number
          condition_type: string
          condition_value: number
          reward_gold: number
          reward_cosmetic_id: string | null
          icon: string | null
        }
        Insert: Omit<Database['public']['Tables']['achievements']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['achievements']['Row']>
      }
      user_achievements: {
        Row: {
          user_id: string
          achievement_id: string
          progress: number
          unlocked_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['user_achievements']['Row'], never>
        Update: Partial<Database['public']['Tables']['user_achievements']['Row']>
      }
      business_metrics: {
        Row: {
          id: string
          user_id: string
          metric: string
          value: number
          period: string | null
          source: MetricSource
          recorded_at: string
        }
        Insert: Omit<Database['public']['Tables']['business_metrics']['Row'], 'id' | 'recorded_at'>
        Update: Partial<Database['public']['Tables']['business_metrics']['Row']>
      }
      metric_submissions: {
        Row: {
          id: string
          user_id: string
          metric: string
          claimed_value: number | null
          image_url: string
          status: SubmissionStatus
          vision_result: Json | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['metric_submissions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['metric_submissions']['Row']>
      }
    }
    Functions: {
      apply_reward: {
        Args: { p_xp: number; p_gold: number; p_type: string; p_payload?: Json }
        Returns: void
      }
      check_achievements: {
        Args: Record<string, never>
        Returns: void
      }
    }
  }
}
