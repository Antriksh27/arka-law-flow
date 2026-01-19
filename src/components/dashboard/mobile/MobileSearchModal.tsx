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
  color: string;
}

const quickFilters: QuickFilter[] = [
  { id: 'cases', label: 'Cases', icon: <Briefcase className="w-5 h-5" />, route: '/cases', color: 'bg-blue-100 text-blue-600' },
  { id: 'clients', label: 'Clients', icon: <Users className="w-5 h-5" />, route: '/clients', color: 'bg-purple-100 text-purple-600' },
  { id: 'documents', label: 'Documents', icon: <FileText className="w-5 h-5" />, route: '/documents', color: 'bg-amber-100 text-amber-600' },
  { id: 'hearings', label: 'Hearings', icon: <Calendar className="w-5 h-5" />, route: '/hearings', color: 'bg-red-100 text-red-600' },
  { id: 'tasks', label: 'Tasks', icon: <CheckSquare className="w-5 h-5" />, route: '/tasks', color: 'bg-green-100 text-green-600' },
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
    // Navigate to a search results page or global search
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
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl px-0">
        <SheetHeader className="px-4 pb-4 border-b border-slate-100">
          <SheetTitle className="sr-only">Search</SheetTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              ref={inputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search cases, clients, documents..."
              className="pl-10 pr-10 py-3 text-base rounded-xl border-slate-200 focus:border-primary focus:ring-primary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>
        </SheetHeader>

        <div className="px-4 py-4 space-y-6 overflow-y-auto h-[calc(85vh-120px)]">
          {/* Quick Filters */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick Access</h3>
            <div className="grid grid-cols-3 gap-3">
              {quickFilters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => handleFilterClick(filter)}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 active:scale-95 transition-all"
                >
                  <div className={`p-3 rounded-xl ${filter.color}`}>
                    {filter.icon}
                  </div>
                  <span className="text-xs font-medium text-slate-700">{filter.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900">Recent Searches</h3>
                <button
                  onClick={clearRecentSearches}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-destructive transition-colors"
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
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors text-left group"
                  >
                    <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-sm text-slate-700 flex-1 truncate">{query}</span>
                    <ArrowRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Tips */}
          <div className="bg-slate-50 rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">Search Tips</h3>
            <ul className="space-y-1.5 text-xs text-slate-600">
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
