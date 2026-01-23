import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  X, 
  Clock, 
  Briefcase, 
  Users, 
  FileText, 
  Calendar, 
  CheckSquare,
  Trash2,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CARD_STYLES } from '@/lib/mobileStyles';

interface MobileSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RECENT_SEARCHES_KEY = 'dashboard_recent_searches';
const MAX_RECENT_SEARCHES = 5;

interface QuickFilter {
  id: string;
  label: string;
  icon: React.ReactNode;
  route: string;
  bg: string;
  iconBg: string;
  iconColor: string;
}

const quickFilters: QuickFilter[] = [
  { id: 'cases', label: 'Cases', icon: <Briefcase className="w-5 h-5" />, route: '/cases', bg: 'bg-sky-50', iconBg: 'bg-sky-100', iconColor: 'text-sky-500' },
  { id: 'clients', label: 'Clients', icon: <Users className="w-5 h-5" />, route: '/clients', bg: 'bg-violet-50', iconBg: 'bg-violet-100', iconColor: 'text-violet-500' },
  { id: 'documents', label: 'Docs', icon: <FileText className="w-5 h-5" />, route: '/documents', bg: 'bg-amber-50', iconBg: 'bg-amber-100', iconColor: 'text-amber-500' },
  { id: 'hearings', label: 'Hearings', icon: <Calendar className="w-5 h-5" />, route: '/hearings', bg: 'bg-rose-50', iconBg: 'bg-rose-100', iconColor: 'text-rose-500' },
  { id: 'tasks', label: 'Tasks', icon: <CheckSquare className="w-5 h-5" />, route: '/tasks', bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-500' },
];

export const MobileSearchModal: React.FC<MobileSearchModalProps> = ({ open, onOpenChange }) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch {
        setRecentSearches([]);
      }
    }
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const saveRecentSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    
    const updated = [trimmed, ...recentSearches.filter(s => s !== trimmed)].slice(0, MAX_RECENT_SEARCHES);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const handleSearch = (query: string) => {
    if (!query.trim()) return;
    saveRecentSearch(query);
    onOpenChange(false);
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const handleRecentSearchClick = (query: string) => {
    setSearchQuery(query);
    handleSearch(query);
  };

  const handleFilterClick = (filter: QuickFilter) => {
    onOpenChange(false);
    navigate(filter.route);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(searchQuery);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl bg-slate-50 p-0 border-0">
        {/* Header with Search */}
        <div className="bg-white px-4 py-4 border-b border-slate-100">
          <SheetTitle className="sr-only">Search</SheetTitle>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              ref={inputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search cases, clients, documents..."
              className="pl-12 pr-10 py-3 text-base rounded-xl bg-slate-50 border-0 focus-visible:ring-2 focus-visible:ring-slate-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5 text-slate-500" />
              </button>
            )}
          </div>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto h-[calc(85vh-100px)]">
          {/* Quick Filters Card */}
          <div className={CARD_STYLES.base}>
            <div className="p-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick Access</h3>
              <div className="grid grid-cols-5 gap-2">
                {quickFilters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => handleFilterClick(filter)}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl active:scale-95 transition-all"
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      filter.iconBg
                    )}>
                      <div className={filter.iconColor}>{filter.icon}</div>
                    </div>
                    <span className="text-xs font-medium text-slate-700">{filter.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Searches Card */}
          {recentSearches.length > 0 && (
            <div className={CARD_STYLES.base}>
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recent Searches</h3>
                  <button
                    onClick={clearRecentSearches}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-500 transition-colors active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear
                  </button>
                </div>
                <div className="space-y-1">
                  {recentSearches.map((query, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecentSearchClick(query)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors text-left group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4 h-4 text-slate-400" />
                      </div>
                      <span className="text-sm text-slate-700 flex-1 truncate">{query}</span>
                      <ArrowRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Search Tips Card */}
          <div className="bg-sky-50 rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-sky-900 mb-2">Search Tips</h3>
            <ul className="space-y-1.5 text-xs text-sky-700">
              <li>• Search by case number, client name, or keywords</li>
              <li>• Use filters above for quick navigation</li>
              <li>• Recent searches are saved for easy access</li>
            </ul>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
