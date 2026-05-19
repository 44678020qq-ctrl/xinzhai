import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 数据库类型定义
export interface UserProfile {
  id: string
  created_at: string
  updated_at: string

  // 基本信息
  name: string | null
  avatar_url: string | null

  // 八字信息
  birth_year: number
  birth_month: number
  birth_day: number
  birth_hour: number | null  // 0-23，null 表示未知
  birth_minute: number | null
  gender: 'male' | 'female' | null
  is_lunar: boolean  // true=农历，false=公历

  // 八字排盘结果（缓存）
  bazi_year_gan: string
  bazi_year_zhi: string
  bazi_month_gan: string
  bazi_month_zhi: string
  bazi_day_gan: string
  bazi_day_zhi: string
  bazi_hour_gan: string | null
  bazi_hour_zhi: string | null
  day_master_wuxing: string  // 日主五行

  // 人格标签
  personality_tags: string[]
  personality_desc: string | null

  // 匹配设置
  looking_for_gender: 'male' | 'female' | 'both' | null
  min_age: number | null
  max_age: number | null
}

export interface Match {
  id: string
  created_at: string
  user_id: string
  target_id: string
  score: number
  match_type: string  // '生我' | '我生' | '同类' | '克我' | '我克'
  is_mutual: boolean  // 是否双向匹配
  status: 'pending' | 'accepted' | 'rejected'
}

export interface ChatMessage {
  id: string
  created_at: string
  match_id: string
  sender_id: string
  content: string
  is_read: boolean
}
