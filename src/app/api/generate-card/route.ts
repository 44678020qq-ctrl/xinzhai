import { NextRequest, NextResponse } from "next/server";
import { calculateBazi, baziToPrompt, BaziResult } from "@/lib/bazi";

// 硅基流动 API 配置（从环境变量读取）
const SILICONFLOW_API = "https://api.siliconflow.cn/v1/chat/completions";
const MODEL = "Qwen/Qwen2.5-72B-Instruct";

function getApiKey(): string {
  return process.env.SILICONFLOW_API_KEY || "";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { year, month, day, hour, gender } = body;

    if (!year || !month || !day) {
      return NextResponse.json({ error: "缺少出生信息" }, { status: 400 });
    }

    // 1. 计算八字
    // 时辰格式处理："子时 (23:00-01:00)" → "子时"
    const hourStr = hour
      ? hour.replace(/\s*\(.*\)/, "").replace("时", "").trim()
      : undefined;
    console.log("时辰输入:", hour, "→ 解析后:", hourStr);
    const bazi: BaziResult = calculateBazi(
      parseInt(year),
      parseInt(month),
      parseInt(day),
      hourStr
    );
    console.log("八字结果:", JSON.stringify(bazi, null, 2));

    // 2. 构造 AI prompt
    const prompt = baziToPrompt(bazi, gender || "male");

    // 3. 调用硅基流动 API
    const apiKey = getApiKey();
    if (!apiKey) {
      // 开发模式：返回 mock 数据
      console.warn("未配置 SILICONFLOW_API_KEY，返回 mock 数据");
      return NextResponse.json({
        bazi,
        card: generateMockCard(bazi, gender || "male"),
      });
    }

    const aiRes = await fetch(SILICONFLOW_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI API 错误:", errText);
      return NextResponse.json(
        { error: "AI 生成失败", detail: errText },
        { status: 500 }
      );
    }

    const aiData = await aiRes.json();
    const cardJson = JSON.parse(aiData.choices[0].message.content);

    return NextResponse.json({
      bazi,
      card: cardJson,
    });
  } catch (err: any) {
    console.error("生成人格卡失败:", err);
    return NextResponse.json(
      { error: err.message || "服务器错误" },
      { status: 500 }
    );
  }
}

// Mock 数据（开发模式）
function generateMockCard(bazi: BaziResult, gender: string) {
  const wuxing = bazi.day.wuxing_gan;
  const labelMap: Record<string, string> = {
    "木": "甲木",
    "火": "丙火",
    "土": "戊土",
    "金": "庚金",
    "水": "壬水",
  };
  return {
    wuxing_personality: labelMap[wuxing] || "甲木",
    keywords: ["外柔内刚", "重精神连接", "直觉敏锐", "追求深度"],
    emotion_pattern: "情绪深沉，不轻易外露，但内心波澜壮阔。",
    relation_pattern: "在关系中追求灵魂共鸣，而非表面陪伴。",
    social_tendency: "社交节制，偏爱小圈子深度交流，对陌生人保持距离。",
    summary: `${labelMap[wuxing] || "甲木"}之人，外柔内刚，重精神连接，容易被秩序型人格吸引。`,
    bazi_display: `${bazi.year.gan}${bazi.year.zhi} ${bazi.month.gan}${bazi.month.zhi} ${bazi.day.gan}${bazi.day.zhi} ${bazi.hour ? bazi.hour.gan + bazi.hour.zhi : "??"}`,
  };
}
