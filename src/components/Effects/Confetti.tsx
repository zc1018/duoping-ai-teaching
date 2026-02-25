import { useEffect, useState } from 'react';

interface ConfettiProps {
    trigger: boolean;
    duration?: number;
    particleCount?: number;
    type?: 'light' | 'full';
    onComplete?: () => void;
}

interface Particle {
    id: number;
    x: number;
    y: number;
    color: string;
    size: number;
    rotation: number;
    delay: number;
    shape: 'circle' | 'square' | 'star';
}

const COLORS = [
    '#FF6B9D', // memphis-pink
    '#FFC93C', // memphis-yellow
    '#00D9FF', // memphis-cyan
    '#FF8C42', // memphis-orange
    '#9B59B6', // memphis-purple
    '#00E676', // memphis-green
    '#3D5AFE', // memphis-blue
];

const SHAPES: Particle['shape'][] = ['circle', 'square', 'star'];

export const Confetti: React.FC<ConfettiProps> = ({
    trigger,
    duration = 2500,
    particleCount = 50,
    type = 'light',
    onComplete,
}) => {
    const [particles, setParticles] = useState<Particle[]>([]);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        if (trigger && !isActive) {
            const count = type === 'full' ? particleCount * 2 : particleCount;
            const newParticles: Particle[] = [];

            for (let i = 0; i < count; i++) {
                newParticles.push({
                    id: i,
                    x: Math.random() * 100,
                    y: -10 - Math.random() * 20,
                    color: COLORS[Math.floor(Math.random() * COLORS.length)],
                    size: 8 + Math.random() * 12,
                    rotation: Math.random() * 360,
                    delay: Math.random() * 0.5,
                    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
                });
            }

            setParticles(newParticles);
            setIsActive(true);

            const timer = setTimeout(() => {
                setIsActive(false);
                setParticles([]);
                onComplete?.();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [trigger, duration, particleCount, type, onComplete, isActive]);

    if (!isActive || particles.length === 0) return null;

    return (
        <div className="confetti-container">
            {particles.map((particle) => (
                <div
                    key={particle.id}
                    className={`confetti-particle confetti-particle--${particle.shape}`}
                    style={{
                        '--x': `${particle.x}%`,
                        '--y': `${particle.y}%`,
                        '--color': particle.color,
                        '--size': `${particle.size}px`,
                        '--rotation': `${particle.rotation}deg`,
                        '--delay': `${particle.delay}s`,
                    } as React.CSSProperties}
                />
            ))}
        </div>
    );
};

export default Confetti;
