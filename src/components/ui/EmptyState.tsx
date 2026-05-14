import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <div className="w-14 h-14 bg-neutral-100 rounded-full flex items-center justify-center mb-4 text-neutral-400">
          {icon}
        </div>
      )}
      <p className="text-neutral-700 font-medium">{title}</p>
      {description && <p className="text-sm text-neutral-400 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
