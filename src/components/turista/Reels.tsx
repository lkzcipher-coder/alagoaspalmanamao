import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import StoryViewer from './StoryViewer';
import { useNavigate } from '@tanstack/react-router';

interface ReelsProps {
  onClose?: () => void;
}

const Reels: React.FC<ReelsProps> = ({ onClose }) => {
  const { videos } = useApp();
  const navigate = useNavigate();

  if (videos.length === 0) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center text-white p-8 text-center">
        <p>Nenhum vídeo disponível no momento.</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-black">
      <StoryViewer 
        videos={videos} 
        initialIndex={0} 
        onClose={() => {
          if (onClose) {
            onClose();
          } else {
            navigate({ to: '/' });
          }
        }}
      />
    </div>
  );
};

export default Reels;
