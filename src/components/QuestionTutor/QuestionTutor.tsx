import React, { useState } from 'react';
import type { QuestionMaterial } from '../../types/question';
import type { Anchor } from '../../types/tutoring';
import './QuestionTutor.css';

interface QuestionTutorProps {
    question: QuestionMaterial; // For Single Mode
    paper: QuestionMaterial[];  // For Paper Mode
    onAnchorClick: (anchor: Anchor, context?: { stem: string; reference?: string }) => void;
    activeAnchorId?: string;
}

const QuestionTutor: React.FC<QuestionTutorProps> = ({
    question,
    paper,
    onAnchorClick,
    activeAnchorId
}) => {
    const [subMode, setSubMode] = useState<'single' | 'paper'>('single');
    // Track selected options for multiple choice (simple toggle for demo)
    const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());
    // Track visual state for analysis answer
    const [showAnalysis, setShowAnalysis] = useState(false);

    // Helper to find anchor (reused)
    const getAnchor = (q: QuestionMaterial, text: string) => {
        return q.anchors.find(a => text.includes(a.content) || a.content.includes(text));
    };

    const renderAnchorableText = (q: QuestionMaterial, text: string, className = '') => {
        const anchor = getAnchor(q, text);
        const isActive = anchor && activeAnchorId === anchor.id;

        // In Analysis mode, or if anchor exists, we always render it as interactive
        if (anchor) {
            return (
                <span
                    key={anchor.id}
                    className={`
            question-anchor 
            question-anchor--${anchor.type} 
            ${isActive ? 'question-anchor--active' : ''}
            ${className}
          `}
                    onClick={(e) => {
                        e.stopPropagation();
                        onAnchorClick(anchor, {
                            stem: q.stem,
                            reference: q.referenceAnswer
                        });
                    }}
                    title="✨ 点击获取 AI 深度解析"
                >
                    {text}
                    {isActive && <span className="q-anchor-indicator">👈 正在讲解</span>}
                    {/* Visual cue for Analysis questions */}
                    {q.type === 'analysis' && <span className="q-anchor-hint">✨ 解析</span>}
                </span>
            );
        }
        return <span className={className}>{text}</span>;
    };

    const renderStem = (q: QuestionMaterial) => {
        const anchor = q.anchors.find(a => q.stem.includes(a.content));
        if (anchor) {
            const parts = q.stem.split(anchor.content);
            return (
                <>
                    {parts[0]}
                    {renderAnchorableText(q, anchor.content)}
                    {parts[1]}
                </>
            );
        }
        return q.stem;
    };

    const renderQuestionCard = (q: QuestionMaterial, index?: number) => {
        const isAnalysis = q.type === 'analysis';

        return (
            <div className="question-card" key={q.id}>
                {index !== undefined && <div className="q-index">第 {index + 1} 题</div>}

                <div className="q-type-badge">
                    {q.type === 'single' && '单选题'}
                    {q.type === 'multiple' && '多选题'}
                    {q.type === 'analysis' && '材料分析题'}
                </div>

                <div className="q-stem">
                    {renderStem(q)}
                    {/* Hint for Analysis */}
                    {isAnalysis && (
                        <div className="q-stem-hint">
                            💡 提示：点击题干中带下划线的重点词句，获取深度解析
                        </div>
                    )}
                </div>

                {/* Options Area */}
                {!isAnalysis && q.options && (
                    <div className="q-options">
                        {q.options.map((opt) => {
                            const anchor = getAnchor(q, opt.content);
                            const isActive = anchor && activeAnchorId === anchor.id;
                            const isSelected = selectedOptions.has(opt.id);

                            return (
                                <div
                                    key={opt.id}
                                    className={`q-option ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''}`}
                                    onClick={() => {
                                        // Click whole row -> Select (Toggle)
                                        const next = new Set(selectedOptions);
                                        if (next.has(opt.id)) next.delete(opt.id);
                                        else next.add(opt.id);
                                        setSelectedOptions(next);
                                    }}
                                >
                                    <span className="q-option-label">{opt.label}.</span>
                                    <div className="q-option-content">
                                        {opt.content}
                                    </div>

                                    {/* Explicit AI Trigger Button */}
                                    {anchor ? (
                                        <button
                                            className="q-ai-btn"
                                            onClick={(e) => {
                                                e.stopPropagation(); // Context Passing Logic
                                                onAnchorClick(anchor, {
                                                    stem: q.stem,
                                                    reference: q.referenceAnswer
                                                });
                                            }}
                                            title="点击获取 AI 讲解"
                                        >
                                            🤖 AI 讲解
                                        </button>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Analysis Area */}
                {isAnalysis && (
                    <div className="q-analysis-area">
                        <button
                            className="q-analysis-btn"
                            onClick={() => setShowAnalysis(!showAnalysis)}
                        >
                            {showAnalysis ? '收起参考答案' : '查看参考答案'}
                        </button>
                        {showAnalysis && (
                            <div className="q-reference-answer">
                                <h4>参考答案：</h4>
                                <div style={{ whiteSpace: 'pre-line' }}>
                                    {q.referenceAnswer}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="question-tutor">
            <div className="question-tutor__header">
                <div className="q-mode-switch">
                    <button
                        className={`q-mode-btn ${subMode === 'single' ? 'active' : ''}`}
                        onClick={() => setSubMode('single')}
                    >
                        单题精讲
                    </button>
                    <button
                        className={`q-mode-btn ${subMode === 'paper' ? 'active' : ''}`}
                        onClick={() => setSubMode('paper')}
                    >
                        试卷精讲
                    </button>
                </div>
                <h2 className="q-title">
                    {subMode === 'single' ? question.title : "2025考研政治冲刺模拟卷"}
                </h2>
            </div>

            <div className="question-content-area">
                {subMode === 'single' ? (
                    renderQuestionCard(question)
                ) : (
                    <div className="paper-view">
                        <div className="paper-list">
                            {paper.map((q, i) => (
                                <div key={q.id} className="paper-item">
                                    {renderQuestionCard(q, i)}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="q-footer-hint">
                👇 点击 <span className="q-hint-badge">🤖 AI 讲解</span> 听名师辨析，点击题干重点词获取名师点拨
            </div>
        </div>
    );
};

export default QuestionTutor;
