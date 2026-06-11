import React, { memo, useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface VideoPlayerProps {
  url: string;
  className?: string;
  poster?: string;
  isMuted?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = memo(({
  url,
  className = "",
  poster,
  isMuted: initialMuted = true
}) => {
  const [isMuted, setIsMuted] = useState(true); // Sempre inicia mudo para iOS autoplay
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Sincroniza o estado inicial se necessário, mas mantém a regra do start mute
  useEffect(() => {
    setIsMuted(true);
  }, [url]);

  // Efeito para YouTube via postMessage para evitar recarregamento do iframe
  useEffect(() => {
    const isYouTube = url.includes('youtube') || url.includes('youtu.be');
    if (isYouTube && iframeRef.current?.contentWindow) {
      const command = isMuted ? 'mute' : 'unMute';
      iframeRef.current.contentWindow.postMessage(JSON.stringify({
        event: 'command',
        func: command,
        args: ''
      }), '*');
    }
  }, [isMuted, url]);

  const toggleAudio = async (e: React.MouseEvent | React.PointerEvent) => {
    // REMOÇÃO DE BLOQUEIOS DE GESTO: Removendo e.stopPropagation() e e.preventDefault()
    // para que o iOS reconheça o gesto humano direto.
    
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);

    if (videoRef.current) {
      videoRef.current.muted = newMutedState;
      if (!newMutedState) {
        try {
          // O iOS exige que o play() seja aguardado e tratado
          await videoRef.current.play();
        } catch (error) {
          console.error("Autoplay bloqueado pelo iOS:", error);
          // Fallback de segurança: forçar o mudo novamente se o iOS rejeitar
          videoRef.current.muted = true;
          setIsMuted(true);
        }
      }
    }
  };

  if (!url) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <p className="text-white text-xs opacity-50 font-bold uppercase tracking-widest">URL não encontrada</p>
      </div>
    );
  }

  const youtubeMatch = url.split(/(vi\/|v=|\/shorts\/|youtu\.be\/|\/embed\/)/);
  const videoId = youtubeMatch[2]?.split(/[?&]/)[0];
  const isYouTube = url.includes('youtube') || url.includes('youtu.be');

  return (
    <div className={`relative w-full h-full bg-black flex items-center justify-center overflow-hidden ${className}`}>
      {isYouTube && videoId && videoId.length === 11 ? (
        <iframe 
          ref={iframeRef}
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&rel=0&enablejsapi=1`}
          className="w-full h-full border-0 pointer-events-none"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="YouTube player"
        />
      ) : (
        <video
          ref={videoRef}
          src={url}
          controls={false}
          playsInline={true}
          autoPlay={true}
          muted={true}
          loop={true}
          poster={poster}
          className="w-full h-full object-contain"
        />
      )}
      
      <button 
        onClick={toggleAudio}
        onPointerDown={toggleAudio}
        className="absolute bottom-4 right-4 z-[100] bg-black/50 p-2 rounded-full hover:bg-black/70 transition-colors pointer-events-auto"
      >
        {isMuted ? (
          <VolumeX className="text-white w-6 h-6" />
        ) : (
          <Volume2 className="text-white w-6 h-6" />
        )}
      </button>
    </div>
  );
});

export default VideoPlayer;