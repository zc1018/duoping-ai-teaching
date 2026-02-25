import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
    // 刷新页面
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary__icon">😵</div>
          <h1 className="error-boundary__title">哎呀，出错了！</h1>
          <p className="error-boundary__message">
            应用遇到了一个意外错误。别担心，你的学习进度已保存。
            <br />
            点击下方按钮重新加载页面。
          </p>
          {this.state.error && (
            <details style={{ marginBottom: '24px', textAlign: 'left' }}>
              <summary style={{ cursor: 'pointer', color: '#9E9EB0' }}>
                查看错误详情
              </summary>
              <pre
                style={{
                  marginTop: '12px',
                  padding: '12px',
                  background: '#f5f5f5',
                  borderRadius: '8px',
                  fontSize: '12px',
                  overflow: 'auto',
                  maxWidth: '600px',
                }}
              >
                {this.state.error.toString()}
              </pre>
            </details>
          )}
          <button className="error-boundary__button" onClick={this.handleReset}>
            🔄 重新加载
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
