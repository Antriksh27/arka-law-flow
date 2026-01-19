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
          ? 'bg-gradient-to-br from-primary/5 via-background to-muted/50'
          : 'bg-card',
        'border border-border shadow-sm',
        className
      )}
    >
      {/* Content */}
      <div className="space-y-4">
        {/* Title */}
        <div className="space-y-1.5">
          <h1 className="text-lg font-bold text-foreground leading-tight line-clamp-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded-lg inline-block">
              {subtitle}
            </p>
          )}
        </div>

        {/* Badges */}
        {badges && <div className="flex flex-wrap gap-2">{badges}</div>}

        {/* Metrics */}
        {metrics.length > 0 && (
          <div className="grid grid-cols-3 gap-3 pt-2">
            {metrics.map((metric, index) => (
              <div
                key={index}
                className="bg-card rounded-xl px-3 py-2.5 border border-border text-center"
              >
                <div className="text-lg font-bold text-foreground">
                  {metric.value}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  {metric.label}
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
