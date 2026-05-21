'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { calculateBazi, judgeStrength, findYongShen } from '@/lib/bazi'
import { InkMark } from '@/components/InkMark'

const SHICHEN = [
  { label: '子时', range: '23:00-01:00', hour: 0 },
  { label: '丑时', range: '01:00-03:00', hour: 1 },
  { label: '寅时', range: '03:00-05:00', hour: 3 },
  { label: '卯时', range: '05:00-07:00', hour: 5 },
  { label: '辰时', range: '07:00-09:00', hour: 7 },
  { label: '巳时', range: '09:00-11:00', hour: 9 },
  { label: '午时', range: '11:00-13:00', hour: 11 },
  { label: '未时', range: '13:00-15:00', hour: 13 },
  { label: '申时', range: '15:00-17:00', hour: 15 },
  { label: '酉时', range: '17:00-19:00', hour: 17 },
  { label: '戌时', range: '19:00-21:00', hour: 19 },
  { label: '亥时', range: '21:00-23:00', hour: 21 },
]

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showHourInput, setShowHourInput] = useState(false)
  const [selectedShichen, setSelectedShichen] = useState<number | null>(null)
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

  const handleShichenSelect = (hour: number) => {
    setSelectedShichen(hour)
    setFormData(prev => ({ ...prev, birth_hour: String(hour), birth_minute: '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const birthData = {
      birth_year: formData.birth_year,
      birth_month: formData.birth_month,
      birth_day: formData.birth_day,
      birth_hour: formData.birth_hour,
      birth_minute: formData.birth_minute,
      gender: formData.gender,
      is_lunar: formData.is_lunar
    }

    const hour = formData.birth_hour ? parseInt(formData.birth_hour) : null
    const minute = formData.birth_minute ? parseInt(formData.birth_minute) : null

    let bazi
    try {
      bazi = calculateBazi(
        parseInt(formData.birth_year),
        parseInt(formData.birth_month),
        parseInt(formData.birth_day),
        hour,
        minute,
        formData.is_lunar
      )
    } catch {
      setLoading(false)
      return
    }

    try {
      let { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        const { data, error } = await supabase.auth.signInAnonymously()
        if (error) throw error
        user = data.user
      }

      await supabase.from('user_profiles').insert({
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
    } catch (error) {
      console.warn('Supabase 失败，降级本地模式:', error)
    }

    sessionStorage.setItem('xinzhai_birth', JSON.stringify(birthData))
    const strength = judgeStrength(bazi)
    const yongShen = findYongShen(bazi)
    sessionStorage.setItem('xinzhai_bazi', JSON.stringify({
      dayMaster: bazi.day.wuxing_gan,
      dayMasterGan: bazi.dayGan,
      strength,
      yongShen
    }))

    router.push('/card')
    setLoading(false)
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-6 py-16">
      <div className="animate-fade-in-up w-full max-w-sm flex flex-col gap-8">
        {/* 标题 */}
        <div className="text-center flex flex-col items-center gap-3">
          <InkMark />
          <h1 className="text-xl tracking-[0.2em] text-ink-800 font-light">
            入斋
          </h1>
          <p className="text-[11px] text-ink-400 font-light leading-relaxed">
            填写生辰，照见你的人格底色
          </p>
          <div className="w-8 h-[0.5px] bg-ink-300" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* 昵称 */}
          <div>
            <label className="block text-[11px] text-ink-500 tracking-wider font-light mb-1.5">
              昵称（选填）
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-ink-200 rounded-sm bg-transparent text-sm text-ink-800 placeholder:text-ink-300 focus:outline-none focus:border-ink-400 font-light"
              placeholder="如何称呼你"
            />
          </div>

          {/* 性别 */}
          <div>
            <label className="block text-[11px] text-ink-500 tracking-wider font-light mb-1.5">
              性别
            </label>
            <div className="flex gap-3">
              {(['male', 'female'] as const).map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: g })}
                  className={`flex-1 py-2.5 border text-xs tracking-wider font-light transition-colors duration-300 rounded-sm ${
                    formData.gender === g
                      ? 'border-ink-700 bg-ink-800 text-paper'
                      : 'border-ink-200 text-ink-500 hover:border-ink-400'
                  }`}
                >
                  {g === 'male' ? '男' : '女'}
                </button>
              ))}
            </div>
          </div>

          {/* 出生日期 */}
          <div>
            <label className="block text-[11px] text-ink-500 tracking-wider font-light mb-1.5">
              出生日期（公历）
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'birth_year', ph: '年', min: 1940, max: 2010 },
                { key: 'birth_month', ph: '月', min: 1, max: 12 },
                { key: 'birth_day', ph: '日', min: 1, max: 31 },
              ].map(f => (
                <input
                  key={f.key}
                  type="number"
                  value={formData[f.key as keyof typeof formData] as string}
                  onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                  className="px-3 py-2.5 border border-ink-200 rounded-sm bg-transparent text-sm text-ink-800 text-center placeholder:text-ink-300 focus:outline-none focus:border-ink-400 font-light"
                  placeholder={f.ph}
                  min={f.min}
                  max={f.max}
                  required
                />
              ))}
            </div>
          </div>

          {/* 出生时间 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] text-ink-500 tracking-wider font-light">
                出生时辰（选填）
              </label>
              <button
                type="button"
                onClick={() => setShowHourInput(!showHourInput)}
                className="text-[10px] text-ink-400 hover:text-ink-600 font-light"
              >
                {showHourInput ? '用时辰选择' : '精确输入'}
              </button>
            </div>

            {showHourInput ? (
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={formData.birth_hour}
                  onChange={(e) => { setSelectedShichen(null); setFormData({ ...formData, birth_hour: e.target.value }) }}
                  className="px-3 py-2.5 border border-ink-200 rounded-sm bg-transparent text-sm text-ink-800 text-center placeholder:text-ink-300 focus:outline-none focus:border-ink-400 font-light"
                  placeholder="时（0-23）"
                  min={0} max={23}
                />
                <input
                  type="number"
                  value={formData.birth_minute}
                  onChange={(e) => setFormData({ ...formData, birth_minute: e.target.value })}
                  className="px-3 py-2.5 border border-ink-200 rounded-sm bg-transparent text-sm text-ink-800 text-center placeholder:text-ink-300 focus:outline-none focus:border-ink-400 font-light"
                  placeholder="分"
                  min={0} max={59}
                />
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-1.5">
                {SHICHEN.map(s => (
                  <button
                    key={s.hour}
                    type="button"
                    onClick={() => handleShichenSelect(s.hour)}
                    className={`py-2 rounded-sm text-center transition-colors duration-200 ${
                      selectedShichen === s.hour
                        ? 'bg-ink-800 text-paper'
                        : 'border border-ink-200 text-ink-500 hover:border-ink-400'
                    }`}
                  >
                    <span className="block text-xs font-light">{s.label}</span>
                    <span className={`block text-[9px] font-light ${selectedShichen === s.hour ? 'text-ink-300' : 'text-ink-400'}`}>
                      {s.range}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 农历开关 */}
          <label className="flex items-center gap-2 cursor-pointer">
            <div className={`w-4 h-4 border rounded-sm flex items-center justify-center transition-colors ${
              formData.is_lunar ? 'bg-ink-800 border-ink-800' : 'border-ink-300'
            }`}>
              {formData.is_lunar && <span className="text-paper text-[8px]">✓</span>}
            </div>
            <input
              type="checkbox"
              checked={formData.is_lunar}
              onChange={(e) => setFormData({ ...formData, is_lunar: e.target.checked })}
              className="sr-only"
            />
            <span className="text-[11px] text-ink-500 font-light">这是农历日期</span>
          </label>

          {/* 提交 */}
          <button
            type="submit"
            disabled={loading || !formData.birth_year || !formData.birth_month || !formData.birth_day}
            className="w-full py-3 border border-ink-700 bg-ink-800 text-paper text-sm tracking-[0.15em] font-light hover:bg-ink-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-500 rounded-sm"
          >
            {loading ? '正在起盘…' : '生成命签'}
          </button>
        </form>

        <p className="text-center text-[10px] text-ink-300 font-light">
          心斋 · 八字人格系统
        </p>
      </div>
    </main>
  )
}
