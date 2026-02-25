// Kimi API Service (Anthropic Compatible)
// 使用 Anthropic Messages API 格式

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AnthropicResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: Array<{
    type: 'text';
    text: string;
  }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

// AI 评估结果接口
export interface AIEvaluation {
  isCorrect: boolean;
  confidence: number;
  feedbackType: 'praise' | 'hint' | 'correction';
}

// AI 结构化响应接口
export interface AIResponse {
  evaluation: AIEvaluation;
  message: string;
  followUpQuestions: string[];
}

// 服务返回接口
export interface SendMessageResult {
  message: string;
  topic?: string;
  suggestedFollowUps?: string[];
  evaluation?: AIEvaluation;
}

// 考研政治老师 System Prompt
const POLITICS_TEACHER_PROMPT = `你是一位专业的考研政治辅导老师，专门帮助学生学习马克思主义基本原理。

你的教学风格：
1. 耐心、鼓励、循循善诱
2. 善于用通俗易懂的例子解释抽象概念
3. 回答简洁有力，每次回复控制在 100 字以内
4. 对学生的正确回答给予肯定和拓展
5. 对错误回答给予温和纠正并引导思考

【重要】你必须以JSON格式返回响应，格式如下：
{
  "evaluation": {
    "isCorrect": true/false,
    "confidence": 0-1之间的数值,
    "feedbackType": "praise"|"hint"|"correction"
  },
  "message": "对学生的回复内容（简洁、有温度）",
  "followUpQuestions": ["追问1", "追问2"]
}

评判规则：
- isCorrect: 学生回答正确或基本正确时为true，错误或不完整时为false
- confidence: 对判断的置信度，0-1之间的小数
- feedbackType: praise(表扬)|hint(提示)|correction(纠正)
- 始终基于当前知识点进行讲解

你正在通过视频课程教授马克思主义基本原理。`;

class KimiService {
  private apiKey: string;
  private baseUrl = '/api/kimi/anthropic'; // 使用代理路径
  private model = 'kimi-k2.5';
  private systemPrompt: string = POLITICS_TEACHER_PROMPT;
  private conversationHistory: AnthropicMessage[] = [];

  // 话题关键词映射
  private topicKeywords: Record<string, string[]> = {
    capital: ['资本', '剩余价值', 'c+v+m', '利润率'],
    dialectics: ['对立统一', '矛盾', '量变质变'],
    history: ['新民主主义', '辛亥革命'],
  };

  constructor() {
    this.apiKey = import.meta.env.VITE_KIMI_API_KEY || '';
  }

  // 重置对话历史
  resetConversation() {
    this.conversationHistory = [];
    this.systemPrompt = POLITICS_TEACHER_PROMPT;
  }

  // 设置当前知识点上下文
  setKnowledgeContext(knowledgePoint: {
    title: string;
    description: string;
    teachingMessage: string;
    expectedAnswer?: string;
  }) {
    // 添加知识点上下文到 system prompt
    const contextMessage = `当前教学的知识点是："${knowledgePoint.title}"
知识点说明：${knowledgePoint.description}
你刚才对学生说：${knowledgePoint.teachingMessage}
${knowledgePoint.expectedAnswer ? `正确答案关键词包括：${knowledgePoint.expectedAnswer}` : ''}
请根据学生的回答进行评判和讲解。`;

    // 更新 system prompt
    this.systemPrompt = POLITICS_TEACHER_PROMPT + '\n\n' + contextMessage;
    // 重置对话历史（新知识点开始）
    this.conversationHistory = [];
  }

  // 检测话题
  private detectTopic(message: string): string | null {
    const lowerMessage = message.toLowerCase();
    for (const [topic, keywords] of Object.entries(this.topicKeywords)) {
      if (keywords.some(k => lowerMessage.includes(k))) {
        return topic;
      }
    }
    return null;
  }

  // 生成主动追问
  private generateFollowUp(topic: string): string[] {
    switch (topic) {
      case 'capital':
        return [
          '试试计算剩余价值率？',
          '资本有哪几种循环形式？',
          '利润率和剩余价值率的区别是？'
        ];
      case 'dialectics':
        return [
          '能举个生活中的矛盾例子吗？',
          '量变到质变的临界点叫什么？'
        ];
      default:
        return [];
    }
  }

  // 解析 AI 响应（支持 JSON 和降级处理）
  private parseAIResponse(rawResponse: string): AIResponse {
    // 尝试提取 JSON（处理可能的 Markdown 代码块）
    let jsonStr = rawResponse.trim();

    // 移除 Markdown 代码块标记
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    try {
      const parsed = JSON.parse(jsonStr) as AIResponse;

      // 验证必要字段
      if (parsed.evaluation &&
          typeof parsed.evaluation.isCorrect === 'boolean' &&
          typeof parsed.evaluation.confidence === 'number' &&
          typeof parsed.message === 'string') {

        // 规范化 confidence 值
        parsed.evaluation.confidence = Math.max(0, Math.min(1, parsed.evaluation.confidence));

        // 确保 followUpQuestions 是数组
        if (!Array.isArray(parsed.followUpQuestions)) {
          parsed.followUpQuestions = [];
        }

        return parsed;
      }
    } catch (e) {
      console.warn('⚠️ JSON 解析失败，使用降级处理:', e);
    }

    // 降级处理：使用关键词匹配
    return this.fallbackParse(rawResponse);
  }

  // 降级解析（当 JSON 解析失败时使用）
  private fallbackParse(rawResponse: string): AIResponse {
    const lowerResponse = rawResponse.toLowerCase();

    // 判断正确性
    const isCorrect = lowerResponse.includes('✅') ||
      lowerResponse.includes('🎉') ||
      lowerResponse.includes('正确') ||
      lowerResponse.includes('没错') ||
      lowerResponse.includes('完全正确') ||
      lowerResponse.includes('很好') ||
      lowerResponse.includes('棒') ||
      lowerResponse.includes('优秀');

    // 判断反馈类型
    let feedbackType: 'praise' | 'hint' | 'correction' = 'hint';
    if (isCorrect) {
      feedbackType = 'praise';
    } else if (lowerResponse.includes('不对') ||
               lowerResponse.includes('错误') ||
               lowerResponse.includes('不正确')) {
      feedbackType = 'correction';
    }

    return {
      evaluation: {
        isCorrect,
        confidence: isCorrect ? 0.7 : 0.5, // 降级时降低置信度
        feedbackType
      },
      message: rawResponse,
      followUpQuestions: []
    };
  }

  // 发送消息给 Kimi (Anthropic 格式)
  async sendMessage(userMessage: string): Promise<SendMessageResult> {
    if (!this.apiKey) {
      console.warn('⚠️ Kimi API Key 未配置，使用模拟响应');
      return this.getMockResponse(userMessage);
    }

    console.log('🚀 正在调用 Kimi LLM API...');
    console.log('📝 用户消息:', userMessage);

    // 检测话题
    const detectedTopic = this.detectTopic(userMessage);

    // 添加用户消息到历史
    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
    });

    try {
      // 如果检测到特定话题，注入专项 Prompt
      let systemPrompt = this.systemPrompt;
      if (detectedTopic === 'capital') {
        systemPrompt += '\n\n【专项模式：政治经济学】\n检测到学生正在询问《资本论》相关内容。请重点解析概念定义，并尝试用数学公式（如 m\' = m/v）辅助说明。';
      }

      const response = await fetch(`${this.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 500,
          system: systemPrompt,
          messages: this.conversationHistory,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API 请求失败:', response.status, errorText);
        throw new Error(`API 请求失败: ${response.status}`);
      }

      const data: AnthropicResponse = await response.json();
      const assistantMessage = data.content[0]?.text || '抱歉，我没有理解您的问题。';

      console.log('✅ LLM API 调用成功！');
      console.log('🤖 AI 原始回复:', assistantMessage);

      // 解析结构化响应
      const parsedResponse = this.parseAIResponse(assistantMessage);

      console.log('📊 AI 评估结果:', {
        isCorrect: parsedResponse.evaluation.isCorrect,
        confidence: parsedResponse.evaluation.confidence,
        feedbackType: parsedResponse.evaluation.feedbackType
      });

      // 添加助手回复到历史（使用 message 字段）
      this.conversationHistory.push({
        role: 'assistant',
        content: parsedResponse.message,
      });

      // 生成追问建议（优先使用 AI 返回的追问）
      const aiFollowUps = parsedResponse.followUpQuestions.length > 0
        ? parsedResponse.followUpQuestions
        : undefined;
      const suggestedFollowUps = aiFollowUps || (detectedTopic ? this.generateFollowUp(detectedTopic) : undefined);

      return {
        message: parsedResponse.message,
        topic: detectedTopic || undefined,
        suggestedFollowUps,
        evaluation: parsedResponse.evaluation
      };
    } catch (error) {
      console.error('❌ Kimi API 调用失败，使用模拟响应:', error);
      return this.getMockResponse(userMessage);
    }
  }

  // 模拟响应（API 不可用时的后备）
  private getMockResponse(userMessage: string): SendMessageResult {
    const lowerMessage = userMessage.toLowerCase();

    // 简单的关键词匹配
    if (lowerMessage.includes('决定') || lowerMessage.includes('物质') || lowerMessage.includes('第一性')) {
      return {
        message: '✅ 回答正确！物质决定意识，这是唯物论的基石。记住：先有物质世界，才有对它的反映（意识）。',
        evaluation: { isCorrect: true, confidence: 0.95, feedbackType: 'praise' }
      };
    }
    if (lowerMessage.includes('特殊') || lowerMessage.includes('具体')) {
      return {
        message: '🎉 没错！具体问题具体分析体现了矛盾的特殊性。每个矛盾都有其独特性，不能用一刀切的方法解决。',
        evaluation: { isCorrect: true, confidence: 0.95, feedbackType: 'praise' }
      };
    }
    if (lowerMessage.includes('量变') || lowerMessage.includes('积累')) {
      return {
        message: '✅ 正确！冰冻三尺非一日之寒说明了量变是质变的必要准备。要想实现飞跃，必须先经过漫长的积累过程。',
        evaluation: { isCorrect: true, confidence: 0.95, feedbackType: 'praise' }
      };
    }
    if (lowerMessage.includes('标准') || lowerMessage.includes('检验')) {
      return {
        message: '🎉 完全正确！实践是检验真理的唯一标准，这是邓小平思想解放的核心论断。理论必须经过实践检验才能证明其正确性。',
        evaluation: { isCorrect: true, confidence: 0.98, feedbackType: 'praise' }
      };
    }
    if (lowerMessage.includes('群众') || lowerMessage.includes('人民') || lowerMessage.includes('时势')) {
      return {
        message: '✅ 回答得好！马克思主义群众史观认为"时势造英雄"，人民群众才是历史发展的决定力量。',
        evaluation: { isCorrect: true, confidence: 0.95, feedbackType: 'praise' }
      };
    }

    return {
      message: '🤔 你的想法有一定道理，但让我们再深入思考一下这个问题的核心要点...',
      evaluation: { isCorrect: false, confidence: 0.6, feedbackType: 'hint' }
    };
  }

  // 检查 API Key 是否已配置
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

// 单例导出
export const kimiService = new KimiService();
export default kimiService;
