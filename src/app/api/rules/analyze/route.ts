import { NextRequest, NextResponse } from 'next/server'
import { execFile } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execFileAsync = promisify(execFile)

/**
 * /api/rules/analyze - 规则引擎分析接口
 * 
 * 调用 Python 规则引擎，返回带因果链的完整分析结果
 * 
 * 请求体:
 *   {
 *     year, month, day, hour, minute,  // 出生日期（公历）
 *     gender,                          // 性别
 *     city?,                           // 城市名（L2 高精模式）
 *     longitude?,                      // 经度（L2 高精模式）
 *   }
 * 
 * 响应体:
 *   {
 *     success: boolean,
 *     data: BaziAnalysisResult,  // 含因果链的完整分析
 *     solar_time: {...},         // 真太阳时信息
 *     time_accuracy: "standard"|"high",
 *     error?: string
 *   }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { birth_year, birth_month, birth_day, birth_hour, birth_minute, gender, city, longitude } = body

    // 参数校验
    if (!birth_year || !birth_month || !birth_day) {
      return NextResponse.json(
        { success: false, error: '缺少出生日期参数' },
        { status: 400 }
      )
    }

    const year = parseInt(birth_year)
    const month = parseInt(birth_month)
    const day = parseInt(birth_day)
    const hour = birth_hour ? parseInt(birth_hour) : 12  // 默认午时
    const minute = birth_minute ? parseInt(birth_minute) : 0

    // 调用 Python 规则引擎
    const pythonScript = path.join(process.cwd(), 'rules', 'run_analysis.py')
    
    const args = [
      pythonScript,
      '--year', String(year),
      '--month', String(month),
      '--day', String(day),
      '--hour', String(hour),
      '--minute', String(minute),
    ]

    if (gender) args.push('--gender', gender)
    if (city) args.push('--city', city)
    if (longitude) args.push('--longitude', String(parseFloat(longitude)))

    // 设置超时（5秒）
    const { stdout, stderr } = await execFileAsync('python3', args, {
      timeout: 5000,
      cwd: process.cwd(),
    })

    if (stderr && stderr.includes('Error')) {
      console.error('Python engine error:', stderr)
      return NextResponse.json(
        { success: false, error: '规则引擎执行失败' },
        { status: 500 }
      )
    }

    let result;
    try {
      result = JSON.parse(stdout.trim());
    } catch (parseError) {
      console.error('Python output is not valid JSON:', stdout.slice(0, 500));
      return NextResponse.json({
        success: false,
        error: 'Python 引擎输出格式错误',
        fallback: true,
      }, { status: 503 });
    }

    return NextResponse.json({
      success: true,
      data: result.analysis,
      solar_time: result.solar_time,
      time_accuracy: result.time_accuracy,
    })

  } catch (error: unknown) {
    console.error('规则分析失败:', error)
    
    // Python 不可用时降级到 TypeScript 规则层
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    if (errorMessage.includes('python3') || errorMessage.includes('ENOENT')) {
      return NextResponse.json({
        success: false,
        error: 'Python 规则引擎不可用，请使用 /api/generate-card 接口',
        fallback: true,
      }, { status: 503 })
    }

    return NextResponse.json(
      { success: false, error: '分析失败: ' + errorMessage },
      { status: 500 }
    )
  }
}
