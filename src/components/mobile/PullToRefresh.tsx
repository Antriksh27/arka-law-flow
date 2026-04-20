import React from 'react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

// Pull-to-refresh disabled per user request. Renders children as-is.
export const PullToRefresh: React.FC<PullToRefreshProps> = ({ children }) => {
  return <>{children}</>;
};
