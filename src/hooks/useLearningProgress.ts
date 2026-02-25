import { useCallback, useRef } from 'react';
import type { KnowledgePoint, QuizResult } from '../types';

/**
 * 学习进度数据接口
 */
export interface LearningProgress {
  /** 课程ID */
  courseId: string;
  /** 已完成的知识点标记ID列表 */
  completedMarkers: string[];
  /** 已收集的知识点列表 */
  knowledgePoints: KnowledgePoint[];
  /** 测验结果 */
  quizResults: QuizResult[];
  /** 最后访问时间戳 */
  lastAccessTime: number;
  /** 当前视图模式 */
  activeView?: 'video' | 'article' | 'question';
  /** 测验是否已完成 */
  quizCompleted?: boolean;
  /** 最新测验结果 */
  lastQuizResult?: QuizResult | null;
}

/**
 * localStorage key前缀
 */
const STORAGE_KEY_PREFIX = 'ai_teaching_progress_';

/**
 * 数据有效期（30天，单位：毫秒）
 */
const DATA_EXPIRY_DAYS = 30;
const DATA_EXPIRY_MS = DATA_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

/**
 * 自定义Hook：管理学习进度的持久化存储
 * @param courseId - 课程ID
 * @returns 加载、保存、重置进度的方法
 */
export const useLearningProgress = (courseId: string) => {
  // 使用ref缓存storage key避免重复计算
  const storageKeyRef = useRef(`${STORAGE_KEY_PREFIX}${courseId}`);

  /**
   * 从localStorage加载学习进度
   * @returns 学习进度数据，如果不存在或已过期则返回null
   */
  const loadProgress = useCallback((): LearningProgress | null => {
    try {
      const storageKey = storageKeyRef.current;
      const savedData = localStorage.getItem(storageKey);

      if (!savedData) {
        console.log(`[useLearningProgress] 没有找到课程 "${courseId}" 的进度数据`);
        return null;
      }

      const progress: LearningProgress = JSON.parse(savedData);

      // 验证数据完整性
      if (!progress.courseId || progress.courseId !== courseId) {
        console.warn(`[useLearningProgress] 课程ID不匹配，清除无效数据`);
        localStorage.removeItem(storageKey);
        return null;
      }

      // 检查数据有效期
      const now = Date.now();
      const lastAccessTime = progress.lastAccessTime || 0;
      const timeDiff = now - lastAccessTime;

      if (timeDiff > DATA_EXPIRY_MS) {
        console.log(
          `[useLearningProgress] 课程 "${courseId}" 的进度数据已过期（${Math.floor(
            timeDiff / (24 * 60 * 60 * 1000)
          )}天），清除数据`
        );
        localStorage.removeItem(storageKey);
        return null;
      }

      console.log(
        `[useLearningProgress] 成功加载课程 "${courseId}" 的进度数据:`,
        {
          completedMarkers: progress.completedMarkers.length,
          knowledgePoints: progress.knowledgePoints.length,
          quizResults: progress.quizResults.length,
          quizCompleted: progress.quizCompleted,
          daysSinceLastAccess: Math.floor(timeDiff / (24 * 60 * 60 * 1000)),
        }
      );

      return progress;
    } catch (error) {
      console.error('[useLearningProgress] 加载进度数据失败:', error);
      // 发生错误时清除可能损坏的数据
      try {
        localStorage.removeItem(storageKeyRef.current);
      } catch {
        // 忽略清除错误
      }
      return null;
    }
  }, [courseId]);

  /**
   * 保存学习进度到localStorage
   * @param progress - 要保存的学习进度数据
   */
  const saveProgress = useCallback(
    (progress: Partial<LearningProgress>): void => {
      try {
        const storageKey = storageKeyRef.current;

        // 先加载现有数据，进行合并
        const existingData = localStorage.getItem(storageKey);
        let existingProgress: Partial<LearningProgress> = {};

        if (existingData) {
          try {
            existingProgress = JSON.parse(existingData);
          } catch {
            // 忽略解析错误，使用空对象
          }
        }

        // 合并数据，新数据覆盖旧数据
        const mergedProgress: LearningProgress = {
          courseId,
          completedMarkers: progress.completedMarkers ?? existingProgress.completedMarkers ?? [],
          knowledgePoints: progress.knowledgePoints ?? existingProgress.knowledgePoints ?? [],
          quizResults: progress.quizResults ?? existingProgress.quizResults ?? [],
          lastAccessTime: Date.now(),
          activeView: progress.activeView ?? existingProgress.activeView ?? 'video',
          quizCompleted: progress.quizCompleted ?? existingProgress.quizCompleted ?? false,
          lastQuizResult: progress.lastQuizResult ?? existingProgress.lastQuizResult ?? null,
        };

        localStorage.setItem(storageKey, JSON.stringify(mergedProgress));

        console.log(
          `[useLearningProgress] 成功保存课程 "${courseId}" 的进度数据:`,
          {
            completedMarkers: mergedProgress.completedMarkers.length,
            knowledgePoints: mergedProgress.knowledgePoints.length,
            quizResults: mergedProgress.quizResults.length,
            quizCompleted: mergedProgress.quizCompleted,
          }
        );
      } catch (error) {
        console.error('[useLearningProgress] 保存进度数据失败:', error);
      }
    },
    [courseId]
  );

  /**
   * 重置学习进度（清除localStorage中的数据）
   */
  const resetProgress = useCallback((): void => {
    try {
      const storageKey = storageKeyRef.current;
      localStorage.removeItem(storageKey);
      console.log(`[useLearningProgress] 已重置课程 "${courseId}" 的学习进度`);
    } catch (error) {
      console.error('[useLearningProgress] 重置进度数据失败:', error);
    }
  }, [courseId]);

  /**
   * 检查是否存在有效的进度数据
   * @returns 是否存在有效数据
   */
  const hasValidProgress = useCallback((): boolean => {
    try {
      const storageKey = storageKeyRef.current;
      const savedData = localStorage.getItem(storageKey);

      if (!savedData) return false;

      const progress: LearningProgress = JSON.parse(savedData);
      const now = Date.now();
      const lastAccessTime = progress.lastAccessTime || 0;

      // 检查数据是否过期
      if (now - lastAccessTime > DATA_EXPIRY_MS) {
        return false;
      }

      // 检查数据完整性
      return progress.courseId === courseId;
    } catch {
      return false;
    }
  }, [courseId]);

  /**
   * 获取数据剩余有效期（天数）
   * @returns 剩余天数，如果没有数据则返回0
   */
  const getRemainingDays = useCallback((): number => {
    try {
      const storageKey = storageKeyRef.current;
      const savedData = localStorage.getItem(storageKey);

      if (!savedData) return 0;

      const progress: LearningProgress = JSON.parse(savedData);
      const now = Date.now();
      const lastAccessTime = progress.lastAccessTime || 0;
      const timeDiff = now - lastAccessTime;
      const remainingMs = DATA_EXPIRY_MS - timeDiff;

      if (remainingMs <= 0) return 0;

      return Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
    } catch {
      return 0;
    }
  }, [courseId]);

  return {
    loadProgress,
    saveProgress,
    resetProgress,
    hasValidProgress,
    getRemainingDays,
  };
};

export default useLearningProgress;
