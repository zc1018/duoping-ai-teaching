import { useEffect, useState } from 'react';

interface ProgressMilestoneProps {
    progress: number; // 0-100
    total: number;
    current: number;
}

interface MilestoneConfig {
    threshold: number;
    emoji: string;
    message: string;
    color: string;
}

const MILESTONES: MilestoneConfig[] = [
    { threshold: 25, emoji: '🌟', message: '开门红！继续加油！', color: '#FFC93C' },
    { threshold: 50, emoji: '🔥', message: '已完成一半！势如破竹！', color: '#FF8C42' },
    { threshold: 75, emoji: '🚀', message: '冲刺阶段！胜利在望！', color: '#9B59B6' },
    { threshold: 100, emoji: '🏆', message: '太棒了！全部掌握！', color: '#00E676' },
];

export const ProgressMilestone: React.FC<ProgressMilestoneProps> = ({
    progress,
    total,
    current,
}) => {
    const [showMilestone, setShowMilestone] = useState(false);
    const [currentMilestone, setCurrentMilestone] = useState<MilestoneConfig | null>(null);
    const [reachedMilestones, setReachedMilestones] = useState<number[]>([]);

    useEffect(() => {
        // 计算当前进度百分比
        const percentage = total > 0 ? (current / total) * 100 : 0;

        // 找到刚达到的里程碑
        for (const milestone of MILESTONES) {
            if (
                percentage >= milestone.threshold &&
                !reachedMilestones.includes(milestone.threshold)
            ) {
                setCurrentMilestone(milestone);
                setShowMilestone(true);
                setReachedMilestones((prev) => [...prev, milestone.threshold]);

                // 3秒后自动隐藏
                const timer = setTimeout(() => {
                    setShowMilestone(false);
                }, 3000);

                return () => clearTimeout(timer);
            }
        }
    }, [progress, current, total, reachedMilestones]);

    if (!showMilestone || !currentMilestone) return null;

    return (
        <div className="milestone-overlay" onClick={() => setShowMilestone(false)}>
            <div
                className="milestone-card"
                style={{ '--milestone-color': currentMilestone.color } as React.CSSProperties}
            >
                <div className="milestone-emoji">{currentMilestone.emoji}</div>
                <div className="milestone-progress">{currentMilestone.threshold}%</div>
                <div className="milestone-message">{currentMilestone.message}</div>
                <div className="milestone-stats">
                    已完成 {current}/{total} 个知识点
                </div>
                <button className="milestone-btn" onClick={() => setShowMilestone(false)}>
                    继续学习 →
                </button>
            </div>
        </div>
    );
};

export default ProgressMilestone;
