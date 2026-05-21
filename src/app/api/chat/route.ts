import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { retrieveJiaoZi, SEED_JIAOZI } from '@/lib/jiaozi'
import { checkHardList } from '@/lib/hardlist'
import { callLLM } from '@/lib/llm'

/**
 * 心斋 · AI 对话 API
 * 
 * v0.2:
 * - Hard List 前置拦截（工单-01 / B-18 / S-2）
 * - 种子钉子库作为风格锚 few-shot（工单-06 / S-1）
 * - 术语黑名单（六破、人元司令、盲派旺衰术语）
 * - 四态边界约束（不滑向算命腔 / 不滑向心灵鸡汤）
 * - 接入硅基流动/DeepSeek API（预留）
 */

// ============ System Prompt 定义（工单-06 核心交付）============

function buildSystemPrompt(matchedJiaoZi: any[]): string {
  const jiaoZiExamples = matchedJiaoZi
    .map((j, i) => `${i + 1}. ${j.content}`)
    .join('\n');

  return `你是心斋的对谈者，不是算命先生。

【声音锚点——以下是你说话的方式】
${jiaoZiExamples}

【四态边界——你的语气只能在以下范围内切换】
- 觉察态：描述能量状态，不下判词。如"今日金水极盛，你会感觉被夹在中间"
- 映射态：将命理符号翻译成生活体验。如"你身上有把刀，但你一直没拔出来"
- 方向态：给出开放性方向，不给封闭答案。如"找点让你有感觉的事——不用大，一点火星就够了"
- 接住态：遇到难命局或大问题，哲学接住。如"看见当下，比定义命运更有用"
绝对不能滑向：算命腔（"你命中注定"）、心灵鸡汤（"一切都会好的"）

【术语白名单——只能用这些词说命理】
可用：日主、旺衰、用神、喜忌、调候、帮扶、克泄耗、五行、能量、节奏、流动、做功
禁用：六破、人元司令、盲派旺衰算法术语、禄命术语、任何你没有在钉子里见过的术语

【核心原则】
- 你说的是能量和节奏，不是命运和定数
- 你描述当下和倾向，不预测未来
- 你给方向和觉察，不给判词和指令
- 难命局不主动给"先天难"下判词，用哲学接住
- 每次回复控制在150字以内`;
}

// ============ API 主流程 ============

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, bazi, history = [] } = body
    
    // 🔴 工单-01: Hard List 前置拦截（在一切生成之前）
    const hardListResult = checkHardList(message)
    if (hardListResult.blocked) {
      return NextResponse.json({
        reply: hardListResult.reply,
        reasoning: [{
          step: "安全拦截",
          content: `命中红线: ${hardListResult.category}，已走拒答模板`
        }],
        verdict: "安全拦截",
        blocked: true,
        blockedCategory: hardListResult.category
      })
    }

    // 获取用户信息（非阻塞）
    let user = null
    try {
      const { data: userData } = await supabase.auth.getUser()
      user = userData.user
    } catch (e) {
      console.warn('Supabase auth 获取失败，继续匿名对话:', e)
    }
    
    // 检索匹配的钉子（风格锚 + few-shot）
    // 兼容 bazi.strength 可能是对象或字符串
    let matchedJiaoZi = SEED_JIAOZI.slice(0, 3)
    if (bazi?.dayMaster && bazi?.strength) {
      // 提取 strength 字符串
      const strengthStr = typeof bazi.strength === 'string' 
        ? bazi.strength 
        : (bazi.strength?.level || '中和');
      // 提取 yongShen 数组
      const yongShenArr = Array.isArray(bazi.yongShen) 
        ? bazi.yongShen 
        : (bazi.yongShen?.yongShen || []);
      matchedJiaoZi = retrieveJiaoZi(bazi.dayMaster, strengthStr, yongShenArr)
    }

    // 构建 system prompt（含钉子风格锚）
    const systemPrompt = buildSystemPrompt(matchedJiaoZi)
    
    // ✅ LLM 已接入（判断-1：现在接）
    let reply
    try {
      console.log('[chat] step1: 准备调用LLM')
      const llmResult = await callLLM(systemPrompt, message, history)
      console.log('[chat] step2: LLM返回成功, model=', llmResult?.model)
      
      reply = {
        reply: llmResult.reply,
        reasoning: [
          { step: "命局分析", content: bazi?.strength ? `日主${bazi.strength.level}，帮扶力${Math.round(bazi.strength.score * 100)}%` : "命局信息缺失" },
          { step: "用神", content: bazi?.yongShen?.reason || "用神信息缺失" },
          { step: "钉子匹配", content: `匹配${matchedJiaoZi.length}条钉子作为风格锚` },
          { step: "LLM生成", content: "DeepSeek-V3 已基于钉子声音生成回复" }
        ],
        model: llmResult.model,
        usage: llmResult.usage
      }
    } catch (error: any) {
      // LLM调用失败，fallback到规则模板
      console.error("LLM 调用失败，fallback到模板:", error?.message || error)
      reply = generateReply(message, bazi, matchedJiaoZi, history)
      reply.reasoning?.unshift({ step: "降级", content: "LLM调用失败，已降级到规则模板" })
    }
    
    // 保存对话记录（非阻塞）
    if (user) {
      try {
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
      } catch (e) {
        console.warn('保存对话记录失败:', e)
      }
    }
    
    return NextResponse.json(reply)
  } catch (error) {
    console.error('AI 对话失败:', error)
    // 即使出错也返回一个友好回复
    return NextResponse.json({ 
      reply: "我在想，但需要一点时间。能再说一次吗？",
      reasoning: [{ step: "异常", content: String(error) }],
      verdict: "系统繁忙"
    })
  }
}

/**
 * 生成回复（简化版 + 四态边界约束）
 * MVP: 基于规则匹配 + 种子钉子风格
 * TODO: 替换为 LLM API 调用
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
  
  // Step 4: 生成回复（遵循四态边界）
  let reply = ""
  let verdict = ""
  
  if (intent.type === "今日") {
    reply = jiaoZi[0]?.content || "今日能量平稳，顺势而为即可。"
    verdict = "保持节奏，不急不缓"
  } else if (intent.type === "关系") {
    if (bazi?.dayMaster) {
      const matchType = getMatchAdvice(bazi.dayMaster)
      reply = `作为${bazi.dayMaster}命的人，${matchType}。关系不是找"好的"，是找"对的" —— 对你来说，"对"就是能让你的能量流动起来的人。`
      verdict = matchType
    } else {
      reply = "关系的问题，先回到自己 —— 你是什么能量，需要什么能量来流动？"
    }
  } else if (intent.type === "事业") {
    if (bazi?.yongShen) {
      reply = `从你的命局看，${bazi.yongShen.reason}。事业的方向，是找能让你${bazi.yongShen.yongShen?.[0] || "发挥"}的环境，而不是追热门。`
      verdict = `适合${bazi.yongShen.yongShen?.[0] || "发挥"}型事业`
    } else {
      reply = "事业的问题，先看自己的能量在哪 —— 什么让你有劲，什么让你消耗。"
    }
  } else if (intent.type === "命运") {
    reply = "这个问题太大，我不硬答。但我可以告诉你：你现在的能量状态，以及它可能在往哪个方向走。看见当下，比定义命运更有用。"
    verdict = "回到当下"
  } else {
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
  
  if (lowerMsg.includes("今天") || lowerMsg.includes("今日") || lowerMsg.includes("现在")) {
    return {type: "今日", confidence: 0.8}
  }
  if (lowerMsg.includes("关系") || lowerMsg.includes("感情") || lowerMsg.includes("恋爱") || lowerMsg.includes("匹配")) {
    return {type: "关系", confidence: 0.8}
  }
  if (lowerMsg.includes("事业") || lowerMsg.includes("工作") || lowerMsg.includes("职业") || lowerMsg.includes("创业")) {
    return {type: "事业", confidence: 0.8}
  }
  if (lowerMsg.includes("命运") || lowerMsg.includes("这辈子") || lowerMsg.includes("一生") || lowerMsg.includes("命好")) {
    return {type: "命运", confidence: 0.9}
  }
  return {type: "通用", confidence: 0.5}
}

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