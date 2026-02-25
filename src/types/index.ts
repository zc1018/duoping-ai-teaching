// 题目类型
export type QuestionType = 'grammar_fill' | 'reading_comprehension';

// 知识点类型
export interface KnowledgePoint {
  id: string;
  type: 'phrase' | 'word' | 'grammar' | 'important' | 'vocabulary' | 'reading';
  content: string;
  phonetic?: string;
  translation: string;
  exampleInText: string;
  exampleOther?: string[];
  audioUrl?: string;
}

// 答案配置
export interface Answer {
  blankId: number;
  answer: string;
  explanation?: string;
  keyPoint?: {
    phrase: string;
    type: string;
  };
}

// 教学步骤
export interface TeachingStep {
  step: number;
  aiMessage: string;
  expectedAction?: string;
  targetBlank?: number;
  expectedAnswer?: string;
  matchType?: 'exact' | 'keyword' | 'semantic';
}

// 题目配置
export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  content: string;
  answers: Answer[];
  teachingFlow: TeachingStep[];
}

// 对话消息
export interface ChatMessage {
  id: string;
  role: 'ai' | 'user';
  content: string;
  timestamp: Date;
  uiAction?: 'highlight_text' | 'show_options' | 'add_knowledge';
  uiParams?: Record<string, unknown>;
  knowledgePoint?: KnowledgePoint;
  topic?: string;
  suggestedFollowUps?: string[];
}

// 教学状态
export interface TeachingState {
  currentQuestion: Question | null;
  currentStep: number;
  messages: ChatMessage[];
  knowledgePoints: KnowledgePoint[];
  isLoading: boolean;
  highlightedParts: string[];
  completedBlanks: number[];
}

// AI 响应
export interface AIResponse {
  message: string;
  uiAction?: 'highlight_text' | 'show_options' | 'add_knowledge';
  uiParams?: Record<string, unknown>;
  knowledgePoint?: KnowledgePoint;
  isCorrect?: boolean;
  nextStep?: boolean;
}

// 测验题目
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  relatedKnowledgePoint: string;
}

// 测验配置
export interface Quiz {
  questions: QuizQuestion[];
  timeLimit?: number; // 分钟
}

// 测验结果
export interface QuizResult {
  score: number;
  total: number;
  correctCount: number;
  timeTaken: number; // 秒
  answers: {
    questionId: string;
    selectedIndex: number;
    isCorrect: boolean;
  }[];
  weakPoints: string[];
}

// 测验状态
export interface QuizState {
  isActive: boolean;
  currentIndex: number;
  answers: Map<string, number>;
  startTime: Date | null;
  result: QuizResult | null;
}

