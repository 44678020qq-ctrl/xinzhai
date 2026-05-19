import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { retrieveJiaoZi, SEED_JIAOZI } from '@/lib/jiaozi'

/**
 * 心斋 · AI 对话 API
 * 
 * MVP 版本：
 * - 使用种子钉子库作为 few-shot
 * - 基于规则层判断生成回复
 * - 后续接入硅基流动/DeepSeek API
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, bazi, history = [] } = body
    
    // 获取用户命局信息
    const { data: { user } } = await supabase.auth.getUser()
    
    // 检索匹配的钉子（语言参考）
    let matchedJiaoZi = SEED_JIAOZI.slice(0, 3)
    if (bazi?.dayMaster && bazi?.strength) {
      matchedJiaoZi = retrieveJiaoZi(bazi.dayMaster, bazi.strength, bazi.yongShen || [])
    }
    
    // MVP: 简化版回复生成
    // 后续接入 LLM API，使用规则层判断 + 种子钉子 few-shot
    
    const reply = generateReply(message, bazi, matchedJiaoZi, history)
    
    // 保存对话记录
    if (user) {
      await supabase.from('chat_messages').insert({
        user_id: user.id,
        role: 'user',
        content: message
      })
      await supabase.from('chat_messages').insert({
        user_id: user.id,
        role: 'assistant',
        content: reply.reply
      })
    }
    
    return NextResponse.json(reply)
  } catch (error) {
    console.error('AI 对话失败:', error)
    return NextResponse.json({ error: '对话失败' }, { status: 500 })
  }
}

/**
 * 生成回复（简化版）
 * MVP: 基于规则匹配 + 种子钉子风格
 */
function generateReply(
  message: string,
  bazi: any,
  jiaoZi: any[],
  history: any[]
): {
  reply: string;
  reasoning: Array<{step: string, content: string}>;
  verdict?: string;
} {
  const reasoning: Array<{step: string, content: string}> = []
  
  // Step 1: 旺衰分析
  if (bazi?.strength) {
    reasoning.push({
      step: "旺衰",
      content: `日主${bazi.strength.level}，帮扶力${Math.round(bazi.strength.score * 100)}%`
    })
  }
  
  // Step 2: 用神分析
  if (bazi?.yongShen) {
    reasoning.push({
      step: "用神",
      content: bazi.yongShen.reason || `用神为${bazi.yongShen.yongShen?.join('、')}`
    })
  }
  
  // Step 3: 意图识别
  const intent = detectIntent(message)
  reasoning.push({
    step: "意图",
    content: `识别为「${intent.type}」类问题`
  })
  
  // Step 4: 生成回复
  let reply = ""
  let verdict = ""
  
  if (intent.type === "今日") {
    // 今日能量问题
    reply = jiaoZi[0]?.content || "今日能量平稳，顺势而为即可。"
    verdict = "保持节奏，不急不缓"
  } else if (intent.type === "关系") {
    // 关系问题
    if (bazi?.dayMaster) {
      const matchType = getMatchAdvice(bazi.dayMaster)
      reply = `作为${bazi.dayMaster}命的人，${matchType}。关系不是找"好的"，是找"对的" —— 对你来说，"对"就是能让你的能量流动起来的人。`
      verdict = matchType
    } else {
      reply = "关系的问题，先回到自己 —— 你是什么能量，需要什么能量来流动？"
    }
  } else if (intent.type === "事业") {
    // 事业问题
    if (bazi?.yongShen) {
      reply = `从你的命局看，${bazi.yongShen.reason}。事业的方向，是找能让你${bazi.yongShen.yongShen?.[0] || "发挥"}的环境，而不是追热门。`
      verdict = `适合${bazi.yongShen.yongShen?.[0] || "发挥"}型事业`
    } else {
      reply = "事业的问题，先看自己的能量在哪 —— 什么让你有劲，什么让你消耗。"
    }
  } else if (intent.type === "命运") {
    // 命运级大问题 → 哲学避问
    reply = "这个问题太大，我不硬答。但我可以告诉你：你现在的能量状态，以及它可能在往哪个方向走。看见当下，比定义命运更有用。"
    verdict = "回到当下"
  } else {
    // 通用问题
    reply = jiaoZi[0]?.content || "我听到了。能具体一点吗？"
  }
  
  // Step 5: 综合
  reasoning.push({
    step: "综合",
    content: verdict || "给出方向性建议"
  })
  
  return { reply, reasoning, verdict }
}

/**
 * 意图识别（简化版）
 */
function detectIntent(message: string): {type: string, confidence: number} {
  const lowerMsg = message.toLowerCase()
  
  // 今日能量
  if (lowerMsg.includes("今天") || lowerMsg.includes("今日") || lowerMsg.includes("现在")) {
    return {type: "今日", confidence: 0.8}
  }
  
  // 关系
  if (lowerMsg.includes("关系") || lowerMsg.includes("感情") || lowerMsg.includes("恋爱") || lowerMsg.includes("匹配")) {
    return {type: "关系", confidence: 0.8}
  }
  
  // 事业
  if (lowerMsg.includes("事业") || lowerMsg.includes("工作") || lowerMsg.includes("职业") || lowerMsg.includes("创业")) {
    return {type: "事业", confidence: 0.8}
  }
  
  // 命运级大问题
  if (lowerMsg.includes("命运") || lowerMsg.includes("这辈子") || lowerMsg.includes("一生") || lowerMsg.includes("命好")) {
    return {type: "命运", confidence: 0.9}
  }
  
  return {type: "通用", confidence: 0.5}
}

/**
 * 获取匹配建议
 */
function getMatchAdvice(dayMaster: string): string {
  const advice: Record<string, string> = {
    "木": "你容易被有深度、有精神追求的人吸引",
    "火": "你容易被稳重、能包容你热情的人吸引",
    "土": "你需要有活力、能带动你的人",
    "金": "你容易被灵活、能软化你锐利的人吸引",
    "水": "你容易被坚定、能给你方向的人吸引"
  }
  return advice[dayMaster] || "你需要能让你能量流动的人"
}
