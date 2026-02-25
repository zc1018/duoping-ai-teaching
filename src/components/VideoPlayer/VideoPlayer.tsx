import React, { useRef, useState, useEffect, useCallback } from 'react';

export interface KnowledgeMarker {
    id: string;
    time: number; // 秒
    title: string;
    type: 'grammar' | 'vocabulary' | 'reading' | 'important';
    description?: string;
    isCompleted?: boolean;
}

interface VideoPlayerProps {
    videoUrl: string;
    title: string;
    markers: KnowledgeMarker[];
    expectedDuration?: number; // 预期视频时长（秒），用于视频未加载前显示标记
    currentTime?: number;
    isPlaying?: boolean;
    onTimeUpdate?: (time: number) => void;
    onMarkerReached?: (marker: KnowledgeMarker) => void;
    onPlay?: () => void;
    onPause?: () => void;
    // AI 控制接口
    aiControlRef?: React.MutableRefObject<{
        play: () => void;
        pause: () => void;
        seekTo: (time: number) => void;
        skipToMarker: (markerId: string) => void;
    } | null>;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
    videoUrl,
    title,
    markers,
    expectedDuration,
    currentTime: externalTime,
    isPlaying: externalPlaying,
    onTimeUpdate,
    onMarkerReached,
    onPlay,
    onPause,
    aiControlRef,
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(expectedDuration || 0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeMarker, setActiveMarker] = useState<string | null>(null);
    const [volume, setVolume] = useState(0.8);
    const [showMarkerTooltip, setShowMarkerTooltip] = useState<string | null>(null);
    const lastTriggeredMarker = useRef<string | null>(null);

    // 用于渲染的有效时长（如果视频未加载，使用预期时长）
    const effectiveDuration = duration || expectedDuration || 300; // 默认 5 分钟

    // 格式化时间
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // 获取 marker 类型对应的颜色
    const getMarkerColor = (type: KnowledgeMarker['type']) => {
        const colors = {
            grammar: '#22c55e',
            vocabulary: '#6366f1',
            reading: '#f59e0b',
            important: '#ef4444',
        };
        return colors[type];
    };

    // 控制方法
    const play = useCallback(() => {
        videoRef.current?.play();
        setIsPlaying(true);
        onPlay?.();
    }, [onPlay]);

    const pause = useCallback(() => {
        videoRef.current?.pause();
        setIsPlaying(false);
        onPause?.();
    }, [onPause]);

    const seekTo = useCallback((time: number) => {
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    }, []);

    const skipToMarker = useCallback((markerId: string) => {
        const marker = markers.find(m => m.id === markerId);
        if (marker && videoRef.current) {
            videoRef.current.currentTime = marker.time;
            setCurrentTime(marker.time);
        }
    }, [markers]);

    // 暴露控制接口给 AI
    useEffect(() => {
        if (aiControlRef) {
            aiControlRef.current = { play, pause, seekTo, skipToMarker };
        }
    }, [aiControlRef, play, pause, seekTo, skipToMarker]);

    // 响应外部控制
    useEffect(() => {
        if (externalTime !== undefined && videoRef.current) {
            videoRef.current.currentTime = externalTime;
        }
    }, [externalTime]);

    useEffect(() => {
        if (externalPlaying !== undefined) {
            if (externalPlaying) {
                play();
            } else {
                pause();
            }
        }
    }, [externalPlaying, play, pause]);

    // 时间更新处理
    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const time = videoRef.current.currentTime;
            setCurrentTime(time);
            onTimeUpdate?.(time);

            // 检查是否到达知识点
            for (const marker of markers) {
                if (
                    Math.abs(time - marker.time) < 0.5 &&
                    lastTriggeredMarker.current !== marker.id
                ) {
                    lastTriggeredMarker.current = marker.id;
                    setActiveMarker(marker.id);
                    onMarkerReached?.(marker);
                    break;
                }
            }
        }
    };

    // 进度条点击
    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (progressRef.current && videoRef.current) {
            const rect = progressRef.current.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            const newTime = pos * effectiveDuration;
            videoRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };

    // 知识点标记点击
    const handleMarkerClick = (marker: KnowledgeMarker, e: React.MouseEvent) => {
        e.stopPropagation();
        seekTo(marker.time);
        setActiveMarker(marker.id);
    };

    return (
        <div className="video-player">
            {/* 视频标题 */}
            <div className="video-player__header">
                <span className="video-player__badge">📹 录播课</span>
                <span className="video-player__title">{title}</span>
            </div>

            {/* 视频容器 */}
            <div className="video-player__container">
                <video
                    ref={videoRef}
                    src={videoUrl}
                    className="video-player__video"
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={() => {
                        if (videoRef.current) {
                            setDuration(videoRef.current.duration);
                        }
                    }}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                />

                {/* 播放/暂停覆盖层 */}
                <div
                    className="video-player__overlay"
                    onClick={() => (isPlaying ? pause() : play())}
                >
                    {!isPlaying && (
                        <div className="video-player__play-btn">
                            <span>▶</span>
                        </div>
                    )}
                </div>

                {/* AI 暂停提示 */}
                {!isPlaying && activeMarker && (
                    <div className="video-player__ai-notice">
                        <span className="video-player__ai-icon">🤖</span>
                        <span>AI 助手已暂停视频，正在讲解知识点...</span>
                    </div>
                )}
            </div>

            {/* 控制栏 */}
            <div className="video-player__controls">
                {/* 播放按钮 */}
                <button
                    className="video-player__ctrl-btn"
                    onClick={() => (isPlaying ? pause() : play())}
                >
                    {isPlaying ? '⏸' : '▶'}
                </button>

                {/* 时间显示 */}
                <span className="video-player__time">
                    {formatTime(currentTime)} / {formatTime(effectiveDuration)}
                </span>

                {/* 进度条 */}
                <div
                    ref={progressRef}
                    className="video-player__progress"
                    onClick={handleProgressClick}
                >
                    {/* 已播放进度 */}
                    <div
                        className="video-player__progress-played"
                        style={{ width: `${(currentTime / effectiveDuration) * 100 || 0}%` }}
                    />

                    {/* 知识点标记 */}
                    {markers.map((marker) => (
                        <div
                            key={marker.id}
                            className={`video-player__marker ${activeMarker === marker.id ? 'video-player__marker--active' : ''
                                } ${marker.isCompleted ? 'video-player__marker--completed' : ''}`}
                            style={{
                                left: `${(marker.time / effectiveDuration) * 100}%`,
                                backgroundColor: getMarkerColor(marker.type),
                            }}
                            onClick={(e) => handleMarkerClick(marker, e)}
                            onMouseEnter={() => setShowMarkerTooltip(marker.id)}
                            onMouseLeave={() => setShowMarkerTooltip(null)}
                        >
                            {showMarkerTooltip === marker.id && (
                                <div className="video-player__marker-tooltip">
                                    <div className="video-player__marker-tooltip-title">
                                        {marker.title}
                                    </div>
                                    <div className="video-player__marker-tooltip-time">
                                        {formatTime(marker.time)}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* 当前位置指示器 */}
                    <div
                        className="video-player__scrubber"
                        style={{ left: `${(currentTime / effectiveDuration) * 100 || 0}%` }}
                    />
                </div>

                {/* 音量 */}
                <div className="video-player__volume">
                    <span className="video-player__volume-icon">🔊</span>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={(e) => {
                            const vol = parseFloat(e.target.value);
                            setVolume(vol);
                            if (videoRef.current) {
                                videoRef.current.volume = vol;
                            }
                        }}
                        className="video-player__volume-slider"
                    />
                </div>
            </div>

            {/* 知识点图例 */}
            <div className="video-player__legend">
                <span className="video-player__legend-title">📌 知识点：</span>
                <div className="video-player__legend-items">
                    {markers.map((marker) => (
                        <div
                            key={marker.id}
                            className={`video-player__legend-item ${activeMarker === marker.id ? 'video-player__legend-item--active' : ''
                                }`}
                            onClick={() => skipToMarker(marker.id)}
                        >
                            <span
                                className="video-player__legend-dot"
                                style={{ backgroundColor: getMarkerColor(marker.type) }}
                            />
                            <span className="video-player__legend-text">{marker.title}</span>
                            {marker.isCompleted && (
                                <span className="video-player__legend-check">✓</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default VideoPlayer;
