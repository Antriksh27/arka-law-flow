import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface TabConfig {
  value: string;
  label: string;
  icon?: React.ReactNode;
  activeClassName?: string;
}

interface MobileStickyHeaderProps {
  /** Page title displayed in the header */
  title: string;
  /** Optional subtitle or count */
  subtitle?: string;
  /** Search value */
  searchValue: string;
  /** Search change handler */
  onSearchChange: (value: string) => void;
  /** Search placeholder text */
  searchPlaceholder?: string;
  /** Filter button click handler - if not provided, filter button is hidden */
  onFilterClick?: () => void;
  /** Number of active filters for badge */
  activeFiltersCount?: number;
  /** Tab configuration - if not provided, tabs are hidden */
  tabs?: TabConfig[];
  /** Current active tab value */
  activeTab?: string;
  /** Tab change handler */
  onTabChange?: (value: string) => void;
  /** Optional right-side actions for header */
  headerActions?: React.ReactNode;
  /** Additional className for the sticky container */
  className?: string;
}

export const MobileStickyHeader: React.FC<MobileStickyHeaderProps> = ({
  title,
  subtitle,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  onFilterClick,
  activeFiltersCount = 0,
  tabs,
  activeTab,
  onTabChange,
  headerActions,
  className,
}) => {
  return (
    <div className="flex-shrink-0">
      {/* Fixed Header Bar */}
      <header className="bg-background border-b border-border h-14 supports-[padding-top:env(safe-area-inset-top)]:pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-foreground">{title}</h1>
            {subtitle && (
              <span className="text-sm text-muted-foreground">{subtitle}</span>
            )}
          </div>
          {headerActions && (
            <div className="flex items-center gap-2">
              {headerActions}
            </div>
          )}
        </div>
      </header>

      {/* Search + Tabs Container */}
      <div className={cn(
        "bg-background px-4 py-3 space-y-3 border-b border-border",
        className
      )}>
        {/* Search Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 h-12 border-border bg-card rounded-2xl shadow-sm text-base focus-visible:ring-1"
            />
          </div>
          {onFilterClick && (
            <Button
              variant="outline"
              size="icon"
              onClick={onFilterClick}
              className="h-12 w-12 flex-shrink-0 relative rounded-2xl border-border bg-card shadow-sm"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          )}
        </div>

        {/* Tabs (optional) */}
        {tabs && tabs.length > 0 && onTabChange && (
          <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
            <TabsList className={cn(
              "grid w-full bg-card rounded-2xl shadow-sm border border-border h-12 p-1",
              tabs.length === 2 && "grid-cols-2",
              tabs.length === 3 && "grid-cols-3",
              tabs.length === 4 && "grid-cols-4"
            )}>
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={cn(
                    "rounded-xl text-sm font-medium transition-all h-10 flex items-center justify-center gap-2",
                    "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                    tab.activeClassName
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
      </div>
    </div>
  );
};
