'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { calculateBazi, judgeStrength, findYongShen } from '@/lib/bazi'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    gender: '' as 'male' | 'female' | '',
    birth_year: '',
    birth_month: '',
    birth_day: '',
    birth_hour: '',
    birth_minute: '',
    is_lunar: false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 计算八字
      const hour = formData.birth_hour ? parseInt(formData.birth_hour) : null
      const minute = formData.birth_minute ? parseInt(formData.birth_minute) : null

      const bazi = calculateBazi(
        parseInt(formData.birth_year),
        parseInt(formData.birth_month),
        parseInt(formData.birth_day),
        hour,
        minute,
        formData.is_lunar
      )

      // 保存到 Supabase（使用匿名登录）
      let { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // 如果没登录，先匿名登录
        const { data, error } = await supabase.auth.signInAnonymously()
        if (error) throw error
        user = data.user
      }

      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: user?.id,
          name: formData.name || null,
          gender: formData.gender || null,
          birth_year: parseInt(formData.birth_year),
          birth_month: parseInt(formData.birth_month),
          birth_day: parseInt(formData.birth_day),
          birth_hour: hour,
          birth_minute: minute,
          is_lunar: formData.is_lunar,
          bazi_year_gan: bazi.year.gan,
          bazi_year_zhi: bazi.year.zhi,
          bazi_month_gan: bazi.month.gan,
          bazi_month_zhi: bazi.month.zhi,
          bazi_day_gan: bazi.day.gan,
          bazi_day_zhi: bazi.day.zhi,
          bazi_hour_gan: bazi.hour?.gan || null,
          bazi_hour_zhi: bazi.hour?.zhi || null,
          day_master_wuxing: bazi.day.wuxing_gan,
          personality_tags: [],
          updated_at: new Date().toISOString()
        })

      if (profileError) throw profileError

      // 保存到 sessionStorage 供 /card 和 /chat 页面使用
      sessionStorage.setItem('xinzhai_birth', JSON.stringify({
        birth_year: formData.birth_year,
        birth_month: formData.birth_month,
        birth_day: formData.birth_day,
        birth_hour: formData.birth_hour,
        birth_minute: formData.birth_minute,
        gender: formData.gender,
        is_lunar: formData.is_lunar
      }))
      
      // 保存八字信息供 chat 使用
      const strength = judgeStrength(bazi)
      const yongShen = findYongShen(bazi)
      sessionStorage.setItem('xinzhai_bazi', JSON.stringify({
        dayMaster: bazi.day.wuxing_gan,
        dayMasterGan: bazi.dayGan,
        strength,
        yongShen
      }))

      // 跳转到卡片页
      router.push('/card')
    } catch (error) {
      console.error('注册失败:', error)
      const errMsg = error instanceof Error ? error.message : JSON.stringify(error)
      // 即使 Supabase 失败，也保存到 sessionStorage 并跳转（降级模式）
      sessionStorage.setItem('xinzhai_birth', JSON.stringify({
        birth_year: formData.birth_year,
        birth_month: formData.birth_month,
        birth_day: formData.birth_day,
        birth_hour: formData.birth_hour,
        birth_minute: formData.birth_minute,
        gender: formData.gender,
        is_lunar: formData.is_lunar
      }))
      
      const bazi = calculateBazi(
        parseInt(formData.birth_year),
        parseInt(formData.birth_month),
        parseInt(formData.birth_day),
        formData.birth_hour ? parseInt(formData.birth_hour) : null,
        formData.birth_minute ? parseInt(formData.birth_minute) : null,
        formData.is_lunar
      )
      const strength = judgeStrength(bazi)
      const yongShen = findYongShen(bazi)
      sessionStorage.setItem('xinzhai_bazi', JSON.stringify({
        dayMaster: bazi.day.wuxing_gan,
        dayMasterGan: bazi.dayGan,
        strength,
        yongShen
      }))
      
      console.warn('Supabase 注册失败，使用本地模式继续:', errMsg)
      router.push('/card')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-light text-stone-800">完善档案</h1>
          <p className="text-stone-500 mt-2">填写生辰，开启命理社交之旅</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-2xl shadow-sm">
          {/* 姓名 */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              昵称（选填）
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-400 focus:border-transparent"
              placeholder="如何称呼你？"
            />
          </div>

          {/* 性别 */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              性别
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, gender: 'male' })}
                className={`flex-1 py-2 rounded-lg border ${
                  formData.gender === 'male'
                    ? 'bg-stone-800 text-white border-stone-800'
                    : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                }`}
              >
                男
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, gender: 'female' })}
                className={`flex-1 py-2 rounded-lg border ${
                  formData.gender === 'female'
                    ? 'bg-stone-800 text-white border-stone-800'
                    : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                }`}
              >
                女
              </button>
            </div>
          </div>

          {/* 出生日期 */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              出生日期
            </label>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                value={formData.birth_year}
                onChange={(e) => setFormData({ ...formData, birth_year: e.target.value })}
                className="px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-400"
                placeholder="年"
                min="1900"
                max="2100"
                required
              />
              <input
                type="number"
                value={formData.birth_month}
                onChange={(e) => setFormData({ ...formData, birth_month: e.target.value })}
                className="px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-400"
                placeholder="月"
                min="1"
                max="12"
                required
              />
              <input
                type="number"
                value={formData.birth_day}
                onChange={(e) => setFormData({ ...formData, birth_day: e.target.value })}
                className="px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-400"
                placeholder="日"
                min="1"
                max="31"
                required
              />
            </div>
          </div>

          {/* 出生时间 */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              出生时间（选填，影响时柱）
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={formData.birth_hour}
                onChange={(e) => setFormData({ ...formData, birth_hour: e.target.value })}
                className="px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-400"
                placeholder="时（0-23）"
                min="0"
                max="23"
              />
              <input
                type="number"
                value={formData.birth_minute}
                onChange={(e) => setFormData({ ...formData, birth_minute: e.target.value })}
                className="px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-400"
                placeholder="分"
                min="0"
                max="59"
              />
            </div>
          </div>

          {/* 农历/公历 */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_lunar"
              checked={formData.is_lunar}
              onChange={(e) => setFormData({ ...formData, is_lunar: e.target.checked })}
              className="w-4 h-4 text-stone-800 border-stone-300 rounded focus:ring-stone-500"
            />
            <label htmlFor="is_lunar" className="text-sm text-stone-600">
              这是农历日期
            </label>
          </div>

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-stone-800 text-white rounded-lg font-medium hover:bg-stone-700 disabled:bg-stone-400 disabled:cursor-not-allowed transition"
          >
            {loading ? '保存中...' : '生成我的命盘'}
          </button>
        </form>

        <p className="text-center text-stone-400 text-xs mt-4">
          提交即表示同意我们的隐私政策
        </p>
      </div>
    </div>
  )
}
