import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../lib/utils';
import { X, Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { useSettings } from '../lib/SettingsContext';

interface PostImageProps {
  src: string;
  alt?: string;
  className?: string;
  containerClassName?: string;
  aspectRatio?: number; // e.g. 16/9, 4/3
  onClick?: (e: React.MouseEvent) => void;
  onLoad?: () => void;
}

const isVideoUrl = (url: string): boolean => {
  if (!url) return false;
  return url.startsWith('data:video/') || url.match(/\.(mp4|webm|ogg|mov|avi|mkv|mov)(\?.*)?$/i) !== null;
};

const formatTime = (secs: number) => {
  if (isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

interface CustomVideoPlayerProps {
  src: string;
  className?: string;
  onLoadedData?: () => void;
  autoPlay?: boolean;
  defaultMuted?: boolean;
  onClickVideo?: (e: React.MouseEvent) => void;
  onFullscreenClick?: (e: React.MouseEvent) => void;
  showFullscreenButton?: boolean;
  containerClassName?: string;
}

export const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = ({
  src,
  className,
  onLoadedData,
  autoPlay = false,
  defaultMuted = true,
  onClickVideo,
  onFullscreenClick,
  showFullscreenButton = false,
  containerClassName,
}) => {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(defaultMuted);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    if (!videoRef.current) return;
    if (autoPlay) {
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.warn('Autoplay prevented:', err));
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [autoPlay, src]);

  const togglePlay = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.warn("Play blocked:", err);
      });
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!videoRef.current) return;
    const nextMute = !isMuted;
    videoRef.current.muted = nextMute;
    setIsMuted(nextMute);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 0;
    setCurrentTime(current);
    if (dur > 0) {
      setProgress((current / dur) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration || 0);
    if (onLoadedData) {
      onLoadedData();
    }
  };

  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (!videoRef.current || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newPercentage = Math.max(0, Math.min(100, (clickX / width) * 100));
    const newTime = (newPercentage / 100) * duration;
    videoRef.current.currentTime = newTime;
    setProgress(newPercentage);
    setCurrentTime(newTime);
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    if (onClickVideo) {
      onClickVideo(e);
    } else {
      togglePlay(e);
    }
  };

  return (
    <div className={cn("relative w-full h-full group/video overflow-hidden bg-black flex items-center justify-center", containerClassName)}>
      <video
        ref={videoRef}
        src={src || undefined}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        className={cn("w-full h-full object-contain max-h-full", className)}
        muted={isMuted}
        loop
        playsInline
        onClick={handleVideoClick}
      />

      {/* Centered big play button when paused */}
      {!isPlaying && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            togglePlay(e);
          }}
          className="absolute inset-0 m-auto w-14 h-14 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-300 scale-100 hover:scale-105 z-10 cursor-pointer shadow-lg border border-white/10"
        >
          <Play className="w-7 h-7 fill-current ml-0.5 text-white" />
        </button>
      )}

      {/* Controls Overlay container */}
      <div 
        className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col gap-2 transition-opacity duration-300 transform opacity-0 group-hover/video:opacity-100 focus-within:opacity-100 z-10 text-white"
        onClick={(e) => e.stopPropagation()} // Stop propagation from bubble to container's general expand clicks
        onDoubleClick={(e) => e.stopPropagation()}
      >
        {/* Progress scrub bar */}
        <div 
          className="w-full h-1.5 bg-white/30 rounded-full cursor-pointer relative group/scrub"
          onClick={handleScrub}
        >
          <div 
            className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
          <div 
            className="absolute h-3 w-3 rounded-full bg-white border border-primary -top-1 shadow opacity-0 group-hover/scrub:opacity-100 transition-opacity"
            style={{ left: `calc(${progress}% - 6px)` }}
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between text-white select-none">
          <div className="flex items-center gap-3">
            <button 
              onClick={(e) => togglePlay(e)}
              className="p-1 px-1.5 hover:bg-white/15 rounded transition-colors cursor-pointer text-white flex items-center justify-center"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current text-white" /> : <Play className="w-4 h-4 fill-current text-white" />}
            </button>

            <span className="text-[11px] font-mono tracking-tight opacity-90 text-white">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={toggleMute}
              className="p-1 hover:bg-white/15 rounded transition-colors cursor-pointer text-white flex items-center justify-center"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
            </button>

            {showFullscreenButton && onFullscreenClick && (
              <button 
                onClick={onFullscreenClick}
                className="p-1 hover:bg-white/15 rounded transition-colors cursor-pointer text-white flex items-center justify-center"
                aria-label="Fullscreen"
              >
                <Maximize2 className="w-4 h-4 text-white" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const PostImage: React.FC<PostImageProps> = ({
  src,
  alt = '',
  className,
  containerClassName,
  aspectRatio = 16 / 9,
  onClick,
  onLoad,
}) => {
  const { user } = useAuth();
  const { videoAutoplay } = useSettings();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isVideo = isVideoUrl(src);

  // Use the global videoAutoplay setting from context to avoid any delay or stagnation
  const autoplayEnabled = videoAutoplay;

  useEffect(() => {
    if (isFullscreen) {
      document.body.classList.add('overflow-hidden');
      
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsFullscreen(false);
        }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.classList.remove('overflow-hidden');
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isFullscreen]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;

    if (naturalWidth && naturalHeight) {
      const imageRatio = naturalWidth / naturalHeight;
      if (imageRatio < aspectRatio) {
        setIsPortrait(true);
      } else {
        setIsPortrait(false);
      }
    }
    setImgLoaded(true);
    if (onLoad) {
      onLoad();
    }
  };

  const handleVideoLoad = () => {
    setImgLoaded(true);
    if (onLoad) {
      onLoad();
    }
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsFullscreen(true);
    if (onClick) {
      onClick(e);
    }
  };

  const lightboxContent = isFullscreen ? (
    <div 
      className="fixed inset-0 bg-black/95 z-[99999] flex items-center justify-center select-none p-4"
      onClick={(e) => {
        e.stopPropagation();
        setIsFullscreen(false);
      }}
    >
      {/* Close Button top right */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsFullscreen(false);
        }}
        className="absolute top-4 right-4 z-[100000] p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all duration-200 cursor-pointer border border-white/10 flex items-center justify-center"
        aria-label="Close fullscreen view"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Media Content */}
      <div 
        className="w-full h-full max-w-5xl max-h-[85vh] flex items-center justify-center select-text"
        onClick={(e) => e.stopPropagation()} // Prevent clicking image from closing the view
      >
        {isVideo ? (
          <CustomVideoPlayer
            src={src || undefined}
            autoPlay={true}
            defaultMuted={false}
            className="rounded-lg shadow-2xl max-w-full max-h-full"
            containerClassName="max-w-full max-h-[85vh] rounded-lg bg-transparent"
            showFullscreenButton={false}
          />
        ) : (
          <img
            src={src || null}
            alt={alt}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl selection:bg-transparent"
            referrerPolicy="no-referrer"
          />
        )}
      </div>
    </div>
  ) : null;

  return (
    <>
      <div
        className={cn(
          "relative overflow-hidden flex items-center justify-center bg-outline-variant/5 group cursor-pointer",
          containerClassName
        )}
        onClick={handleContainerClick}
      >
        {!imgLoaded && (
          <div className="absolute inset-0 bg-outline-variant/10 animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin opacity-40" />
          </div>
        )}

        {isVideo ? (
          <CustomVideoPlayer
            src={src || undefined}
            onLoadedData={handleVideoLoad}
            autoPlay={autoplayEnabled}
            defaultMuted={true}
            className={cn(
              "transition-all duration-300 w-full h-full object-cover",
              imgLoaded ? "opacity-100" : "opacity-0",
              className
            )}
            onClickVideo={handleContainerClick}
            showFullscreenButton={true}
            onFullscreenClick={handleContainerClick}
          />
        ) : (
          <img
            src={src || null}
            alt={alt}
            onLoad={handleImageLoad}
            className={cn(
              "transition-all duration-300",
              imgLoaded ? "opacity-100" : "opacity-0",
              isPortrait
                ? "h-full w-auto object-contain max-w-full"
                : "w-full h-full object-cover",
              className
            )}
            referrerPolicy="no-referrer"
          />
        )}
      </div>

      {isFullscreen && createPortal(lightboxContent, document.body)}
    </>
  );
};
