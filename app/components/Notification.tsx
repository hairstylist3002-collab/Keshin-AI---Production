import React from 'react';

interface NotificationProps {
  isVisible: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose?: () => void;
}

const Notification: React.FC<NotificationProps> = ({
  isVisible,
  title,
  message,
  type,
  onClose
}) => {
  if (!isVisible) return null;

  const typeStyles = {
    success: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      icon: 'text-emerald-400',
      iconPath: 'M5 13l4 4L19 7'
    },
    error: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      icon: 'text-red-400',
      iconPath: 'M6 18L18 6M6 6l12 12'
    },
    warning: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      icon: 'text-amber-400',
      iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z'
    },
    info: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      icon: 'text-blue-400',
      iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    }
  };

  const style = typeStyles[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`relative max-w-md w-full rounded-xl border ${style.bg} ${style.border} p-6 shadow-xl`}>
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full ${style.bg} ring-1 ring-current`}>
            <svg className={`h-4 w-4 ${style.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={style.iconPath} />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            <p className="mt-1 text-sm text-neutral-300">{message}</p>
            {onClose && (
              <button
                onClick={onClose}
                className="mt-3 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notification;
