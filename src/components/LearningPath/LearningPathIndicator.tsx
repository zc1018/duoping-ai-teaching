import React from 'react';
import './LearningPathIndicator.css';

interface LearningPathIndicatorProps {
  currentStage: 'video' | 'article' | 'question' | 'completed';
  completedStages: ('video' | 'article' | 'question' | 'completed')[];
  stageProgress: {
    video: number;
    article: number;
    question: number;
  };
  onStageClick?: (stage: 'video' | 'article' | 'question') => void;
}

const stageConfig = {
  video: {
    icon: '🎬',
    label: '视频',
    description: '视频学习',
  },
  article: {
    icon: '📄',
    label: '文章',
    description: '文章精读',
  },
  question: {
    icon: '✍️',
    label: '题目',
    description: '题目精讲',
  },
};

const LearningPathIndicator: React.FC<LearningPathIndicatorProps> = ({
  currentStage,
  completedStages,
  stageProgress,
  onStageClick,
}) => {
  const stages: ('video' | 'article' | 'question')[] = ['video', 'article', 'question'];

  const getStageStatus = (stage: 'video' | 'article' | 'question') => {
    if (completedStages.includes(stage)) {
      return 'completed';
    }
    if (currentStage === stage) {
      return 'active';
    }
    return 'pending';
  };

  const getStageProgress = (stage: 'video' | 'article' | 'question') => {
    return stageProgress[stage] || 0;
  };

  return (
    <div className="learning-path-indicator">
      <div className="learning-path__title">学习路径</div>
      <div className="learning-path__stages">
        {stages.map((stage, index) => {
          const status = getStageStatus(stage);
          const progress = getStageProgress(stage);
          const config = stageConfig[stage];

          return (
            <React.Fragment key={stage}>
              <div
                className={`learning-path__stage learning-path__stage--${status}`}
                onClick={() => onStageClick?.(stage)}
                style={{ cursor: onStageClick ? 'pointer' : 'default' }}
              >
                <div className="learning-path__stage-icon">
                  <span>{config.icon}</span>
                  {status === 'completed' && (
                    <span className="learning-path__check-mark">✓</span>
                  )}
                </div>
                <div className="learning-path__stage-info">
                  <span className="learning-path__stage-label">{config.label}</span>
                  {status === 'active' && progress > 0 && (
                    <span className="learning-path__stage-progress">{Math.round(progress)}%</span>
                  )}
                </div>
                {status === 'active' && (
                  <div className="learning-path__active-badge">进行中</div>
                )}
              </div>
              {index < stages.length - 1 && (
                <div
                  className={`learning-path__connector ${
                    completedStages.includes(stage) ? 'learning-path__connector--completed' : ''
                  }`}
                >
                  <div className="learning-path__connector-line" />
                  <div className="learning-path__connector-arrow">→</div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default LearningPathIndicator;
