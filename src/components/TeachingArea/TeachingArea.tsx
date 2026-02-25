import React, { useRef, useEffect } from 'react';
import type { ChatMessage } from '../../types';

interface TeachingAreaProps {
    messages: ChatMessage[];
    isLoading: boolean;
    onSendMessage: (message: string) => void;
}

export const TeachingArea: React.FC<TeachingAreaProps> = ({
    messages,
    isLoading,
    onSendMessage,
}) => {
    const [inputValue, setInputValue] = React.useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 自动滚动到最新消息
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim() && !isLoading) {
            onSendMessage(inputValue.trim());
            setInputValue('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <>
            <div className="column__content">
                <div className="teaching-area__messages">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`chat-bubble chat-bubble--${message.role}`}
                        >
                            <div className="chat-bubble__content">
                                {message.content}
                                {message.suggestedFollowUps && message.suggestedFollowUps.length > 0 && (
                                    <div className="chat-bubble__follow-ups">
                                        {message.suggestedFollowUps.map((question, index) => (
                                            <button
                                                key={index}
                                                className="follow-up-chip"
                                                onClick={() => onSendMessage(question)}
                                            >
                                                {question}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="chat-bubble__time">
                                {formatTime(message.timestamp)}
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="typing-indicator">
                            <span className="typing-dot"></span>
                            <span className="typing-dot"></span>
                            <span className="typing-dot"></span>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            <form className="teaching-area__input" onSubmit={handleSubmit}>
                <div className="input-wrapper">
                    <input
                        type="text"
                        className="input-box"
                        placeholder="输入你的答案..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        className="submit-btn"
                        disabled={!inputValue.trim() || isLoading}
                    >
                        发送
                    </button>
                </div>
            </form>
        </>
    );
};

export default TeachingArea;
