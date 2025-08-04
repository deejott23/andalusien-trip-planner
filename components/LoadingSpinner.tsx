import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function LoadingSpinner({ message = 'Lade...', size = 'md' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className={`animate-spin rounded-full border-b-2 border-amber-600 mx-auto mb-4 ${sizeClasses[size]}`}></div>
        <h1 className="text-2xl text-slate-700">{message}</h1>
      </div>
    </div>
  );
} 