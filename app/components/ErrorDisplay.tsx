"use client";

import { AppError, getErrorIcon, getErrorColor } from "@/utils/auth-utils";

interface ErrorDisplayProps {
  error: AppError | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export default function ErrorDisplay({ error, onRetry, onDismiss, className = "" }: ErrorDisplayProps) {
  if (!error) return null;

  const colorClasses = getErrorColor(error.severity || 'medium');
  const icon = getErrorIcon(error.category);

  return (
    <div className={`mb-4 p-4 rounded-lg border backdrop-blur-md ${colorClasses} ${className}`}>
      <div className="flex items-start gap-3">
        <span className="text-lg mt-0.5">{icon}</span>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium text-sm leading-relaxed">
              {error.userMessage}
            </p>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="flex-shrink-0 text-current/60 hover:text-current transition-colors"
                aria-label="Dismiss error"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {error.retryable && onRetry && (
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={onRetry}
                className="text-xs font-medium text-current hover:underline"
              >
                Try again
              </button>
              {error.code && (
                <span className="text-xs text-current/60">
                  Error: {error.code}
                </span>
              )}
            </div>
          )}

          {error.metadata && (
            <details className="mt-2">
              <summary className="text-xs text-current/60 cursor-pointer hover:text-current">
                Technical details
              </summary>
              <pre className="mt-2 text-xs text-current/60 bg-current/5 p-2 rounded overflow-auto">
                {JSON.stringify(error.metadata, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}

// Specific error display for authentication
export function AuthErrorDisplay({ error, onRetry, onDismiss }: Omit<ErrorDisplayProps, 'className'>) {
  return (
    <ErrorDisplay
      error={error}
      onRetry={onRetry}
      onDismiss={onDismiss}
      className="bg-red-500/10 border-red-500/20 text-red-400"
    />
  );
}

// Specific error display for network issues
export function NetworkErrorDisplay({ error, onRetry, onDismiss }: Omit<ErrorDisplayProps, 'className'>) {
  return (
    <ErrorDisplay
      error={error}
      onRetry={onRetry}
      onDismiss={onDismiss}
      className="bg-orange-500/10 border-orange-500/20 text-orange-400"
    />
  );
}

// Specific error display for processing issues
export function ProcessingErrorDisplay({ error, onRetry, onDismiss }: Omit<ErrorDisplayProps, 'className'>) {
  return (
    <ErrorDisplay
      error={error}
      onRetry={onRetry}
      onDismiss={onDismiss}
      className="bg-blue-500/10 border-blue-500/20 text-blue-400"
    />
  );
}
