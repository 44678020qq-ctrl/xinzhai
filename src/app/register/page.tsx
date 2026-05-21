'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { calculateBazi, judgeStrength, findYongShen } from '@/lib/bazi'
import { InkMark } from '@/components/InkMark'
import { SolarTimeTrace } from '@/components/SolarTimeTrace'

// 中国主要城市经纬度（真太阳时L2必须）
const CITY_COORDS: Record<string, { longitude: number; latitude: number }> = {
  '北京': { longitude: 116.4, latitude: 39.9 },
  '上海': { longitude: 121.5, latitude: 31.2 },
  '广州': { longitude: 113.3, latitude: 23.1 },
  '深圳': { longitude: 114.1, latitude: 22.5 },
  '成都': { longitude: 104.1, latitude: 30.6 },
  '重庆': { longitude: 106.5, latitude: 29.5 },
  '杭州': { longitude: 120.2, latitude: 30.3 },
  '武汉': { longitude: 114.3, latitude: 30.6 },
  '南京': { longitude: 118.8, latitude: 32.1 },
  '西安': { longitude: 108.9, latitude: 34.3 },
  '长沙': { longitude: 113.0, latitude: 28.2 },
  '天津': { longitude: 117.2, latitude: 39.1 },
  '苏州': { longitude: 120.6, latitude: 31.3 },
  '郑州': { longitude: 113.7, latitude: 34.8 },
  '青岛': { longitude: 120.4, latitude: 36.1 },
  '大连': { longitude: 121.6, latitude: 38.9 },
  '沈阳': { longitude: 123.4, latitude: 41.8 },
  '哈尔滨': { longitude: 126.6, latitude: 45.8 },
  '长春': { longitude: 125.3, latitude: 43.9 },
  '昆明': { longitude: 102.7, latitude: 25.0 },
  '贵阳': { longitude: 106.7, latitude: 26.6 },
  '南宁': { longitude: 108.3, latitude: 22.8 },
  '海口': { longitude: 110.3, latitude: 20.0 },
  '三亚': { longitude: 109.5, latitude: 18.3 },
  '福州': { longitude: 119.3, latitude: 26.1 },
  '厦门': { longitude: 118.1, latitude: 24.5 },
  '合肥': { longitude: 117.3, latitude: 31.8 },
  '南昌': { longitude: 115.9, latitude: 28.7 },
  '太原': { longitude: 112.5, latitude: 37.9 },
  '石家庄': { longitude: 114.5, latitude: 38.0 },
  '兰州': { longitude: 103.8, latitude: 36.1 },
  '乌鲁木齐': { longitude: 87.6, latitude: 43.8 },
  '拉萨': { longitude: 91.1, latitude: 29.7 },
  '呼和浩特': { longitude: 111.7, latitude: 40.8 },
  '银川': { longitude: 106.3, latitude: 38.5 },
  '西宁': { longitude: 101.8, latitude: 36.6 },
  '温州': { longitude: 120.7, latitude: 28.0 },
  '宁波': { longitude: 121.5, latitude: 29.9 },
  '无锡': { longitude: 120.3, latitude: 31.6 },
  '佛山': { longitude: 113.1, latitude: 23.0 },
  '东莞': { longitude: 113.7, latitude: 23.0 },
  '烟台': { longitude: 121.4, latitude: 37.5 },
  '泉州': { longitude: 118.6, latitude: 24.9 },
}

const CITY_LIST = Object.keys(CITY_COORDS)

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
    birth_city: '',  // 出生城市（真太阳时必须）
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
      birth_city: formData.birth_city,
      longitude: CITY_COORDS[formData.birth_city]?.longitude,
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

          {/* 出生城市（真太阳时必须） */}
          <div>
            <label className="block text-[11px] text-ink-500 tracking-wider font-light mb-1.5">
              出生城市（影响时辰精度）
            </label>
            <select
              value={formData.birth_city}
              onChange={(e) => setFormData({ ...formData, birth_city: e.target.value })}
              className="w-full px-4 py-2.5 border border-ink-200 rounded-sm bg-transparent text-sm text-ink-800 focus:outline-none focus:border-ink-400 font-light appearance-none"
            >
              <option value="">选择城市</option>
              {CITY_LIST.map(city => (
                <option key={city} value={city}>{city}{CITY_COORDS[city] && ` (东经${CITY_COORDS[city].longitude}°)`}</option>
              ))}
            </select>
            <p className="text-[10px] text-ink-400 mt-1 font-light">经度决定真太阳时，新疆/西藏可能差2小时</p>
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

          {/* 真太阳时 trace（工单-02） */}
          {formData.birth_hour && parseInt(formData.birth_year) > 0 && parseInt(formData.birth_month) > 0 && parseInt(formData.birth_day) > 0 && (
            <SolarTimeTrace
              birthYear={parseInt(formData.birth_year)}
              birthMonth={parseInt(formData.birth_month)}
              birthDay={parseInt(formData.birth_day)}
              birthHour={parseInt(formData.birth_hour)}
              birthMinute={parseInt(formData.birth_minute) || 0}
              city={formData.birth_city || undefined}
              longitude={formData.birth_city ? CITY_COORDS[formData.birth_city]?.longitude : undefined}
            />
          )}

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
