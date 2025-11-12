import React from 'react';
import { cn } from '@/lib/utils';

interface HeroCardProps {
  title: string;
  subtitle?: string;
  badges?: React.ReactNode;
  metrics?: { label: string; value: string | number }[];
  gradient?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export const HeroCard: React.FC<HeroCardProps> = ({
  title,
  subtitle,
  badges,
  metrics = [],
  gradient = true,
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl p-5',
        gradient
          ? 'bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/20'
          : 'bg-card',
        'border border-border shadow-sm',
        className
      )}
    >
      {/* Content */}
      <div className="space-y-3">
        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-foreground leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground font-mono">
              {subtitle}
            </p>
          )}
        </div>

        {/* Badges */}
        {badges && <div className="flex flex-wrap gap-2">{badges}</div>}

        {/* Metrics */}
        {metrics.length > 0 && (
          <div className="flex flex-wrap gap-3 pt-2">
            {metrics.map((metric, index) => (
              <div
                key={index}
                className="bg-white/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-border/50"
              >
                <div className="text-xs text-muted-foreground">
                  {metric.label}
                </div>
                <div className="text-base font-semibold text-foreground">
                  {metric.value}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Custom children */}
        {children}
      </div>
    </div>
  );
};
