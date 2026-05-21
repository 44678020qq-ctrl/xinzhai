/**
 * 心斋 · LLM 客户端（DeepSeek 官方 API）
 * 
 * 使用 DeepSeek-V4-Flash 模型
 * Endpoint: https://api.deepseek.com/v1/chat/completions
 */

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface LLMResponse {
  reply: string;
  reasoning?: Array<{step: string, content: string}>;
  model?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * 调用 DeepSeek API
 * 
 * @param systemPrompt 系统提示词（含钉子few-shot）
 * @param userMessage 用户消息
 * @param history 对话历史（可选）
 * @returns AI回复 + 推理过程
 */
export async function callLLM(
  systemPrompt: string,
  userMessage: string,
  history: Message[] = []
): Promise<LLMResponse> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY 未配置");
  }

  // 构建消息序列
  const messages: Message[] = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: userMessage }
  ];

  try {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages,
        temperature: 0.7,
        max_tokens: 300,  // 限制回复长度
        stream: false
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LLM API 调用失败: ${response.status} ${error}`);
    }

    const data = await response.json();
    
    return {
      reply: data.choices[0].message.content,
      model: data.model,
      usage: {
        prompt_tokens: data.usage?.prompt_tokens || 0,
        completion_tokens: data.usage?.completion_tokens || 0,
        total_tokens: data.usage?.total_tokens || 0
      }
    };
  } catch (error) {
    console.error("LLM 调用失败:", error);
    throw error;
  }
}

/**
 * 流式调用（SSE）- 预留给未来
 */
export async function* streamLLM(
  systemPrompt: string,
  userMessage: string,
  history: Message[] = []
): AsyncGenerator<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY 未配置");
  }

  const messages: Message[] = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: userMessage }
  ];

  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages,
      temperature: 0.7,
      max_tokens: 300,
      stream: true
    })
  });

  if (!response.ok) {
    throw new Error(`LLM API 调用失败: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("无法获取流式响应");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") return;
        
        try {
          const json = JSON.parse(data);
          const content = json.choices?.[0]?.delta?.content;
          if (content) {
            yield content;
          }
        } catch (e) {
          // 忽略解析错误
        }
      }
    }
  }
}
