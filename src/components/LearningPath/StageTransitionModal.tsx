import React from 'react';
import './StageTransitionModal.css';

interface StageTransitionModalProps {
  title: string;
  message: string;
  nextStageName: string;
  onContinue: () => void;
  onSkip: () => void;
  showSkip?: boolean;
}

const StageTransitionModal: React.FC<StageTransitionModalProps> = ({
  title,
  message,
  nextStageName,
  onContinue,
  onSkip,
  showSkip = true,
}) => {
  return (
    <div className="stage-transition-overlay">
      <div className="stage-transition-modal">
        <div className="stage-transition__icon">
          <span className="stage-transition__icon-emoji">🎉</span>
          <div className="stage-transition__icon-ring" />
          <div className="stage-transition__icon-ring stage-transition__icon-ring--2" />
        </div>

        <h2 className="stage-transition__title">{title}</h2>

        <div className="stage-transition__message">
          {message.split('\n').map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </div>

        <div className="stage-transition__actions">
          <button
            className="stage-transition__btn stage-transition__btn--continue"
            onClick={onContinue}
          >
            <span className="btn-icon">🚀</span>
            <span className="btn-text">进入{nextStageName}</span>
          </button>

          {showSkip && (
            <button
              className="stage-transition__btn stage-transition__btn--skip"
              onClick={onSkip}
            >
              <span className="btn-icon">⏭</span>
              <span className="btn-text">暂时跳过</span>
            </button>
          )}
        </div>

        <div className="stage-transition__hint">
          💡 提示：完成所有阶段可以获得更完整的学习效果
        </div>
      </div>
    </div>
  );
};

export default StageTransitionModal;
