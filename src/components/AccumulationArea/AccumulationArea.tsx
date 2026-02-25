import React, { useState } from 'react';
import type { KnowledgePoint } from '../../types';

interface AccumulationAreaProps {
    knowledgePoints: KnowledgePoint[];
    onReview?: (kp: KnowledgePoint) => void;
    onResetProgress?: () => void;
    progressPercent?: number;
}

export const AccumulationArea: React.FC<AccumulationAreaProps> = ({
    knowledgePoints,
    onReview,
    onResetProgress,
    progressPercent = 0,
}) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    // 使用 Web Speech API 播放发音
    const playPronunciation = (text: string) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 0.8;
            window.speechSynthesis.speak(utterance);
        }
    };

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            important: '核心考点',
            grammar: '原理',
            vocabulary: '概念',
            reading: '阅读',
            phrase: '短语',
            word: '单词',
        };
        return labels[type] || type;
    };

    const handleExport = () => {
        // 生成复习资料文本
        const content = knowledgePoints
            .map(
                (kp, index) =>
                    `${index + 1}. ${kp.content}\n   发音: ${kp.phonetic || '-'}\n   翻译: ${kp.translation}\n   例句: ${kp.exampleInText}\n`
            )
            .join('\n');

        // 创建并下载文件
        const blob = new Blob([`知识点复习资料\n\n${content}`], {
            type: 'text/plain;charset=utf-8',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '知识点复习资料.txt';
        a.click();
        URL.revokeObjectURL(url);
    };

    if (knowledgePoints.length === 0) {
        return (
            <div className="accumulation-area__empty">
                <div className="accumulation-area__empty-icon">📝</div>
                <p>学习过程中积累的知识点会显示在这里</p>
            </div>
        );
    }

    return (
        <>
            <div className="accumulation-area__cards">
                {knowledgePoints.map((kp) => (
                    <div
                        key={kp.id}
                        className={`knowledge-card ${expandedId === kp.id ? 'knowledge-card--expanded' : ''}`}
                        onClick={() => toggleExpand(kp.id)}
                    >
                        <div className="knowledge-card__header">
                            <span className="knowledge-card__phrase">{kp.content}</span>
                            <span className="knowledge-card__type">
                                {getTypeLabel(kp.type)}
                            </span>
                        </div>

                        {kp.phonetic && (
                            <div className="knowledge-card__phonetic">
                                <span>{kp.phonetic}</span>
                                <button
                                    className="sound-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        playPronunciation(kp.content);
                                    }}
                                    title="播放发音"
                                >
                                    🔊
                                </button>
                            </div>
                        )}

                        <div className="knowledge-card__translation">{kp.translation}</div>

                        {expandedId === kp.id && (
                            <div className="knowledge-card__details">
                                <div className="knowledge-card__example">
                                    <span className="knowledge-card__example-label">
                                        文中例句：
                                    </span>
                                    <div className="knowledge-card__example-text">
                                        {kp.exampleInText}
                                    </div>
                                </div>

                                {kp.exampleOther && kp.exampleOther.length > 0 && (
                                    <div className="knowledge-card__example">
                                        <span className="knowledge-card__example-label">
                                            其他例句：
                                        </span>
                                        {kp.exampleOther.map((ex, i) => (
                                            <div key={i} className="knowledge-card__example-text">
                                                {ex}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {onReview && (
                                    <button
                                        className="review-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onReview(kp);
                                        }}
                                    >
                                        🔄 AI 复习
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="accumulation-area__footer">
                <button className="export-btn" onClick={handleExport}>
                    📄 导出复习资料
                </button>
                {onResetProgress && (
                    <button
                        className="reset-progress-btn"
                        onClick={onResetProgress}
                        title="重置当前课程的学习进度"
                    >
                        🔄 重置进度
                    </button>
                )}
            </div>
            {progressPercent > 0 && (
                <div className="accumulation-area__progress-info">
                    <span>学习进度: {progressPercent}%</span>
                    <span>已收集 {knowledgePoints.length} 个知识点</span>
                </div>
            )}
        </>
    );
};

export default AccumulationArea;
