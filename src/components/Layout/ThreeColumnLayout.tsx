import React from 'react';

interface ThreeColumnLayoutProps {
    textArea: React.ReactNode;
    teachingArea: React.ReactNode;
    accumulationArea: React.ReactNode;
    progress: { current: number; total: number };
    knowledgeCount: number;
    headerRight?: React.ReactNode;
}

export const ThreeColumnLayout: React.FC<ThreeColumnLayoutProps> = ({
    textArea,
    teachingArea,
    accumulationArea,
    progress,
    knowledgeCount,
    headerRight,
}) => {
    return (
        <div className="app-container">
            {/* 顶部导航栏 */}
            <header className="app-header">
                <div className="app-header__left">
                    <span className="app-header__logo">🏠</span>
                    <h1 className="app-header__title">Ai 慧学学习系统</h1>
                    {headerRight}
                </div>
                <div className="app-header__right">
                    <div className="stat-item">
                        <span className="stat-item__icon">📝</span>
                        <span>进度:</span>
                        <span className="stat-item__value">
                            第 {progress.current} 题 / {progress.total} 题
                        </span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-item__icon">📚</span>
                        <span>积累:</span>
                        <span className="stat-item__value">{knowledgeCount} 个</span>
                    </div>
                </div>
            </header>

            {/* 三分屏布局 */}
            <main className="three-column-layout">
                {/* 文本区 */}
                <div className="column column--text">
                    <div className="column__header">
                        <span className="column__header-icon">📖</span>
                        <span className="column__header-title">题目文本</span>
                    </div>
                    <div className="column__content">{textArea}</div>
                </div>

                {/* 教学区 */}
                <div className="column column--teaching">
                    <div className="column__header">
                        <span className="column__header-icon">💬</span>
                        <span className="column__header-title">AI 教学助手</span>
                    </div>
                    {teachingArea}
                </div>

                {/* 积累区 */}
                <div className="column column--accumulation">
                    <div className="column__header">
                        <span className="column__header-icon">📚</span>
                        <span className="column__header-title">知识积累</span>
                    </div>
                    <div className="column__content">{accumulationArea}</div>
                </div>
            </main>
        </div>
    );
};

export default ThreeColumnLayout;
