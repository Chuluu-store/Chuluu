'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useEffect } from 'react';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose?: () => void;
  position?: 'top-center' | 'top-right' | 'bottom-center' | 'bottom-right';
}

export function Toast({ message, type = 'success', duration = 3000, onClose, position = 'top-center' }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-400" />;
      default:
        return <CheckCircle className="w-5 h-5 text-green-400" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return 'bg-green-900/90 border-green-500';
      case 'error':
        return 'bg-red-900/90 border-red-500';
      case 'info':
        return 'bg-blue-900/90 border-blue-500';
      default:
        return 'bg-green-900/90 border-green-500';
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-center':
        return 'top-4 left-1/2 -translate-x-1/2';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-center':
        return 'bottom-4 left-1/2 -translate-x-1/2';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 left-1/2 -translate-x-1/2';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.9 }}
      className={`
        fixed z-[9999] ${getPositionClasses()}
        flex items-center gap-3 px-4 py-3 rounded-lg
        ${getColors()} border backdrop-blur-sm
        shadow-lg max-w-sm w-full mx-4 sm:mx-0
      `}
    >
      {getIcon()}
      <p className="text-sm font-medium text-white flex-1">{message}</p>
      {onClose && (
        <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
}

export function ToastContainer({
  children,
  containerPosition = 'top-center',
}: {
  children: React.ReactNode;
  containerPosition?: 'top-center' | 'top-right' | 'bottom-center' | 'bottom-right';
}) {
  const getContainerClasses = () => {
    switch (containerPosition) {
      case 'top-center':
        return 'top-0 left-0 right-0 flex justify-center pt-4';
      case 'top-right':
        return 'top-0 right-0 pr-4 pt-4';
      case 'bottom-center':
        return 'bottom-0 left-0 right-0 flex justify-center pb-4';
      case 'bottom-right':
        return 'bottom-0 right-0 pr-4 pb-4';
      default:
        return 'top-0 left-0 right-0 flex justify-center pt-4';
    }
  };

  return (
    <div className={`fixed z-[9999] ${getContainerClasses()} pointer-events-none`}>
      <div className="pointer-events-auto">
        <AnimatePresence>{children}</AnimatePresence>
      </div>
    </div>
  );
}
