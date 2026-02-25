import React from 'react';

interface TextAreaProps {
    content: string;
    activeBlank: number | null;
    completedBlanks: { [key: number]: string };
    highlightedText?: string[];
}

export const TextArea: React.FC<TextAreaProps> = ({
    content,
    activeBlank,
    completedBlanks,
    highlightedText = [],
}) => {
    // 解析内容，将 (n)____ 或 (n)____(word) 转换为可交互的空格
    const parseContent = (text: string) => {
        // 匹配 (数字)____ 或 (数字)____(单词) 的模式
        const blankPattern = /\((\d+)\)____(?:\(([^)]+)\))?/g;
        const parts: React.ReactNode[] = [];
        let lastIndex = 0;
        let match;

        while ((match = blankPattern.exec(text)) !== null) {
            // 添加空格前的文本
            if (match.index > lastIndex) {
                const beforeText = text.slice(lastIndex, match.index);
                parts.push(
                    <span key={`text-${lastIndex}`}>
                        {highlightText(beforeText, highlightedText)}
                    </span>
                );
            }

            const blankId = parseInt(match[1], 10);
            const hint = match[2] || '';
            const isCompleted = blankId in completedBlanks;
            const isActive = activeBlank === blankId;

            parts.push(
                <span
                    key={`blank-${blankId}`}
                    className={`blank ${isActive ? 'blank--active' : ''} ${isCompleted ? 'blank--completed' : ''
                        }`}
                >
                    {isCompleted ? (
                        completedBlanks[blankId]
                    ) : (
                        <>({blankId}){hint && <small> {hint}</small>}</>
                    )}
                </span>
            );

            lastIndex = match.index + match[0].length;
        }

        // 添加剩余文本
        if (lastIndex < text.length) {
            const remainingText = text.slice(lastIndex);
            parts.push(
                <span key={`text-${lastIndex}`}>
                    {highlightText(remainingText, highlightedText)}
                </span>
            );
        }

        return parts;
    };

    // 高亮指定文本
    const highlightText = (text: string, highlights: string[]) => {
        if (!highlights.length) return text;

        let result: React.ReactNode[] = [text];

        highlights.forEach((highlight) => {
            const newResult: React.ReactNode[] = [];
            result.forEach((part, partIndex) => {
                if (typeof part !== 'string') {
                    newResult.push(part);
                    return;
                }

                const regex = new RegExp(`(${escapeRegex(highlight)})`, 'gi');
                const parts = part.split(regex);
                parts.forEach((p, i) => {
                    if (p.toLowerCase() === highlight.toLowerCase()) {
                        newResult.push(
                            <span key={`hl-${partIndex}-${i}`} className="highlight">
                                {p}
                            </span>
                        );
                    } else if (p) {
                        newResult.push(p);
                    }
                });
            });
            result = newResult;
        });

        return result;
    };

    const escapeRegex = (str: string) => {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    // 按段落分割内容
    const paragraphs = content.split('\n\n').filter((p) => p.trim());

    return (
        <div className="text-area__content">
            {paragraphs.map((paragraph, index) => (
                <p key={index} className="text-area__paragraph">
                    {parseContent(paragraph)}
                </p>
            ))}
        </div>
    );
};

export default TextArea;
