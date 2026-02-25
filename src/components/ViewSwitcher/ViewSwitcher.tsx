import React from 'react';
import './ViewSwitcher.css';

interface ViewSwitcherProps {
    activeView: 'video' | 'article' | 'question';
    onViewChange: (view: 'video' | 'article' | 'question') => void;
}

const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ activeView, onViewChange }) => {
    return (
        <div className="view-switcher">
            <button
                className={`view-switcher__btn ${activeView === 'video' ? 'active' : ''}`}
                onClick={() => onViewChange('video')}
                type="button"
            >
                <span className="icon">🎬</span> 视频课程
            </button>
            <button
                className={`view-switcher__btn ${activeView === 'article' ? 'active' : ''}`}
                onClick={() => onViewChange('article')}
                type="button"
            >
                <span className="icon">📄</span> 文章精读
            </button>
            <button
                className={`view-switcher__btn ${activeView === 'question' ? 'active' : ''}`}
                onClick={() => onViewChange('question')}
                type="button"
            >
                <span className="icon">✍️</span> 题目精讲
            </button>
        </div>
    );
};

export default ViewSwitcher;
