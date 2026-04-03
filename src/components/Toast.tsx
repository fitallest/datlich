import React, { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 flex items-center gap-3 bg-[#1e2329] border border-cyan-500/30 text-white px-4 py-3 rounded-lg shadow-2xl z-50 animate-bounce">
      <CheckCircle className="text-cyan-400 w-5 h-5" />
      <div>
        <h4 className="font-bold text-sm">Thông báo</h4>
        <p className="text-xs text-gray-400">{message}</p>
      </div>
    </div>
  );
};
