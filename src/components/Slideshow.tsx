import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Brain, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

const trending = [
  {
    title: 'The Shift to Micro-Learning Architectures in Higher Ed',
    description: 'How serverless functions and event-driven design are reshaping how students interact with course materials.',
    author: 'Dr. Julian Vance',
    authorImg: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2&w=100&h=100&q=80',
    readTime: '12 min read',
    tag: 'High Traffic',
    icon: Zap,
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1200'
  },
  {
    title: 'AI-Driven Feedback Loops: Pedagogy at Scale',
    description: 'Utilizing large language models to provide instantaneous, nuanced feedback on complex engineering assignments.',
    author: 'Sarah Chen, Ph.D.',
    authorImg: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=100&h=100&q=80',
    readTime: '8 min read',
    tag: 'Emerging Tech',
    icon: Brain,
    image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=1200'
  }
];

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
  }),
  center: {
    x: 0,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? '-100%' : '100%',
  }),
};

export function Slideshow() {
  const [[index, direction], setPage] = useState([0, 0]);

  const slideIndex = Math.abs(index % trending.length);

  const paginate = (newDirection: number) => {
    setPage([index + newDirection, newDirection]);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      paginate(1);
    }, 5000);
    return () => clearInterval(timer);
  }, [index]);

  return (
    <div className="relative w-full h-[400px] rounded-2xl overflow-hidden mb-12">
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={index}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <img src={trending[slideIndex].image} alt={trending[slideIndex].title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 p-10 text-white max-w-2xl">
            <div className="flex mb-4">
              <span className="px-2 py-0.5 rounded border border-white/30 text-white bg-white/5 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                {trending[slideIndex].tag}
              </span>
            </div>
            <h2 className="text-4xl font-black font-manrope leading-tight mb-4">{trending[slideIndex].title}</h2>
            <p className="text-white/80 text-sm mb-6">{trending[slideIndex].description}</p>
            <div className="flex items-center gap-4">
              <img src={trending[slideIndex].authorImg} alt={trending[slideIndex].author} className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
              <div>
                <p className="font-bold text-sm">{trending[slideIndex].author}</p>
                <p className="text-xs text-white/60">{trending[slideIndex].readTime}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      
      <button onClick={() => paginate(-1)} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-colors z-10">
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button onClick={() => paginate(1)} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-colors z-10">
        <ChevronRight className="w-6 h-6" />
      </button>
    </div>
  );
}
