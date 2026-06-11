import React, { useState, useEffect, memo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, MessageCircle, Send, Trash2, MessageSquare, Pencil, Check, Volume2, VolumeX } from 'lucide-react';
import { Video } from '@/types';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/hooks/use-auth';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

interface StoryViewerProps {
  videos: Video[];
  initialIndex: number;
  onClose: () => void;
  startWithCommentsOpen?: boolean;
}

const VideoCard = memo(({ 
  video, 
  isActive, 
  onNext, 
  onPrev,
  partners,
  onOpenComments,
  index,
  isMuted,
  onToggleMute
}: { 
  video: Video; 
  isActive: boolean; 
  onNext: () => void; 
  onPrev: () => void;
  partners: any[];
  onOpenComments: (videoId: string) => void;
  index: number;
  isMuted: boolean;
  onToggleMute: () => void;
}) => {
  const [videoSrc, setVideoSrc] = useState<string>('');
  const { toggleVideoLike } = useApp();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const isYouTube = video.url.includes('youtube') || video.url.includes('youtu.be');
  const youtubeMatch = video.url.split(/(vi\/|v=|\/shorts\/|youtu\.be\/|\/embed\/)/);
  const videoId = youtubeMatch[2]?.split(/[?&]/)[0];
  const isValidYouTube = isYouTube && videoId && videoId.length === 11;

  useEffect(() => {
    if (isActive) {
      if (isValidYouTube) {
        // Sempre inicia mudo com JS API habilitada para controle sem re-render
        setVideoSrc(`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&rel=0&enablejsapi=1`);
      } else {
        setVideoSrc(video.url);
      }
    } else {
      setVideoSrc('');
    }
  }, [isActive, video.url, videoId, isValidYouTube]);

  // Efeito para garantir que o áudio responda ao toggle sem recarregar o vídeo/iframe
  useEffect(() => {
    if (!isActive) return;

    if (isValidYouTube) {
      if (iframeRef.current?.contentWindow) {
        const command = isMuted ? 'mute' : 'unMute';
        iframeRef.current.contentWindow.postMessage(JSON.stringify({
          event: 'command',
          func: command,
          args: ''
        }), '*');
      }
    } else if (videoRef.current) {
      videoRef.current.muted = isMuted;
      if (!isMuted) {
        videoRef.current.play().catch(e => console.log("Play interrupted or blocked:", e));
      }
    }
  }, [isMuted, isValidYouTube, isActive]);

  const handleLike = async () => {
    await toggleVideoLike(video.id);
  };

  const partner = partners.find(p => p.id === video.partnerId);

  return (
    <div 
      className="w-full h-full relative snap-start snap-always shrink-0 flex items-center justify-center" 
      style={{ minWidth: '100vw' }}
      data-index={index}
    >
      {/* Background/Player Container */}
      <div className="w-full h-full relative bg-black">
        {isActive && (
          isValidYouTube ? (
            <iframe 
              ref={iframeRef}
              src={videoSrc}
              className="w-full h-full border-0 pointer-events-none"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              title="YouTube player"
            />
          ) : (
            <video
              ref={videoRef}
              src={videoSrc}
              playsInline
              autoPlay
              loop
              muted={true}
              className="w-full h-full object-cover"
            />
          )
        )}
      </div>

      {/* Touch areas for navigation (z-index 30) */}
      <div className="absolute inset-0 z-30 flex">
        <div className="w-1/4 h-full cursor-pointer" onClick={(e) => { e.stopPropagation(); onPrev(); }} />
        <div className="w-2/4 h-full cursor-pointer" />
        <div className="w-1/4 h-full cursor-pointer" onClick={(e) => { e.stopPropagation(); onNext(); }} />
      </div>

      {/* UI Controls (z-index 100) */}
      <div className="absolute inset-0 z-[100] pointer-events-none flex flex-col justify-between p-4 pb-12 pt-16">
        <div className="flex justify-end">
           <button 
             onClick={(e) => {
               e.stopPropagation();
               onToggleMute();
             }}
             className="pointer-events-auto bg-black/20 backdrop-blur-md p-2 rounded-full text-white"
           >
             {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
           </button>
        </div>

        <div className="flex justify-between items-end">
          <div className="pointer-events-auto max-w-[70%]">
             <div className="flex items-center gap-3 mb-3 cursor-pointer" onClick={() => {
                if (partner) window.location.assign(`/parceiro/${partner.id}`);
             }}>
                <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-white/20">
                   <img src={partner?.image} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="text-white drop-shadow-md">
                   <h4 className="font-bold leading-tight">{partner?.name || 'Alagoas'}</h4>
                </div>
             </div>
             <p className="text-white text-sm font-bold drop-shadow-md">{video.title}</p>
          </div>

          <div className="flex flex-col gap-6 items-center pointer-events-auto">
            <button 
              onClick={handleLike}
              className="flex flex-col items-center gap-1 text-white"
            >
              <div className="bg-black/20 backdrop-blur-md p-3 rounded-full">
                <Heart size={28} className={video.userHasLiked ? "fill-red-500 text-red-500" : ""} />
              </div>
              <span className="text-xs font-bold drop-shadow-md">{video.likesCount || 0}</span>
            </button>

            <button 
              onClick={() => onOpenComments(video.id)}
              className="flex flex-col items-center gap-1 text-white"
            >
              <div className="bg-black/20 backdrop-blur-md p-3 rounded-full">
                <MessageSquare size={28} />
              </div>
              <span className="text-xs font-bold drop-shadow-md">{video.commentsCount || 0}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

const StoryViewer: React.FC<StoryViewerProps> = memo(({ videos, initialIndex, onClose, startWithCommentsOpen = false }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isCommentsOpen, setIsCommentsOpen] = useState(startWithCommentsOpen);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [isMuted, setIsMuted] = useState(true); // Inicia mudo para conformidade iOS

  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { partners, videos: contextVideos, addVideoComment, deleteVideoComment, updateVideoComment } = useApp();
  const { user } = useAuth();
  
  const displayVideos = contextVideos.length > 0 ? contextVideos : videos;

  const handleNext = () => {
    if (currentIndex < displayVideos.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0); // Loop
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      setCurrentIndex(displayVideos.length - 1); // Loop to end
    }
  };

  // IntersectionObserver to detect active video on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0');
            if (index !== currentIndex) {
              setCurrentIndex(index);
            }
          }
        });
      },
      {
        root: scrollContainerRef.current,
        threshold: 0.5,
      }
    );

    const container = scrollContainerRef.current;
    if (container) {
      const children = Array.from(container.children);
      children.forEach((child) => observer.observe(child));
    }

    return () => observer.disconnect();
  }, [displayVideos.length, currentIndex]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      const targetScroll = currentIndex * window.innerWidth;
      if (Math.abs(scrollContainerRef.current.scrollLeft - targetScroll) > 10) {
        scrollContainerRef.current.scrollTo({
          left: targetScroll,
          behavior: 'smooth'
        });
      }
    }
  }, [currentIndex]);

  // Auto-advance
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isCommentsOpen) {
        handleNext();
      }
    }, 30000);
    return () => clearTimeout(timer);
  }, [currentIndex, isCommentsOpen]);

  const openComments = (videoId: string) => {
    setActiveVideoId(videoId);
    setIsCommentsOpen(true);
  };

  // Fetch comments when open
  const { data: comments, refetch: refetchComments } = useQuery({
    queryKey: ['video-comments', activeVideoId],
    queryFn: async () => {
      if (!activeVideoId) return [];
      const { data, error } = await supabase
        .from('comentarios')
        .select('*, profiles(full_name, avatar_url)')
        .eq('video_id', activeVideoId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!activeVideoId && isCommentsOpen
  });

  const handleAddComment = async () => {
    if (!commentText.trim() || !activeVideoId || !user) return;
    
    await addVideoComment(activeVideoId, commentText);
    setCommentText('');
    refetchComments();
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editCommentText.trim()) return;
    try {
      await updateVideoComment(commentId, editCommentText);
      setEditingCommentId(null);
      setEditCommentText('');
      await refetchComments();
    } catch (error) {
      console.error("Error updating comment:", error);
    }
  };

  const startEditing = (commentId: string, content: string) => {
    setEditingCommentId(commentId);
    setEditCommentText(content);
  };

  const handleDeleteComment = async (commentId: string, videoId: string) => {
    await deleteVideoComment(commentId, videoId);
    refetchComments();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center overflow-hidden touch-none">
      <div 
        ref={scrollContainerRef}
        className="w-full h-full flex overflow-x-auto snap-x snap-mandatory hide-scrollbar"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {displayVideos.map((video, index) => (
          <VideoCard 
            key={video.id} 
            video={video} 
            index={index}
            isActive={index === currentIndex}
            onNext={handleNext}
            onPrev={handlePrev}
            partners={partners}
            onOpenComments={openComments}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted(!isMuted)}
          />

        ))}
      </div>

      <button 
        onClick={onClose}
        className="fixed top-8 right-4 z-[210] p-2 bg-black/40 backdrop-blur-md rounded-full text-white"
      >
        <X size={24} />
      </button>

      {/* Comments Sheet */}
      <Sheet open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
        <SheetContent side="bottom" className="h-[70vh] bg-white rounded-t-3xl border-0 p-0 overflow-hidden z-[300]">
          <div className="flex flex-col h-full">
            <SheetHeader className="p-4 border-b">
              <SheetTitle className="text-center font-black text-ocean">Comentários</SheetTitle>
            </SheetHeader>
            
            <div className="flex-1 overflow-y-auto p-4 pb-24">
               {comments && comments.length > 0 ? (
                 <div className="space-y-4">
                    {comments.map((comment: any) => (
                      <div key={comment.id} className="flex gap-3 items-start group">
                        <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden shrink-0">
                          <img src={comment.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user_id}`} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm">{comment.profiles?.full_name || 'Usuário'}</span>
                              <span className="text-[10px] text-gray-400">{new Date(comment.created_at).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {(user?.id === comment.user_id || user?.role === 'admin') && (
                                <>
                                  <button 
                                    onClick={() => startEditing(comment.id, comment.content)}
                                    className="text-gray-400 hover:text-ocean p-1"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteComment(comment.id, activeVideoId!)}
                                    className="text-gray-400 hover:text-red-500 p-1"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          
                          {editingCommentId === comment.id ? (
                            <div className="mt-1 flex gap-2">
                              <Input 
                                value={editCommentText}
                                onChange={(e) => setEditCommentText(e.target.value)}
                                className="h-8 text-sm focus-visible:ring-ocean"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleUpdateComment(comment.id)}
                              />
                              <Button 
                                size="sm" 
                                className="h-8 px-3 bg-ocean text-white text-[10px] flex items-center gap-1"
                                onClick={() => handleUpdateComment(comment.id)}
                              >
                                <Send size={12} />
                                Confirmar
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="h-8 px-2 text-[10px]"
                                onClick={() => setEditingCommentId(null)}
                              >
                                Cancelar
                              </Button>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-700">{comment.content}</p>
                          )}
                        </div>
                      </div>
                    ))}
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <MessageCircle size={48} className="mb-2 opacity-20" />
                    <p>Seja o primeiro a comentar!</p>
                 </div>
               )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t flex gap-2 items-center pb-8">
              <Input 
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Adicione um comentário..."
                className="flex-1 rounded-full bg-gray-100 border-0 focus-visible:ring-ocean"
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
              />
              <Button 
                onClick={handleAddComment}
                size="icon"
                className="rounded-full bg-ocean text-white h-10 w-10 shrink-0"
              >
                <Send size={18} />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
});

export default StoryViewer;