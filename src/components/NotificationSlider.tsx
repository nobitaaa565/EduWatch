import React from 'react';
import ReactDOM from 'react-dom';
import { X, MessageSquare, AlertCircle, Check, Bell } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Notification {
  id: string;
  type: 'message' | 'alert' | 'update';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const allNotifications: Notification[] = [];

export function NotificationSlider({ onClose }: { onClose: () => void }) {
  const sliderContent = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-[60]"
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-y-0 right-0 w-full max-w-sm bg-surface-container-lowest shadow-2xl z-[70] flex flex-col"
      >
        <div className="p-4 border-b border-outline-variant/10 flex items-center justify-between">
          <h3 className="font-bold text-base text-on-surface">All Notifications</h3>
          <button onClick={onClose} className="p-1 hover:bg-surface-container rounded-full transition-colors">
            <X className="w-5 h-5 text-secondary" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {allNotifications.length > 0 ? (
            allNotifications.map((n) => (
              <div key={'slider-' + n.id} className={cn("p-4 border-b border-outline-variant/5 hover:bg-surface-container-low transition-colors flex gap-3", !n.read && "bg-primary/5")}>
                <div className={cn("mt-1 p-1.5 rounded-full", n.type === 'message' ? "bg-primary/10 text-primary" : n.type === 'alert' ? "bg-tertiary/10 text-tertiary" : "bg-secondary/10 text-secondary")}>
                  {n.type === 'message' && <MessageSquare className="w-4 h-4" />}
                  {n.type === 'alert' && <AlertCircle className="w-4 h-4" />}
                  {n.type === 'update' && <Check className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-on-surface">{n.title}</p>
                  <p className="text-[11px] text-secondary mt-0.5">{n.message}</p>
                  <p className="text-[10px] text-outline-variant mt-1">{n.time}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-outline-variant opacity-30" />
              </div>
              <h4 className="text-sm font-bold text-on-surface mb-1">No notifications yet</h4>
              <p className="text-xs text-secondary">We'll notify you when something important happens.</p>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );

  return ReactDOM.createPortal(sliderContent, document.body);
}
