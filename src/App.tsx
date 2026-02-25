import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import './index.css';
import ThreeColumnLayout from './components/Layout/ThreeColumnLayout';
import VideoPlayer, { type KnowledgeMarker } from './components/VideoPlayer/VideoPlayer';
import TeachingArea from './components/TeachingArea/TeachingArea';
import AccumulationArea from './components/AccumulationArea/AccumulationArea';
import QuizArea from './components/QuizArea/QuizArea';
import Confetti from './components/Effects/Confetti';
import ProgressMilestone from './components/Effects/ProgressMilestone';
import Loading from './components/Loading/Loading';
import coursesData from './data/courses.json';
import type { ChatMessage, KnowledgePoint, QuizQuestion, QuizResult } from './types';
import type { Anchor } from './types/tutoring';
import { kimiService } from './services/kimiService';
import ViewSwitcher from './components/ViewSwitcher/ViewSwitcher';
import ArticleReader from './components/ArticleReader/ArticleReader';
import QuestionTutor from './components/QuestionTutor/QuestionTutor';
import LearningPathIndicator from './components/LearningPath/LearningPathIndicator';
import StageTransitionModal from './components/LearningPath/StageTransitionModal';
import { mockArticle } from './data/mockArticle';
import { mockQuestion } from './data/mockQuestion';
import { mockPaper } from './data/mockPaper';
import { useLearningProgress } from './hooks/useLearningProgress';

// 学习阶段类型
type LearningStage = 'video' | 'article' | 'question' | 'completed';

// 学习路径状态接口
interface LearningPathState {
  currentStage: LearningStage;
  completedStages: LearningStage[];
  stageProgress: {
    video: number;
    article: number;
    question: number;
  };
}

// 课程类型
interface Course {
  id: string;
  title: string;
  videoUrl: string;
  duration: number;
  markers: CourseMarker[];
  summary: string;
  quiz?: {
    timeLimit?: number;
    questions: QuizQuestion[];
  };
}

interface CourseMarker extends KnowledgeMarker {
  description?: string;
  teachingMessage?: string;
  expectedAnswer?: string;
  skipCondition?: string;
  context?: string;
}

// 生成唯一 ID
const generateId = () => Math.random().toString(36).substring(2, 9);

function App() {
  // 初始化加载状态
  const [isInitializing, setIsInitializing] = useState(true);

  // 课程状态
  const [currentCourse] = useState<Course>(
    coursesData.courses[0] as unknown as Course
  );

  // 学习进度持久化
  const { loadProgress, saveProgress, resetProgress, getRemainingDays } = useLearningProgress(currentCourse.id);

  // 视频控制
  const videoControlRef = useRef<{
    play: () => void;
    pause: () => void;
    seekTo: (time: number) => void;
    skipToMarker: (markerId: string) => void;
  } | null>(null);

  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [currentMarkerIndex, setCurrentMarkerIndex] = useState(-1);
  const [completedMarkers, setCompletedMarkers] = useState<string[]>([]);

  // 对话状态
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePoint[]>([]);

  // 动画效果状态
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiType, setConfettiType] = useState<'light' | 'full'>('light');

  // 测验状态
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  // 视图切换状态
  const [activeView, setActiveView] = useState<'video' | 'article' | 'question'>('video');
  const [activeAnchorId, setActiveAnchorId] = useState<string | undefined>(); // 当前激活的锚点
  const [currentAnchor, setCurrentAnchor] = useState<Anchor | null>(null); // 当前锚点对象

  // 学习路径状态
  const [learningPath, setLearningPath] = useState<LearningPathState>({
    currentStage: 'video',
    completedStages: [],
    stageProgress: {
      video: 0,
      article: 0,
      question: 0,
    },
  });

  // 阶段切换提示弹窗状态
  const [showStageModal, setShowStageModal] = useState(false);
  const [stageModalConfig, setStageModalConfig] = useState<{
    title: string;
    message: string;
    nextStage: LearningStage;
    showSkip: boolean;
  } | null>(null);

  // 是否完成所有知识点
  const isAllMarkersCompleted = completedMarkers.length === currentCourse.markers.length && currentCourse.markers.length > 0;

  // 文章锚点完成状态（用于后续扩展）
  const [_completedArticleAnchors, setCompletedArticleAnchors] = useState<string[]>([]);

  // 题目锚点完成状态（用于后续扩展）
  const [_completedQuestionAnchors, setCompletedQuestionAnchors] = useState<string[]>([]);

  // 知识点 ID 到标题的映射
  const knowledgePointTitles = useMemo(() => {
    const map = new Map<string, string>();
    currentCourse.markers.forEach((m) => {
      map.set(m.id, m.title);
    });
    return map;
  }, [currentCourse.markers]);

  // 更新学习路径进度
  const updateStageProgress = useCallback((stage: LearningStage, progress: number) => {
    setLearningPath((prev) => ({
      ...prev,
      stageProgress: {
        ...prev.stageProgress,
        [stage]: Math.min(100, Math.max(0, progress)),
      },
    }));
  }, []);

  // 标记阶段完成并推进到下一阶段
  const completeStageAndAdvance = useCallback((stage: LearningStage) => {
    setLearningPath((prev) => {
      const newCompletedStages = [...prev.completedStages, stage];
      const stageOrder: LearningStage[] = ['video', 'article', 'question'];
      const currentIndex = stageOrder.indexOf(stage);
      const nextStage = stageOrder[currentIndex + 1] || 'completed';

      return {
        ...prev,
        currentStage: nextStage,
        completedStages: newCompletedStages,
        stageProgress: {
          ...prev.stageProgress,
          [stage]: 100,
        },
      };
    });

    // 显示阶段切换提示
    const stageNames: Record<string, string> = {
      video: '视频学习',
      article: '文章精读',
      question: '题目精讲',
    };

    const messages: Record<string, string> = {
      video: '🎉 恭喜完成视频学习！\n\n接下来进入「文章精读」阶段，通过深度阅读来巩固刚才学到的知识点。',
      article: '📖 文章精读完成！\n\n现在进入「题目精讲」阶段，通过实战练习来检验你的学习成果。',
      question: '🏆 太棒了！你已完成所有学习阶段！\n\n可以进行课后测验来全面检验学习效果。',
    };

    const nextStage = stage === 'video' ? 'article' : stage === 'article' ? 'question' : 'completed';

    if (nextStage !== 'completed') {
      setStageModalConfig({
        title: `${stageNames[stage]}完成！`,
        message: messages[stage],
        nextStage,
        showSkip: true,
      });
      setShowStageModal(true);
    } else {
      // 所有阶段完成，显示完成消息
      const aiMessage: ChatMessage = {
        id: generateId(),
        role: 'ai',
        content: messages[stage],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    }
  }, []);

  // 处理阶段切换确认
  const handleStageTransition = useCallback((nextStage: LearningStage, skip: boolean = false) => {
    setShowStageModal(false);

    if (nextStage === 'completed') return;

    // 切换视图
    setActiveView(nextStage as 'video' | 'article' | 'question');

    if (!skip) {
      // 添加AI引导消息
      const guideMessages: Record<string, string> = {
        article: '📖 进入文章精读模式！\n\n这篇文章围绕「物质与意识」展开，点击高亮部分可以查看详细解析。让我们深入理解刚才视频中的知识点。',
        question: '✍️ 进入题目精讲模式！\n\n这道题目考察「剩余价值」相关知识点，点击选项查看解析，检验你的理解程度。',
      };

      const aiMessage: ChatMessage = {
        id: generateId(),
        role: 'ai',
        content: guideMessages[nextStage],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    }
  }, []);

  // 手动切换视图时更新学习路径
  const handleViewChange = useCallback((view: 'video' | 'article' | 'question') => {
    setActiveView(view);
    setLearningPath((prev) => ({
      ...prev,
      currentStage: view,
    }));
  }, []);

  // 初始化：加载保存的学习进度
  useEffect(() => {
    const initTimer = setTimeout(() => {
      // 尝试加载保存的进度
      const savedProgress = loadProgress();

      if (savedProgress) {
        // 恢复进度数据
        setCompletedMarkers(savedProgress.completedMarkers || []);
        setKnowledgePoints(savedProgress.knowledgePoints || []);
        setQuizCompleted(savedProgress.quizCompleted || false);
        setQuizResult(savedProgress.lastQuizResult || null);

        // 恢复视图状态
        if (savedProgress.activeView) {
          setActiveView(savedProgress.activeView);
        }

        // 恢复测验结果到列表
        if (savedProgress.quizResults && savedProgress.quizResults.length > 0) {
          // 可以在这里处理历史测验记录
          console.log('[App] 恢复测验历史:', savedProgress.quizResults.length, '条记录');
        }

        const remainingDays = getRemainingDays();
        console.log(`[App] 已恢复学习进度，数据有效期还剩 ${remainingDays} 天`);

        // 添加恢复进度的欢迎消息
        const progressPercent = Math.round(
          ((savedProgress.completedMarkers?.length || 0) / currentCourse.markers.length) * 100
        );

        const resumeMessage: ChatMessage = {
          id: generateId(),
          role: 'ai',
          content:
            progressPercent > 0
              ? `👋 欢迎回来！继续学习「${currentCourse.title}」\n\n你已完成了 ${progressPercent}% 的知识点（${savedProgress.completedMarkers?.length || 0}/${currentCourse.markers.length}），继续加油！🎯`
              : `👋 同学你好！今天我们来学习「${currentCourse.title}」\n\n这节课有 ${currentCourse.markers.length} 个重点知识点，我会在合适的时候暂停视频帮你讲解。\n\n准备好了就点击播放按钮开始吧！🎬`,
          timestamp: new Date(),
        };
        setMessages([resumeMessage]);
      } else {
        // 没有保存的进度，显示默认欢迎消息
        const welcomeMessage: ChatMessage = {
          id: generateId(),
          role: 'ai',
          content: `👋 同学你好！今天我们来学习「${currentCourse.title}」\n\n这节课有 ${currentCourse.markers.length} 个重点知识点，我会在合适的时候暂停视频帮你讲解。\n\n准备好了就点击播放按钮开始吧！🎬`,
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
      }

      setIsInitializing(false);
    }, 800);

    return () => clearTimeout(initTimer);
  }, [currentCourse, loadProgress, getRemainingDays]);

  // 处理知识点到达
  const handleMarkerReached = useCallback(
    (marker: KnowledgeMarker) => {
      const courseMarker = currentCourse.markers.find((m) => m.id === marker.id);
      if (!courseMarker || completedMarkers.includes(marker.id)) return;

      // 暂停视频
      videoControlRef.current?.pause();
      setIsVideoPlaying(false);

      // 更新当前知识点索引
      const markerIndex = currentCourse.markers.findIndex(
        (m) => m.id === marker.id
      );
      setCurrentMarkerIndex(markerIndex);

      // 立即添加知识点卡片到右侧积累区
      const newKnowledge: KnowledgePoint = {
        id: courseMarker.id,
        type: courseMarker.type,
        content: courseMarker.title,
        translation: courseMarker.description || '',
        exampleInText: courseMarker.description || '',
      };

      // 检查是否已经存在该知识点
      setKnowledgePoints((prev) => {
        const exists = prev.find(k => k.id === newKnowledge.id);
        if (exists) return prev;
        return [...prev, newKnowledge];
      });

      // 设置 Kimi 知识点上下文
      kimiService.setKnowledgeContext({
        title: courseMarker.title,
        description: courseMarker.description || '',
        teachingMessage: courseMarker.teachingMessage || '',
        expectedAnswer: courseMarker.expectedAnswer,
      });

      // 添加 AI 讲解消息
      setTimeout(() => {
        const aiMessage: ChatMessage = {
          id: generateId(),
          role: 'ai',
          content:
            courseMarker.teachingMessage ||
            `📌 这里有一个知识点：**${courseMarker.title}**\n\n${courseMarker.description || ''}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      }, 500);
    },
    [currentCourse.markers, completedMarkers]
  );

  // 处理用户回答
  const handleUserAnswer = useCallback(
    async (answer: string) => {
      // 添加用户消息
      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: answer,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        // 调用 Kimi API 获取智能响应
        const responseData = await kimiService.sendMessage(answer);
        const { message: aiResponse, topic, suggestedFollowUps, evaluation } = responseData;

        const currentMarker = currentCourse.markers[currentMarkerIndex];

        // 判断是否回答正确（优先使用 AI 返回的结构化评估，降级到关键词匹配）
        let isCorrect: boolean;
        let confidence: number;

        if (evaluation) {
          // 使用 AI 结构化评估结果
          isCorrect = evaluation.isCorrect;
          confidence = evaluation.confidence;
          console.log('📊 使用 AI 结构化评估:', { isCorrect, confidence, feedbackType: evaluation.feedbackType });
        } else {
          // 降级处理：通过 AI 响应中的关键词判断
          isCorrect = aiResponse.includes('✅') ||
            aiResponse.includes('🎉') ||
            aiResponse.includes('正确') ||
            aiResponse.includes('没错') ||
            aiResponse.includes('完全正确');
          confidence = isCorrect ? 0.7 : 0.5;
          console.log('⚠️ 使用降级关键词匹配:', { isCorrect, confidence });
        }

        const aiMessage: ChatMessage = {
          id: generateId(),
          role: 'ai',
          content: aiResponse,
          timestamp: new Date(),
          topic,
          suggestedFollowUps
        };
        setMessages((prev) => [...prev, aiMessage]);

        // 在文章精读或题目辅导模式下，回答正确时添加知识卡片
        if (isCorrect && currentAnchor && (activeView === 'article' || activeView === 'question')) {
          console.log('📚 生成知识卡片:', {
            mode: activeView,
            anchor: currentAnchor.content,
            isCorrect
          });

          const newKnowledge: KnowledgePoint = {
            id: currentAnchor.id,
            type: currentAnchor.type === 'important' ? 'important' :
                  currentAnchor.type === 'error_prone' ? 'grammar' : 'vocabulary',
            content: currentAnchor.content,
            translation: currentAnchor.description || '',
            exampleInText: aiResponse, // 使用 AI 的讲解作为示例
          };

          // 检查是否已经存在该知识点
          setKnowledgePoints((prev) => {
            const exists = prev.find(k => k.id === newKnowledge.id);
            if (exists) {
              console.log('⚠️ 知识点已存在，跳过');
              return prev;
            }
            console.log('✅ 添加新知识点到积累区');
            return [...prev, newKnowledge];
          });

          // 触发轻量彩纸效果
          setConfettiType('light');
          setShowConfetti(true);

          // 清除当前锚点
          setTimeout(() => {
            setActiveAnchorId(undefined);
            setCurrentAnchor(null);
          }, 500);
        } else {
          console.log('❌ 未生成知识卡片:', {
            isCorrect,
            hasAnchor: !!currentAnchor,
            mode: activeView,
            anchorContent: currentAnchor?.content
          });
        }

        // 仅在视频模式下触发完成逻辑
        if (isCorrect && currentMarker && activeView === 'video') {
          // 触发彩纸效果
          setConfettiType('light');
          setShowConfetti(true);

          // 标记完成
          setCompletedMarkers((prev) => [...prev, currentMarker.id]);

          // 更新视频阶段进度
          const newProgress = ((completedMarkers.length + 1) / currentCourse.markers.length) * 100;
          updateStageProgress('video', newProgress);

          // 添加继续提示
          setTimeout(() => {
            const isLastMarker = currentMarkerIndex >= currentCourse.markers.length - 1;
            const continueMessage: ChatMessage = {
              id: generateId(),
              role: 'ai',
              content: isLastMarker
                ? '🎊 恭喜！你已经完成了本节课所有知识点的学习！\n\n接下来可以进入「文章精读」阶段，巩固所学知识。'
                : '📚 让我们继续观看视频，下一个知识点马上到来...',
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, continueMessage]);

            // 继续播放视频或推进到下一阶段
            if (!isLastMarker) {
              setTimeout(() => {
                videoControlRef.current?.play();
                setIsVideoPlaying(true);
              }, 1500);
            } else {
              // 视频阶段完成，自动推进到文章阶段
              setTimeout(() => {
                completeStageAndAdvance('video');
              }, 2000);
            }
          }, 1000);
        }

        // 在文章模式下，回答正确时标记锚点完成
        if (isCorrect && currentAnchor && activeView === 'article') {
          setCompletedArticleAnchors((prev) => {
            if (prev.includes(currentAnchor.id)) return prev;
            const newCompleted = [...prev, currentAnchor.id];
            const progress = (newCompleted.length / mockArticle.anchors.length) * 100;
            updateStageProgress('article', progress);

            // 检查是否完成所有文章锚点
            if (newCompleted.length === mockArticle.anchors.length) {
              setTimeout(() => {
                completeStageAndAdvance('article');
              }, 1500);
            }
            return newCompleted;
          });
        }

        // 在题目模式下，回答正确时标记锚点完成
        if (isCorrect && currentAnchor && activeView === 'question') {
          setCompletedQuestionAnchors((prev) => {
            if (prev.includes(currentAnchor.id)) return prev;
            const newCompleted = [...prev, currentAnchor.id];
            const progress = (newCompleted.length / mockQuestion.anchors.length) * 100;
            updateStageProgress('question', progress);

            // 检查是否完成所有题目锚点
            if (newCompleted.length === mockQuestion.anchors.length) {
              setTimeout(() => {
                completeStageAndAdvance('question');
              }, 1500);
            }
            return newCompleted;
          });
        }
      } catch (error) {
        console.error('AI 响应失败:', error);
        const errorMessage: ChatMessage = {
          id: generateId(),
          role: 'ai',
          content: '抱歉，老师暂时走神了，请再试一次吧~ 🙏',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [currentMarkerIndex, currentCourse.markers, activeView, currentAnchor]
  );

  // 跳过当前知识点
  const handleSkipMarker = useCallback(() => {
    const currentMarker = currentCourse.markers[currentMarkerIndex];
    if (currentMarker) {
      // 标记为已完成（跳过）
      setCompletedMarkers((prev) => [...prev, currentMarker.id]);

      // 添加 AI 消息
      const aiMessage: ChatMessage = {
        id: generateId(),
        role: 'ai',
        content: `⏭ 好的，已跳过「${currentMarker.title}」。\n\n如果之后想复习，可以点击进度条上的知识点标记。`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);

      // 继续播放
      setTimeout(() => {
        videoControlRef.current?.play();
        setIsVideoPlaying(true);
      }, 1000);
    }
  }, [currentMarkerIndex, currentCourse.markers]);

  // 处理文章锚点点击
  const handleAnchorClick = useCallback((anchor: Anchor, context?: { stem: string; reference?: string }) => {
    console.log('🔗 锚点点击:', {
      anchorId: anchor.id,
      anchorContent: anchor.content,
      mode: activeView,
      hasContext: !!context
    });

    setActiveAnchorId(anchor.id);
    setCurrentAnchor(anchor); // 保存当前锚点对象

    console.log('✅ 已设置 currentAnchor:', anchor.content);

    // 构建包含题目上下文的描述
    let description = anchor.description;
    if (context) {
      description = `【题目背景】\n题干：${context.stem}\n${context.reference ? `参考/正确答案：${context.reference}\n` : ''}\n【选项/原文解析】\n${anchor.description}`;
    }

    // 设置 Kimi 知识点上下文
    kimiService.setKnowledgeContext({
      title: anchor.content,
      description: description,
      teachingMessage: anchor.teachingPrompt || '',
    });

    // 触发 AI 提问（主动带教）
    const aiMessage: ChatMessage = {
      id: generateId(),
      role: 'ai',
      content: anchor.teachingPrompt || `关于"${anchor.content}"，你有什么想问的吗？`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, aiMessage]);
  }, [activeView]);

  // 切换到文章模式时，AI 主动引导第一个锚点
  useEffect(() => {
    if (activeView !== 'article') return;
    const firstAnchor = mockArticle.anchors[0];
    if (!firstAnchor) return;

    const timer = setTimeout(() => {
      setActiveAnchorId(firstAnchor.id);
      setCurrentAnchor(firstAnchor);
      kimiService.setKnowledgeContext({
        title: firstAnchor.content,
        description: firstAnchor.description,
        teachingMessage: firstAnchor.teachingPrompt || '',
      });
      const aiMessage: ChatMessage = {
        id: generateId(),
        role: 'ai',
        content: `📖 进入文章精读模式！\n\n我来带你读这篇文章，先看第一个重点——\n\n${firstAnchor.teachingPrompt || `关于「${firstAnchor.content}」，你有什么想问的吗？`}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 300);

    return () => clearTimeout(timer);
  }, [activeView]);
  const handleStartQuiz = useCallback(() => {
    if (currentCourse.quiz) {
      setShowQuiz(true);
    }
  }, [currentCourse.quiz]);

  // 完成测验
  const handleQuizComplete = useCallback((result: QuizResult) => {
    setQuizResult(result);
    setQuizCompleted(true);

    // 高分触发全屏庆祝
    if (result.score >= 80) {
      setConfettiType('full');
      setShowConfetti(true);
    }
  }, []);

  // 关闭测验/返回学习
  const handleCloseQuiz = useCallback(() => {
    setShowQuiz(false);
  }, []);

  // 从测验结果回顾某个知识点（跳回视频对应位置）
  const handleReviewFromQuiz = useCallback((kpId: string) => {
    setShowQuiz(false);
    setActiveView('video');
    setTimeout(() => {
      videoControlRef.current?.skipToMarker(kpId);
    }, 300);
  }, []);

  // 从积累区复习某个知识点（AI 发起提问）
  const handleReviewKnowledgePoint = useCallback((kp: KnowledgePoint) => {
    kimiService.setKnowledgeContext({
      title: kp.content,
      description: kp.translation || '',
      teachingMessage: '',
    });
    const aiMessage: ChatMessage = {
      id: generateId(),
      role: 'ai',
      content: `🔄 来复习一下「${kp.content}」\n\n${kp.translation}\n\n你能用自己的话解释一下这个概念吗？`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, aiMessage]);
  }, []);

  // 将课程 markers 转换为 VideoPlayer 需要的格式
  const videoMarkers: KnowledgeMarker[] = currentCourse.markers.map((m) => ({
    id: m.id,
    time: m.time,
    title: m.title,
    type: m.type,
    isCompleted: completedMarkers.includes(m.id),
  }));

  // 重置进度处理函数
  const handleResetProgress = useCallback(() => {
    if (window.confirm('确定要重置当前课程的学习进度吗？此操作不可恢复。')) {
      resetProgress();
      setCompletedMarkers([]);
      setKnowledgePoints([]);
      setQuizCompleted(false);
      setQuizResult(null);
      setActiveView('video');

      // 添加重置确认消息
      const resetMessage: ChatMessage = {
        id: generateId(),
        role: 'ai',
        content: `🔄 学习进度已重置\n\n让我们重新开始学习「${currentCourse.title}」！\n\n这节课有 ${currentCourse.markers.length} 个重点知识点，准备好了就点击播放按钮开始吧！🎬`,
        timestamp: new Date(),
      };
      setMessages([resetMessage]);

      console.log('[App] 学习进度已重置');
    }
  }, [resetProgress, currentCourse.title, currentCourse.markers.length]);

  // 自动保存学习进度
  useEffect(() => {
    if (isInitializing) return;

    // 保存当前进度到 localStorage
    saveProgress({
      courseId: currentCourse.id,
      completedMarkers,
      knowledgePoints,
      quizResults: quizResult ? [quizResult] : [],
      lastAccessTime: Date.now(),
      activeView,
      quizCompleted,
      lastQuizResult: quizResult,
    });
  }, [completedMarkers, knowledgePoints, quizResult, activeView, quizCompleted, isInitializing, currentCourse.id, saveProgress]);

  // 测验界面
  if (showQuiz && currentCourse.quiz) {
    return (
      <>
        <Confetti
          trigger={showConfetti}
          type={confettiType}
          onComplete={() => setShowConfetti(false)}
        />
        <div className="app-container">
          <header className="app-header">
            <div className="app-header__left">
              <span className="app-header__logo">📝</span>
              <h1 className="app-header__title">Ai 慧学学习系统</h1>
            </div>
            <div className="app-header__right">
              <div className="stat-item">
                <span className="stat-item__icon">📚</span>
                <span>共 {currentCourse.quiz.questions.length} 题</span>
              </div>
            </div>
          </header>
          <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <QuizArea
              questions={currentCourse.quiz.questions}
              timeLimit={currentCourse.quiz.timeLimit}
              onComplete={handleQuizComplete}
              onClose={handleCloseQuiz}
              knowledgePointTitles={knowledgePointTitles}
              onReviewKnowledgePoint={handleReviewFromQuiz}
            />
          </div>
        </div>
      </>
    );
  }

  // 显示加载状态
  if (isInitializing) {
    return <Loading message="正在初始化学习系统..." />;
  }

  return (
    <>
      {/* 彩纸效果 */}
      <Confetti
        trigger={showConfetti}
        type={confettiType}
        onComplete={() => setShowConfetti(false)}
      />

      {/* 进度里程碑 */}
      <ProgressMilestone
        progress={(completedMarkers.length / currentCourse.markers.length) * 100}
        current={completedMarkers.length}
        total={currentCourse.markers.length}
      />

      {/* 阶段切换提示弹窗 */}
      {showStageModal && stageModalConfig && (
        <StageTransitionModal
          title={stageModalConfig.title}
          message={stageModalConfig.message}
          nextStageName={stageModalConfig.nextStage === 'article' ? '文章精读' : stageModalConfig.nextStage === 'question' ? '题目精讲' : '学习完成'}
          onContinue={() => handleStageTransition(stageModalConfig.nextStage, false)}
          onSkip={() => handleStageTransition(stageModalConfig.nextStage, true)}
          showSkip={stageModalConfig.showSkip}
        />
      )}

      <ThreeColumnLayout
        progress={{
          current: completedMarkers.length,
          total: currentCourse.markers.length,
        }}
        knowledgeCount={knowledgePoints.length}
        textArea={
          activeView === 'video' ? (
            <VideoPlayer
              videoUrl={currentCourse.videoUrl}
              title={currentCourse.title}
              markers={videoMarkers}
              expectedDuration={currentCourse.duration}
              aiControlRef={videoControlRef}
              onMarkerReached={handleMarkerReached}
              onPlay={() => setIsVideoPlaying(true)}
              onPause={() => setIsVideoPlaying(false)}
            />
          ) : activeView === 'article' ? (
            <ArticleReader
              article={mockArticle}
              onAnchorClick={handleAnchorClick}
              activeAnchorId={activeAnchorId}
            />
          ) : (
            <QuestionTutor
              question={mockQuestion}
              paper={mockPaper}
              onAnchorClick={handleAnchorClick}
              activeAnchorId={activeAnchorId}
            />
          )
        }
        headerRight={
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <LearningPathIndicator
              currentStage={learningPath.currentStage}
              completedStages={learningPath.completedStages}
              stageProgress={learningPath.stageProgress}
              onStageClick={handleViewChange}
            />
            <ViewSwitcher activeView={activeView} onViewChange={handleViewChange} />
          </div>
        }
        teachingArea={
          <>
            <TeachingArea
              messages={messages}
              isLoading={isLoading}
              onSendMessage={handleUserAnswer}
            />
            {/* 跳过按钮 - 仅在暂停讲解时显示 */}
            {!isVideoPlaying && currentMarkerIndex >= 0 && !isAllMarkersCompleted && activeView === 'video' && (
              <div className="teaching-area__skip">
                <button className="skip-btn" onClick={handleSkipMarker}>
                  ⏭ 我已掌握，跳过这个知识点
                </button>
              </div>
            )}
            {/* 开始测验按钮 - 完成所有知识点后显示 */}
            {isAllMarkersCompleted && currentCourse.quiz && !quizCompleted && activeView === 'video' && (
              <div className="teaching-area__skip">
                <button className="start-quiz-btn" onClick={handleStartQuiz}>
                  <span className="start-quiz-btn__icon">📝</span>
                  开始课后测验
                </button>
              </div>
            )}
            {/* 测验完成后显示成绩 */}
            {quizCompleted && quizResult && (
              <div className="teaching-area__skip">
                <div className="quiz-result-card">
                  <span className="quiz-result-card__icon">
                    {quizResult.score >= 80 ? '🏆' : quizResult.score >= 60 ? '👍' : '💪'}
                  </span>
                  <div className="quiz-result-card__score">
                    测验得分: {quizResult.score}分
                  </div>
                  <div className="quiz-result-card__detail">
                    正确 {quizResult.correctCount}/{quizResult.total} 题
                  </div>
                </div>
              </div>
            )}
          </>
        }
        accumulationArea={
          <AccumulationArea
            knowledgePoints={knowledgePoints}
            onReview={handleReviewKnowledgePoint}
            onResetProgress={handleResetProgress}
            progressPercent={Math.round((completedMarkers.length / currentCourse.markers.length) * 100)}
          />
        }
      />
    </>
  );

  // 自动保存学习进度
  useEffect(() => {
    if (isInitializing) return;

    // 保存当前进度到 localStorage
    saveProgress({
      courseId: currentCourse.id,
      completedMarkers,
      knowledgePoints,
      quizResults: quizResult ? [quizResult] : [],
      lastAccessTime: Date.now(),
      activeView,
      quizCompleted,
      lastQuizResult: quizResult,
    });
  }, [completedMarkers, knowledgePoints, quizResult, activeView, quizCompleted, isInitializing, currentCourse.id, saveProgress]);
}

export default App;
