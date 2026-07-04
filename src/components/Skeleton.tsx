import React from 'react';
import { cn } from '../lib/utils';

import { motion } from 'motion/react';

interface SkeletonProps {
  className?: string;
  variant?: 'base' | 'text' | 'circle' | 'rect';
}

export function Skeleton({ className, variant = 'base' }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-outline-variant/10",
        variant === 'circle' && "rounded-full",
        variant === 'text' && "h-4 w-full rounded",
        variant === 'rect' && "rounded-xl",
        className
      )}
    />
  );
}

export function PostSkeleton() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.215, 0.61, 0.355, 1] }}
      className="bg-surface-container-lowest rounded-xl ambient-shadow border border-outline-variant/5 overflow-hidden p-4 space-y-4"
    >
      {/* 1. Header is immediate / fast */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="flex items-center gap-3"
      >
        <Skeleton variant="circle" className="w-10 h-10" />
        <div className="space-y-2 flex-1">
          <Skeleton variant="text" className="w-1/4 h-3" />
          <Skeleton variant="text" className="w-1/6 h-2" />
        </div>
      </motion.div>

      {/* 2. Text Content loads slightly afterwards */}
      <motion.div 
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="space-y-2"
      >
        <Skeleton variant="text" className="h-4" />
        <Skeleton variant="text" className="h-4 w-5/6" />
      </motion.div>

      {/* 3. Media is heavy and loads last */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Skeleton variant="rect" className="aspect-[16/9] w-full" />
      </motion.div>

      {/* 4. Action buttons are also loaded later */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.45 }}
        className="flex justify-between pt-2"
      >
        <Skeleton variant="text" className="w-20 h-8" />
        <Skeleton variant="text" className="w-20 h-8" />
        <Skeleton variant="text" className="w-20 h-8" />
      </motion.div>
    </motion.div>
  );
}

export function ProfileHeaderSkeleton() {
  return (
    <div className="bg-surface-container-lowest animate-in fade-in duration-500 overflow-hidden mb-6">
      <Skeleton className="h-[150px] md:h-[250px] w-full" />
      <div className="px-4 md:px-12 pb-6">
        <div className="relative flex flex-col md:flex-row items-end gap-6 -mt-12 md:-mt-20 mb-6">
          <Skeleton variant="circle" className="w-24 h-24 md:w-40 md:h-40 border-4 border-surface-container-lowest" />
          <div className="flex-1 pb-2 space-y-3 text-center md:text-left">
            <Skeleton variant="text" className="w-48 h-8 ml-auto mr-auto md:ml-0 md:mr-auto" />
            <Skeleton variant="text" className="w-24 h-4 ml-auto mr-auto md:ml-0 md:mr-auto" />
          </div>
          <div className="flex gap-2 pb-2">
            <Skeleton variant="rect" className="w-32 h-10 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton variant="circle" className="w-9 h-9" />
            <Skeleton variant="text" className="w-24 h-4" />
          </div>
        ))}
      </div>
    </div>
  );
}
