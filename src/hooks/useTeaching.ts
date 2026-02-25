import { useState, useCallback } from 'react';
import type {
    Question,
    ChatMessage,
    KnowledgePoint,
    TeachingState,
} from '../types';

// 预定义的知识点数据
const KNOWLEDGE_POINTS: Record<string, KnowledgePoint> = {
    encourage_to_do: {
        id: 'kp_001',
        type: 'phrase',
        content: 'encourage sb. to do sth.',
        phonetic: '/ɪnˈkʌrɪdʒ/',
        translation: '鼓励某人做某事',
        exampleInText: 'people are encouraged to take a break from typing...',
        exampleOther: [
            'My teacher encourages me to read more books.',
            'She encouraged him to apply for the job.',
        ],
    },
    on_date: {
        id: 'kp_002',
        type: 'grammar',
        content: '具体日期用介词 on',
        translation: '表示在具体的某一天时，用介词 on',
        exampleInText: 'It falls on September 1st every year.',
        exampleOther: [
            'I was born on March 15th.',
            'The meeting is on Monday.',
        ],
    },
    comparative: {
        id: 'kp_003',
        type: 'grammar',
        content: '形容词比较级 + than',
        translation: '比较两者时用比较级，后接 than',
        exampleInText: 'letters are more valuable than emails',
        exampleOther: [
            'She is taller than her brother.',
            'This book is more interesting than that one.',
        ],
    },
    noun_after_the: {
        id: 'kp_004',
        type: 'grammar',
        content: 'the + 名词',
        translation: '定冠词 the 后面需要接名词',
        exampleInText: 'you can feel the warmth from the sender',
        exampleOther: [
            'the beauty of nature',
            'the importance of education',
        ],
    },
};

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useTeaching = () => {
    const [state, setState] = useState<TeachingState>({
        currentQuestion: null,
        currentStep: 0,
        messages: [],
        knowledgePoints: [],
        isLoading: false,
        highlightedParts: [],
        completedBlanks: [],
    });

    // 初始化问题
    const initQuestion = useCallback((question: Question) => {
        const firstStep = question.teachingFlow[0];
        const initialMessage: ChatMessage = {
            id: generateId(),
            role: 'ai',
            content: firstStep.aiMessage,
            timestamp: new Date(),
        };

        setState({
            currentQuestion: question,
            currentStep: 1,
            messages: [initialMessage],
            knowledgePoints: [],
            isLoading: false,
            highlightedParts: [],
            completedBlanks: [],
        });
    }, []);

    // 处理用户回答
    const handleUserAnswer = useCallback((answer: string) => {
        setState((prev) => {
            if (!prev.currentQuestion) return prev;

            const currentFlow = prev.currentQuestion.teachingFlow[prev.currentStep - 1];
            const nextFlow = prev.currentQuestion.teachingFlow[prev.currentStep];

            // 添加用户消息
            const userMessage: ChatMessage = {
                id: generateId(),
                role: 'user',
                content: answer,
                timestamp: new Date(),
            };

            const newMessages = [...prev.messages, userMessage];
            let newKnowledgePoints = [...prev.knowledgePoints];
            let newCompletedBlanks = [...prev.completedBlanks];

            // 检查是否有下一步
            if (nextFlow) {
                // 模拟 AI 思考延迟
                setTimeout(() => {
                    setState((innerPrev) => {
                        const aiMessage: ChatMessage = {
                            id: generateId(),
                            role: 'ai',
                            content: nextFlow.aiMessage,
                            timestamp: new Date(),
                        };

                        // 检查是否需要添加知识点
                        if (nextFlow.expectedAction === 'add_knowledge') {
                            // 根据当前步骤添加对应的知识点
                            if (nextFlow.targetBlank === 2) {
                                newKnowledgePoints = [
                                    ...innerPrev.knowledgePoints,
                                    KNOWLEDGE_POINTS.encourage_to_do,
                                ];
                            }
                        }

                        // 标记完成的空格
                        if (currentFlow?.targetBlank) {
                            const correctAnswer = innerPrev.currentQuestion?.answers.find(
                                (a) => a.blankId === currentFlow.targetBlank
                            );
                            if (correctAnswer) {
                                newCompletedBlanks = [
                                    ...innerPrev.completedBlanks,
                                    currentFlow.targetBlank,
                                ];
                            }
                        }

                        return {
                            ...innerPrev,
                            messages: [...innerPrev.messages, aiMessage],
                            currentStep: innerPrev.currentStep + 1,
                            isLoading: false,
                            knowledgePoints: newKnowledgePoints,
                            completedBlanks: newCompletedBlanks,
                        };
                    });
                }, 800);

                return {
                    ...prev,
                    messages: newMessages,
                    isLoading: true,
                };
            }

            // 如果没有下一步，说明教学流程结束
            // 添加所有剩余的知识点
            newKnowledgePoints = [
                ...prev.knowledgePoints,
                KNOWLEDGE_POINTS.on_date,
                KNOWLEDGE_POINTS.comparative,
                KNOWLEDGE_POINTS.noun_after_the,
            ];

            return {
                ...prev,
                messages: newMessages,
                knowledgePoints: newKnowledgePoints,
                completedBlanks: [1, 2, 3, 4, 5],
            };
        });
    }, []);

    // 添加知识点
    const addKnowledgePoint = useCallback((point: KnowledgePoint) => {
        setState((prev) => ({
            ...prev,
            knowledgePoints: [...prev.knowledgePoints, point],
        }));
    }, []);

    // 设置高亮文本
    const setHighlightedParts = useCallback((parts: string[]) => {
        setState((prev) => ({
            ...prev,
            highlightedParts: parts,
        }));
    }, []);

    return {
        state,
        initQuestion,
        handleUserAnswer,
        addKnowledgePoint,
        setHighlightedParts,
    };
};

export default useTeaching;
