import React, { useState, useEffect, useCallback } from 'react';
import type { QuizQuestion, QuizResult } from '../../types';

interface QuizAreaProps {
    questions: QuizQuestion[];
    timeLimit?: number; // 分钟
    onComplete: (result: QuizResult) => void;
    onClose: () => void;
    knowledgePointTitles: Map<string, string>;
    onReviewKnowledgePoint?: (kpId: string) => void;
}

export const QuizArea: React.FC<QuizAreaProps> = ({
    questions,
    timeLimit = 10,
    onComplete,
    onClose,
    knowledgePointTitles,
    onReviewKnowledgePoint,
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [answers, setAnswers] = useState<Map<string, { selected: number; correct: boolean }>>(new Map());
    const [startTime] = useState(new Date());
    const [timeRemaining, setTimeRemaining] = useState(timeLimit * 60);
    const [showResult, setShowResult] = useState(false);

    const currentQuestion = questions[currentIndex];

    // 倒计时
    useEffect(() => {
        if (showResult) return;

        const timer = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleFinish();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [showResult]);

    // 计算结果
    const calculateResult = useCallback((): QuizResult => {
        const timeTaken = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
        let correctCount = 0;
        const answerList: QuizResult['answers'] = [];
        const weakPoints: string[] = [];

        questions.forEach((q) => {
            const answer = answers.get(q.id);
            const isCorrect = answer?.correct ?? false;

            if (isCorrect) {
                correctCount++;
            } else {
                weakPoints.push(q.relatedKnowledgePoint);
            }

            answerList.push({
                questionId: q.id,
                selectedIndex: answer?.selected ?? -1,
                isCorrect,
            });
        });

        return {
            score: Math.round((correctCount / questions.length) * 100),
            total: questions.length,
            correctCount,
            timeTaken,
            answers: answerList,
            weakPoints: [...new Set(weakPoints)],
        };
    }, [answers, questions, startTime]);

    const handleFinish = useCallback(() => {
        const result = calculateResult();
        setShowResult(true);
        onComplete(result);
    }, [calculateResult, onComplete]);

    const handleSelectAnswer = (index: number) => {
        if (isAnswered) return;
        setSelectedAnswer(index);
    };

    const handleConfirm = () => {
        if (selectedAnswer === null) return;

        const isCorrect = selectedAnswer === currentQuestion.correctIndex;
        setIsAnswered(true);
        setAnswers((prev) => {
            const newMap = new Map(prev);
            newMap.set(currentQuestion.id, { selected: selectedAnswer, correct: isCorrect });
            return newMap;
        });
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setSelectedAnswer(null);
            setIsAnswered(false);
        } else {
            handleFinish();
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getOptionClass = (index: number) => {
        let className = 'quiz-option';

        if (isAnswered) {
            if (index === currentQuestion.correctIndex) {
                className += ' quiz-option--correct';
            } else if (index === selectedAnswer) {
                className += ' quiz-option--wrong';
            }
        } else if (index === selectedAnswer) {
            className += ' quiz-option--selected';
        }

        return className;
    };

    if (showResult) {
        const result = calculateResult();
        return (
            <div className="quiz-result">
                <div className="quiz-result__header">
                    <div className="quiz-result__emoji">
                        {result.score >= 80 ? '🏆' : result.score >= 60 ? '👍' : '💪'}
                    </div>
                    <h2 className="quiz-result__title">测验完成!</h2>
                </div>

                <div className="quiz-result__score">
                    <div className="quiz-result__score-circle" style={{ '--score': result.score } as React.CSSProperties}>
                        <span className="quiz-result__score-value">{result.score}</span>
                        <span className="quiz-result__score-label">分</span>
                    </div>
                </div>

                <div className="quiz-result__stats">
                    <div className="quiz-result__stat">
                        <span className="quiz-result__stat-icon">✅</span>
                        <span>正确 {result.correctCount}/{result.total} 题</span>
                    </div>
                    <div className="quiz-result__stat">
                        <span className="quiz-result__stat-icon">⏱️</span>
                        <span>用时 {formatTime(result.timeTaken)}</span>
                    </div>
                </div>

                {result.weakPoints.length > 0 && (
                    <div className="quiz-result__weak">
                        <h3>📚 建议复习以下知识点：</h3>
                        <ul>
                            {result.weakPoints.map((kpId) => (
                                <li key={kpId} className="quiz-result__weak-item">
                                    <span>{knowledgePointTitles.get(kpId) || kpId}</span>
                                    {onReviewKnowledgePoint && (
                                        <button
                                            className="quiz-result__review-btn"
                                            onClick={() => onReviewKnowledgePoint(kpId)}
                                        >
                                            回顾
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="quiz-result__actions">
                    <button className="quiz-btn quiz-btn--primary" onClick={onClose}>
                        返回学习
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="quiz-area">
            <div className="quiz-header">
                <div className="quiz-progress">
                    <span className="quiz-progress__current">{currentIndex + 1}</span>
                    <span className="quiz-progress__divider">/</span>
                    <span className="quiz-progress__total">{questions.length}</span>
                </div>
                <div className="quiz-timer" data-warning={timeRemaining < 60}>
                    ⏱️ {formatTime(timeRemaining)}
                </div>
            </div>

            <div className="quiz-progress-bar">
                <div
                    className="quiz-progress-bar__fill"
                    style={{ width: `${((currentIndex + (isAnswered ? 1 : 0)) / questions.length) * 100}%` }}
                />
            </div>

            <div className="quiz-question">
                <h3 className="quiz-question__text">{currentQuestion.question}</h3>
            </div>

            <div className="quiz-options">
                {currentQuestion.options.map((option, index) => (
                    <button
                        key={index}
                        className={getOptionClass(index)}
                        onClick={() => handleSelectAnswer(index)}
                        disabled={isAnswered}
                    >
                        <span className="quiz-option__letter">
                            {String.fromCharCode(65 + index)}
                        </span>
                        <span className="quiz-option__text">{option}</span>
                        {isAnswered && index === currentQuestion.correctIndex && (
                            <span className="quiz-option__icon">✓</span>
                        )}
                        {isAnswered && index === selectedAnswer && index !== currentQuestion.correctIndex && (
                            <span className="quiz-option__icon">✗</span>
                        )}
                    </button>
                ))}
            </div>

            {isAnswered && (
                <div className="quiz-explanation">
                    <div className="quiz-explanation__icon">
                        {selectedAnswer === currentQuestion.correctIndex ? '✅' : '💡'}
                    </div>
                    <div className="quiz-explanation__text">
                        {currentQuestion.explanation}
                    </div>
                </div>
            )}

            <div className="quiz-actions">
                {!isAnswered ? (
                    <button
                        className="quiz-btn quiz-btn--primary"
                        onClick={handleConfirm}
                        disabled={selectedAnswer === null}
                    >
                        确认答案
                    </button>
                ) : (
                    <button className="quiz-btn quiz-btn--primary" onClick={handleNext}>
                        {currentIndex < questions.length - 1 ? '下一题 →' : '查看结果'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default QuizArea;
