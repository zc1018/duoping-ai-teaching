import React, { useMemo } from 'react';
import type { Article, Anchor } from '../../types/tutoring';
import './ArticleReader.css';

interface ArticleReaderProps {
    article: Article;
    onAnchorClick: (anchor: Anchor) => void;
    activeAnchorId?: string;
}

const ArticleReader: React.FC<ArticleReaderProps> = ({
    article,
    onAnchorClick,
    activeAnchorId
}) => {
    // Simple rendering logic: 
    // We will split the content by formatting logic or just render raw for now.
    // For a demo, we will check if the content contains specific strings and wrap them.
    // Note: A production version would need a more robust text renderer (e.g. splitting by indices).

    const renderContent = useMemo(() => {
        let lastIndex = 0;
        const elements: React.ReactNode[] = [];

        // Sort anchors by position to ensure correct rendering order
        // (Assuming no overlapping anchors for this demo)
        const sortedAnchors = [...article.anchors].sort((a, b) =>
            article.content.indexOf(a.content) - article.content.indexOf(b.content)
        );

        sortedAnchors.forEach((anchor) => {
            const index = article.content.indexOf(anchor.content, lastIndex);
            if (index === -1) return;

            // Add text before anchor
            if (index > lastIndex) {
                elements.push(<span key={`text-${lastIndex}`}>{article.content.substring(lastIndex, index)}</span>);
            }

            // Add anchor highlight
            elements.push(
                <span
                    key={anchor.id}
                    className={`
            article-archor 
            article-anchor--${anchor.type} 
            ${activeAnchorId === anchor.id ? 'article-anchor--active' : ''}
          `}
                    onClick={() => onAnchorClick(anchor)}
                    title="点击获取 AI 讲解"
                >
                    {anchor.content}
                    {activeAnchorId === anchor.id && <span className="anchor-indicator">👈 正在讲解</span>}
                </span>
            );

            lastIndex = index + anchor.content.length;
        });

        // Add remaining text
        if (lastIndex < article.content.length) {
            elements.push(<span key={`text-${lastIndex}`}>{article.content.substring(lastIndex)}</span>);
        }

        return elements;
    }, [article, activeAnchorId, onAnchorClick]);

    return (
        <div className="article-reader">
            <div className="article-reader__header">
                <div className="article-tag">文章精读</div>
                <h2 className="article-title">{article.title}</h2>
            </div>
            <div className="article-content">
                {renderContent}
            </div>
        </div>
    );
};

export default ArticleReader;
