import React from 'react';

interface LoadingProps {
  message?: string;
}

const Loading: React.FC<LoadingProps> = ({ message = '正在加载课程...' }) => {
  return (
    <div className="app-loading">
      <div className="app-loading__spinner"></div>
      <div className="app-loading__text">{message}</div>
    </div>
  );
};

export default Loading;
