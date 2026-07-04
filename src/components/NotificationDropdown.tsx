import React from 'react';
import { Bell, X, Check, MessageSquare, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface Notification {
  id: string;
  type: 'message' | 'alert' | 'update';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const mockNotifications: Notification[] = [];

export function NotificationDropdown({ onClose, onViewAll }: { onClose: () => void; onViewAll: () => void }) {
  return (
    <div className="absolute top-12 right-0 w-80 bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/10 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      <div className="p-4 border-b border-outline-variant/10 flex items-center justify-between">
        <h3 className="font-bold text-sm text-on-surface">Notifications</h3>
        <button onClick={onClose} className="p-1 hover:bg-surface-container rounded-full transition-colors">
          <X className="w-4 h-4 text-secondary" />
        </button>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {mockNotifications.length > 0 ? (
          mockNotifications.map((n) => (
            <div key={'dropdown-' + n.id} className={cn("p-4 border-b border-outline-variant/5 hover:bg-surface-container-low transition-colors flex gap-3", !n.read && "bg-primary/5")}>
              <div className={cn("mt-1 p-1.5 rounded-full", n.type === 'message' ? "bg-primary/10 text-primary" : n.type === 'alert' ? "bg-tertiary/10 text-tertiary" : "bg-secondary/10 text-secondary")}>
                {n.type === 'message' && <MessageSquare className="w-3.5 h-3.5" />}
                {n.type === 'alert' && <AlertCircle className="w-3.5 h-3.5" />}
                {n.type === 'update' && <Check className="w-3.5 h-3.5" />}
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-on-surface">{n.title}</p>
                <p className="text-[10px] text-secondary mt-0.5">{n.message}</p>
                <p className="text-[9px] text-outline-variant mt-1">{n.time}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center">
            <Bell className="w-8 h-8 text-outline-variant mx-auto mb-3 opacity-30" />
            <p className="text-[11px] text-secondary">No new notifications</p>
          </div>
        )}
      </div>
      <div className="p-2 border-t border-outline-variant/10">
        <button onClick={onViewAll} className="w-full py-2 text-[10px] font-bold text-primary hover:bg-primary/5 rounded-lg transition-colors">View All Notifications</button>
      </div>
    </div>
  );
}
