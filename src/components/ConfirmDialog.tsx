import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open, title, message, confirmText = 'تأیید', cancelText = 'انصراف',
  type = 'warning', onConfirm, onCancel
}: ConfirmDialogProps) {
  if (!open) return null;

  const colors = {
    danger: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', btn: 'bg-red-600 hover:bg-red-700' },
    warning: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', btn: 'bg-amber-600 hover:bg-amber-700' },
    info: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', btn: 'bg-blue-600 hover:bg-blue-700' },
  };

  const c = colors[type];

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-sm p-5 animate-fade-in">
        <div className={`w-12 h-12 rounded-full ${c.bg} flex items-center justify-center mx-auto mb-3`}>
          <AlertTriangle size={24} className={c.text} />
        </div>
        <h3 className="text-center font-bold text-lg mb-2">{title}</h3>
        <p className="text-center text-sm text-slate-600 dark:text-slate-400 mb-5">{message}</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg text-sm font-medium">
            {cancelText}
          </button>
          <button onClick={onConfirm} className={`flex-1 py-2.5 ${c.btn} text-white rounded-lg text-sm font-medium`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
