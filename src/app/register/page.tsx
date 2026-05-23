'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { calculateBazi, judgeStrength, findYongShen } from '@/lib/bazi'
import { InkMark } from '@/components/InkMark'
import { SolarTimeTrace } from '@/components/SolarTimeTrace'

// 真太阳时修正
function adjustToSolarTime(
  birthYear: number, birthMonth: number, birthDay: number,
  birthHour: number, birthMinute: number,
  longitude?: number,
): { adjustedHour: number; adjustedMinute: number; shichenChanged: boolean; originalShichen: string; adjustedShichen: string } {
  const dayOfYear = getDayOfYear(birthYear, birthMonth, birthDay);
  const theta = (2 * Math.PI * dayOfYear) / 365;
  const eot = 9.87 * Math.sin(2 * theta) - 7.53 * Math.cos(theta) - 1.5 * Math.sin(theta);
  let longitudeCorrection = 0;
  if (longitude) longitudeCorrection = (longitude - 120) * 4;
  const totalCorrection = eot + longitudeCorrection;
  let adjustedMinute = birthMinute + totalCorrection;
  let adjustedHour = birthHour;
  if (adjustedMinute >= 60) {
    adjustedHour += Math.floor(adjustedMinute / 60);
    adjustedMinute = adjustedMinute % 60;
  } else if (adjustedMinute < 0) {
    adjustedHour += Math.floor(adjustedMinute / 60) - 1;
    adjustedMinute = (adjustedMinute % 60 + 60) % 60;
  }
  const originalShichen = getShichenName(birthHour);
  const adjustedShichen = getShichenName(adjustedHour);
  return {
    adjustedHour, adjustedMinute: Math.round(adjustedMinute),
    shichenChanged: originalShichen !== adjustedShichen,
    originalShichen, adjustedShichen,
  };
}

function getDayOfYear(year: number, month: number, day: number): number {
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let dayOfYear = day;
  for (let i = 0; i < month - 1; i++) dayOfYear += daysInMonth[i];
  return dayOfYear;
}

function getShichenName(hour: number): string {
  if (hour === 23 || hour === 0) return '子时';
  if (hour >= 1 && hour < 3) return '丑时';
  if (hour >= 3 && hour < 5) return '寅时';
  if (hour >= 5 && hour < 7) return '卯时';
  if (hour >= 7 && hour < 9) return '辰时';
  if (hour >= 9 && hour < 11) return '巳时';
  if (hour >= 11 && hour < 13) return '午时';
  if (hour >= 13 && hour < 15) return '未时';
  if (hour >= 15 && hour < 17) return '申时';
  if (hour >= 17 && hour < 19) return '酉时';
  if (hour >= 19 && hour < 21) return '戌时';
  return '亥时';
}

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

    const solarAdjusted = hour ? adjustToSolarTime(
      parseInt(formData.birth_year), parseInt(formData.birth_month), parseInt(formData.birth_day),
      hour, minute || 0
    ) : null

    const effectiveHour = solarAdjusted?.shichenChanged ? solarAdjusted.adjustedHour : hour
    const effectiveMinute = solarAdjusted?.shichenChanged ? solarAdjusted.adjustedMinute : minute

    let bazi
    try {
      bazi = calculateBazi(
        parseInt(formData.birth_year),
        parseInt(formData.birth_month),
        parseInt(formData.birth_day),
        effectiveHour,
        effectiveMinute,
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
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-bg">
      <div className="animate-fade-in-up w-full max-w-sm flex flex-col gap-8">

        {/* 标题区 */}
        <div className="text-center flex flex-col items-center gap-3">
          <InkMark />
          <h1 className="text-2xl font-semibold text-ink tracking-wide">
            先认识一下你
          </h1>
          <p className="text-sm text-sub font-light">
            填写出生信息，生成你的能量名片
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* 昵称 */}
          <div>
            <label className="block text-xs text-sub mb-1.5 font-medium">昵称（选填）</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl border border-line bg-card text-sm text-ink placeholder:text-line focus:outline-none focus:border-accent transition-colors"
              placeholder="如何称呼你"
            />
          </div>

          {/* 性别 */}
          <div>
            <label className="block text-xs text-sub mb-1.5 font-medium">性别</label>
            <div className="flex gap-3">
              {(['male', 'female'] as const).map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: g })}
                  className={`flex-1 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
                    formData.gender === g
                      ? 'bg-accent text-white shadow-sm'
                      : 'border border-line text-sub hover:border-accent hover:text-accent'
                  }`}
                >
                  {g === 'male' ? '男' : '女'}
                </button>
              ))}
            </div>
          </div>

          {/* 出生日期 */}
          <div>
            <label className="block text-xs text-sub mb-1.5 font-medium">出生日期（公历）</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'birth_year', ph: '1998', min: 1940, max: 2010 },
                { key: 'birth_month', ph: '10', min: 1, max: 12 },
                { key: 'birth_day', ph: '12', min: 1, max: 31 },
              ].map(f => (
                <input
                  key={f.key}
                  type="number"
                  value={formData[f.key as keyof typeof formData] as string}
                  onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                  className="px-3 py-3 rounded-2xl border border-line bg-card text-sm text-ink text-center placeholder:text-line focus:outline-none focus:border-accent transition-colors"
                  placeholder={f.ph}
                  min={f.min}
                  max={f.max}
                  required
                />
              ))}
            </div>
          </div>

          {/* 出生时辰 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-sub font-medium">出生时辰（选填）</label>
              <button
                type="button"
                onClick={() => setShowHourInput(!showHourInput)}
                className="text-xs text-accent font-medium"
              >
                {showHourInput ? '用时辰选择' : '精确输入'}
              </button>
            </div>

            {showHourInput ? (
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  value={formData.birth_hour}
                  onChange={(e) => { setSelectedShichen(null); setFormData({ ...formData, birth_hour: e.target.value }) }}
                  className="px-3 py-3 rounded-2xl border border-line bg-card text-sm text-ink text-center placeholder:text-line focus:outline-none focus:border-accent transition-colors"
                  placeholder="时（0-23）"
                  min={0} max={23}
                />
                <input
                  type="number"
                  value={formData.birth_minute}
                  onChange={(e) => setFormData({ ...formData, birth_minute: e.target.value })}
                  className="px-3 py-3 rounded-2xl border border-line bg-card text-sm text-ink text-center placeholder:text-line focus:outline-none focus:border-accent transition-colors"
                  placeholder="分"
                  min={0} max={59}
                />
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {SHICHEN.map(s => (
                  <button
                    key={s.hour}
                    type="button"
                    onClick={() => handleShichenSelect(s.hour)}
                    className={`py-2.5 rounded-xl text-center transition-all duration-200 ${
                      selectedShichen === s.hour
                        ? 'bg-accent text-white shadow-sm'
                        : 'border border-line text-sub hover:border-accent hover:text-accent'
                    }`}
                  >
                    <span className="block text-xs font-medium">{s.label}</span>
                    <span className={`block text-[10px] mt-0.5 ${selectedShichen === s.hour ? 'text-white/70' : 'text-line'}`}>
                      {s.range}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 农历开关 */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <div className={`w-5 h-5 rounded-xl border-2 flex items-center justify-center transition-colors ${
              formData.is_lunar ? 'bg-accent border-accent' : 'border-line'
            }`}>
              {formData.is_lunar && <span className="text-white text-[10px]">✓</span>}
            </div>
            <input
              type="checkbox"
              checked={formData.is_lunar}
              onChange={(e) => setFormData({ ...formData, is_lunar: e.target.checked })}
              className="sr-only"
            />
            <span className="text-xs text-sub font-light">这是农历日期</span>
          </label>

          {/* 真太阳时 trace */}
          {formData.birth_hour && parseInt(formData.birth_year) > 0 && parseInt(formData.birth_month) > 0 && parseInt(formData.birth_day) > 0 && (
            <SolarTimeTrace
              birthYear={parseInt(formData.birth_year)}
              birthMonth={parseInt(formData.birth_month)}
              birthDay={parseInt(formData.birth_day)}
              birthHour={parseInt(formData.birth_hour)}
              birthMinute={parseInt(formData.birth_minute) || 0}
            />
          )}

          {/* 提交 */}
          <button
            type="submit"
            disabled={loading || !formData.birth_year || !formData.birth_month || !formData.birth_day}
            className="w-full py-3.5 rounded-2xl bg-accent text-white text-sm font-semibold tracking-wide disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#5A8D7A] transition-colors shadow-sm mt-2"
          >
            {loading ? '生成中…' : '生成我的能量名片 →'}
          </button>
        </form>

        <p className="text-center text-[11px] text-line font-light">
          你的出生信息只有你自己能看到
        </p>
      </div>
    </main>
  )
}
