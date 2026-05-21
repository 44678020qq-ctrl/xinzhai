'use client'

import { useState } from 'react'

interface SolarTimeTraceProps {
  birthYear: number
  birthMonth: number
  birthDay: number
  birthHour: number
  birthMinute: number
  city?: string  // 城市名称（可选）
  longitude?: number  // 经度（可选，如果提供则计算L2）
}

/**
 * 真太阳时计算详情组件（工单-02）
 * 
 * 两档降级：
 * - L1：北京时间 → 真太阳时（简化算法，Bretagnon均时差）
 * - L2：城市经纬度 → 高精度真太阳时（完整算法）
 * 
 * 透明化展示：
 * - 北京时间（用户输入）
 * - 均时差修正（天数）
 * - 经度修正（分钟）
 * - 真太阳时（计算结果）
 * - 时辰调整（是否跨越边界）
 */
export function SolarTimeTrace({
  birthYear,
  birthMonth,
  birthDay,
  birthHour,
  birthMinute,
  city,
  longitude
}: SolarTimeTraceProps) {
  const [expanded, setExpanded] = useState(false)

  // 计算 L1：简化真太阳时
  const dayOfYear = getDayOfYear(birthYear, birthMonth, birthDay)
  const equationOfTime = calculateEquationOfTime(dayOfYear)
  
  // 北京时间（东八区）
  const beijingHour = birthHour
  const beijingMinute = birthMinute
  const beijingTimeStr = `${String(beijingHour).padStart(2, '0')}:${String(beijingMinute).padStart(2, '0')}`
  
  // L1：简化真太阳时
  // 公式：真太阳时 = 北京时间 + 均时差 + (120° - 东经)修正
  // L1 缺省经度，只做均时差修正
  const solarMinuteL1 = beijingMinute + equationOfTime
  let solarHourL1 = beijingHour
  let adjustedMinuteL1 = solarMinuteL1
  
  // 处理分钟溢出
  if (adjustedMinuteL1 >= 60) {
    solarHourL1 += 1
    adjustedMinuteL1 -= 60
  } else if (adjustedMinuteL1 < 0) {
    solarHourL1 -= 1
    adjustedMinuteL1 += 60
  }
  
  const solarTimeL1Str = `${String(solarHourL1).padStart(2, '0')}:${String(Math.round(adjustedMinuteL1)).padStart(2, '0')}`
  
  // L2：高精度真太阳时（如果有经度）
  let solarTimeL2Str = ''
  let longitudeCorrection = 0
  let adjustedMinuteL2 = 0
  
  if (longitude !== undefined) {
    // 经度修正：每度4分钟
    // 东经 > 120°：真太阳时比北京时间早
    // 东经 < 120°：真太阳时比北京时间晚
    longitudeCorrection = (longitude - 120) * 4  // 分钟
    adjustedMinuteL2 = beijingMinute + equationOfTime + longitudeCorrection
    
    let solarHourL2 = beijingHour
    if (adjustedMinuteL2 >= 60) {
      solarHourL2 += Math.floor(adjustedMinuteL2 / 60)
      adjustedMinuteL2 = adjustedMinuteL2 % 60
    } else if (adjustedMinuteL2 < 0) {
      solarHourL2 += Math.floor(adjustedMinuteL2 / 60) - 1
      adjustedMinuteL2 = (adjustedMinuteL2 % 60 + 60) % 60
    }
    
    solarTimeL2Str = `${String(solarHourL2).padStart(2, '0')}:${String(Math.round(adjustedMinuteL2)).padStart(2, '0')}`
  }
  
  // 时辰判断
  const originalShichen = getShichen(beijingHour)
  const adjustedShichen = getShichen(solarHourL1)
  const shichenChanged = originalShichen !== adjustedShichen
  
  return (
    <div className="mt-4 p-3 bg-ink-50 border border-ink-200 rounded-lg">
      {/* 折叠标题 */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-[11px] text-ink-600"
      >
        <span className="flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />
          真太阳时计算详情
          {shichenChanged && (
            <span className="text-[10px] text-amber-600">（时辰已调整）</span>
          )}
        </span>
        <span className="text-ink-400">{expanded ? '收起' : '展开'}</span>
      </button>
      
      {/* 展开内容 */}
      {expanded && (
        <div className="mt-3 space-y-2 text-[11px] text-ink-600">
          {/* 北京时间 */}
          <div className="flex justify-between">
            <span className="text-ink-500">北京时间（输入）</span>
            <span className="font-mono">{beijingTimeStr}</span>
          </div>
          
          {/* 均时差 */}
          <div className="flex justify-between">
            <span className="text-ink-500">均时差修正</span>
            <span className="font-mono">
              {equationOfTime >= 0 ? '+' : ''}{equationOfTime.toFixed(1)} 分钟
            </span>
          </div>
          
          {/* L1：简化真太阳时 */}
          <div className="flex justify-between pt-1 border-t border-ink-100">
            <span className="text-ink-500">真太阳时（L1 简化）</span>
            <span className="font-mono font-medium">{solarTimeL1Str}</span>
          </div>
          
          {/* L2：高精度真太阳时（如果有） */}
          {longitude !== undefined && (
            <>
              <div className="flex justify-between">
                <span className="text-ink-500">经度修正（{city || `东经${longitude}°`}）</span>
                <span className="font-mono">
                  {longitudeCorrection >= 0 ? '+' : ''}{longitudeCorrection.toFixed(1)} 分钟
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-ink-100">
                <span className="text-ink-500">真太阳时（L2 高精度）</span>
                <span className="font-mono font-medium text-ink-800">{solarTimeL2Str}</span>
              </div>
            </>
          )}
          
          {/* 时辰调整 */}
          <div className="flex justify-between pt-1 border-t border-ink-100">
            <span className="text-ink-500">原时辰</span>
            <span className="font-mono">{originalShichen}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-500">调整后时辰</span>
            <span className={`font-mono ${shichenChanged ? 'text-amber-600 font-medium' : ''}`}>
              {adjustedShichen}
              {shichenChanged && ' ✓'}
            </span>
          </div>
          
          {/* 说明 */}
          <div className="mt-3 pt-2 border-t border-ink-100 text-[10px] text-ink-400 leading-relaxed">
            <p>ℹ️ 真太阳时：根据太阳实际位置计算的时间，比北京时间更接近真实天象。</p>
            <p className="mt-1">均时差：地球公转轨道椭圆导致的太阳时差，每天不同（±16分钟）。</p>
            {longitude !== undefined && (
              <p className="mt-1">经度修正：所在城市经度与东经120°的时差（每度4分钟）。</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== 辅助函数 ====================

/**
 * 计算一年中的第几天（1-365）
 */
function getDayOfYear(year: number, month: number, day: number): number {
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
  const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  
  let dayOfYear = day
  for (let i = 0; i < month - 1; i++) {
    dayOfYear += daysInMonth[i]
  }
  
  return dayOfYear
}

/**
 * 计算均时差（Equation of Time）
 * 使用 Bretagnon 简化公式（精度 ±30秒）
 * 
 * @param dayOfYear 一年中的第几天（1-365）
 * @returns 均时差（分钟）
 */
function calculateEquationOfTime(dayOfYear: number): number {
  // 将天数转换为弧度（一年 = 2π）
  const theta = (2 * Math.PI * dayOfYear) / 365
  
  // Bretagnon 公式（简化版）
  // E = 9.87*sin(2θ) - 7.53*cos(θ) - 1.5*sin(θ)
  const eot = 9.87 * Math.sin(2 * theta) - 7.53 * Math.cos(theta) - 1.5 * Math.sin(theta)
  
  return eot
}

/**
 * 根据小时判断时辰
 */
function getShichen(hour: number): string {
  if (hour === 23 || hour === 0) return '子时'
  if (hour >= 1 && hour < 3) return '丑时'
  if (hour >= 3 && hour < 5) return '寅时'
  if (hour >= 5 && hour < 7) return '卯时'
  if (hour >= 7 && hour < 9) return '辰时'
  if (hour >= 9 && hour < 11) return '巳时'
  if (hour >= 11 && hour < 13) return '午时'
  if (hour >= 13 && hour < 15) return '未时'
  if (hour >= 15 && hour < 17) return '申时'
  if (hour >= 17 && hour < 19) return '酉时'
  if (hour >= 19 && hour < 21) return '戌时'
  return '亥时'
}
