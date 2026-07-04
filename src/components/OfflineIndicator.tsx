import React, { useState, useEffect } from "react";
import { WifiOff, RefreshCw, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBackOnline, setShowBackOnline] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      setShowBackOnline(true);
      const timer = setTimeout(() => {
        setShowBackOnline(false);
      }, 4000); // Hide the success toast after 4 seconds
      return () => clearTimeout(timer);
    }

    function handleOffline() {
      setIsOnline(false);
      setShowBackOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check on mounting
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRetry = () => {
    if (isChecking) return;
    setIsChecking(true);

    // Initial browser check
    if (!navigator.onLine) {
      setTimeout(() => {
        setIsChecking(false);
      }, 600);
      return;
    }

    // Try fetching index.html to check if we can actually reach the server
    fetch("/index.html", { method: "HEAD", cache: "no-store", mode: "no-cors" })
      .then(() => {
        setIsOnline(true);
        setIsChecking(false);
        setShowBackOnline(true);
        setTimeout(() => setShowBackOnline(false), 4000);
      })
      .catch(() => {
        setIsOnline(false);
        setIsChecking(false);
      });
  };

  return (
    <AnimatePresence>
      {/* 1. Offline Notification Pill */}
      {!isOnline && (
        <motion.div
          id="offline-banner-container"
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-surface-container/95 backdrop-blur-md border border-tertiary/25 px-5 py-3.5 rounded-full shadow-2xl font-manrope max-w-sm w-11/12 sm:w-auto"
        >
          <div className="flex items-center gap-2 text-tertiary">
            <WifiOff className="w-4 h-4 animate-pulse shrink-0" />
            <span className="text-[12px] font-black uppercase tracking-widest text-on-surface">
              You are offline
            </span>
          </div>
          <span className="text-[11px] text-secondary font-medium border-l border-outline-variant/25 pl-3 pr-2 whitespace-nowrap">
            Viewing cached data
          </span>
          <button
            id="offline-retry-button"
            onClick={handleRetry}
            disabled={isChecking}
            className="flex items-center gap-1.5 bg-tertiary text-white hover:bg-tertiary/95 text-[10px] font-black uppercase tracking-widest rounded-full px-3 py-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer select-none"
          >
            <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? "Checking" : "Retry"}
          </button>
        </motion.div>
      )}

      {/* 2. Success Back Online Toast notification */}
      {showBackOnline && (
        <motion.div
          id="online-toast-container"
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 px-5 py-3 rounded-full shadow-lg font-manrope"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="text-xs font-bold">Connection restored! Dashboard sync active.</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
