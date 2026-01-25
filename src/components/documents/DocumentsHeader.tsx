
import React, { useState } from 'react';
import { Search, Grid3X3, List, Filter, Upload, SlidersHorizontal, FileText, Image, File, X, Check, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UploadDocumentDialog } from './UploadDocumentDialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { CARD_STYLES, getAvatarColor, getInitials } from '@/lib/mobileStyles';
import { bg, border, text } from '@/lib/colors';

interface DocumentsHeaderProps {
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedFilters: {
    fileType: string;
    uploadedBy: string;
    caseId: string;
  };
  onFiltersChange: (filters: any) => void;
}

export const DocumentsHeader: React.FC<DocumentsHeaderProps> = ({
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
  selectedFilters,
  onFiltersChange
}) => {
  const isMobile = useIsMobile();
  const [showFilters, setShowFilters] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const queryClient = useQueryClient();

  // Fetch cases for filter dropdown
  const { data: cases = [] } = useQuery({
    queryKey: ['cases-for-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cases')
        .select('id, case_title')
        .order('case_title');
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch users for filter dropdown
  const { data: users = [] } = useQuery({
    queryKey: ['users-for-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .order('full_name');
      if (error) throw error;
      return data || [];
    }
  });

  const handleUploadSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['documents'] });
    queryClient.invalidateQueries({ queryKey: ['document-folders'] });
  };

  const hasActiveFilters = 
    selectedFilters.fileType !== 'all' || 
    selectedFilters.uploadedBy !== 'all' || 
    selectedFilters.caseId !== 'all';

  const clearFilters = () => {
    onFiltersChange({ fileType: 'all', uploadedBy: 'all', caseId: 'all' });
  };

  const fileTypeOptions = [
    { value: 'all', label: 'All Types', icon: File, bg: 'bg-slate-100', iconColor: 'text-slate-500' },
    { value: 'pdf', label: 'PDF', icon: FileText, bg: 'bg-rose-50', iconColor: 'text-rose-500' },
    { value: 'doc', label: 'Word', icon: FileText, bg: 'bg-sky-50', iconColor: 'text-sky-500' },
    { value: 'jpg', label: 'Images', icon: Image, bg: 'bg-violet-50', iconColor: 'text-violet-500' },
    { value: 'txt', label: 'Text', icon: FileText, bg: 'bg-slate-100', iconColor: 'text-slate-500' },
  ];

  return (
    <>
      <div className={isMobile ? `bg-white border-b ${border.default} px-4 py-3` : `bg-white border-b ${border.default} p-6`}>
        {!isMobile && (
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className={`text-2xl font-semibold ${text.primary}`}>Documents</h1>
              <p className={`${text.muted} mt-1`}>Manage and organize your legal documents</p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              
              <div className="flex border border-gray-300 rounded-lg bg-white">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onViewModeChange('grid')}
                  className={viewMode === 'grid' ? 'bg-gray-100' : ''}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onViewModeChange('list')}
                  className={viewMode === 'list' ? 'bg-gray-100' : ''}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>

              <Button 
                onClick={() => setShowUploadDialog(true)}
                className="bg-primary text-white hover:bg-primary/90"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Documents
              </Button>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className={`flex items-center gap-2 ${!isMobile && 'mb-4'}`}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className={`pl-10 bg-white ${isMobile ? 'h-10 text-sm' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
            />
          </div>
          
          {isMobile && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowMobileFilters(true)}
              className="flex-shrink-0"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Desktop Filters */}
        {!isMobile && showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File Type
              </label>
              <Select
                value={selectedFilters.fileType}
                onValueChange={(value) => 
                  onFiltersChange({ ...selectedFilters, fileType: value })
                }
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="doc">Word Documents</SelectItem>
                  <SelectItem value="jpg">Images</SelectItem>
                  <SelectItem value="txt">Text Files</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Uploaded By
              </label>
              <Select
                value={selectedFilters.uploadedBy}
                onValueChange={(value) => 
                  onFiltersChange({ ...selectedFilters, uploadedBy: value })
                }
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Case
              </label>
              <Select
                value={selectedFilters.caseId}
                onValueChange={(value) => 
                  onFiltersChange({ ...selectedFilters, caseId: value })
                }
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="All cases" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cases</SelectItem>
                  {cases.map((case_item) => (
                    <SelectItem key={case_item.id} value={case_item.id}>
                      {case_item.case_title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Filter Sheet */}
      {isMobile && (
        <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
          <SheetContent hideCloseButton side="bottom" className={`h-[85vh] rounded-t-3xl ${bg.page} p-0 border-0`}>
            {/* Header */}
            <div className={`flex items-center justify-between px-4 py-4 ${bg.card} border-b ${border.light}`}>
              <h2 className={`text-lg font-semibold ${text.primary}`}>Filters</h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className={`w-8 h-8 rounded-full ${bg.muted} hover:bg-muted flex items-center justify-center active:scale-95 transition-all`}
              >
                <X className={`w-4 h-4 ${text.muted}`} />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto h-[calc(85vh-140px)]">
              {/* File Type Card */}
              <div className={CARD_STYLES.base}>
                <div className="p-4">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">File Type</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {fileTypeOptions.map((option) => {
                      const Icon = option.icon;
                      const isSelected = selectedFilters.fileType === option.value;
                      return (
                        <button
                          key={option.value}
                          onClick={() => onFiltersChange({ ...selectedFilters, fileType: option.value })}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl transition-all active:scale-[0.98] border",
                            isSelected
                              ? `${option.bg} border-transparent`
                              : "bg-white border-slate-200"
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            isSelected ? option.bg : "bg-slate-100"
                          )}>
                            <Icon className={cn(
                              "w-5 h-5",
                              isSelected ? option.iconColor : "text-slate-400"
                            )} />
                          </div>
                          <span className={cn(
                            "flex-1 text-left text-sm font-medium",
                            isSelected ? "text-slate-900" : "text-slate-600"
                          )}>
                            {option.label}
                          </span>
                          {isSelected && (
                            <Check className={cn("w-4 h-4", option.iconColor)} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Uploaded By Card */}
              <div className={CARD_STYLES.base}>
                <div className="p-4">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Uploaded By</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    <button
                      onClick={() => onFiltersChange({ ...selectedFilters, uploadedBy: 'all' })}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl transition-all active:scale-[0.98]",
                        selectedFilters.uploadedBy === 'all'
                          ? "bg-emerald-50"
                          : "bg-slate-50 hover:bg-slate-100"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        selectedFilters.uploadedBy === 'all' ? "bg-emerald-100" : "bg-slate-200"
                      )}>
                        <span className={cn(
                          "text-sm font-semibold",
                          selectedFilters.uploadedBy === 'all' ? "text-emerald-600" : "text-slate-500"
                        )}>All</span>
                      </div>
                      <span className={cn(
                        "flex-1 text-left font-medium",
                        selectedFilters.uploadedBy === 'all' ? "text-slate-900" : "text-slate-600"
                      )}>
                        All Users
                      </span>
                      {selectedFilters.uploadedBy === 'all' && (
                        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </button>
                    {users.map((user) => {
                      const avatarColor = getAvatarColor(user.full_name || 'U');
                      const isSelected = selectedFilters.uploadedBy === user.id;
                      return (
                        <button
                          key={user.id}
                          onClick={() => onFiltersChange({ ...selectedFilters, uploadedBy: user.id })}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-xl transition-all active:scale-[0.98]",
                            isSelected
                              ? "bg-emerald-50"
                              : "bg-slate-50 hover:bg-slate-100"
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center",
                            avatarColor.bg
                          )}>
                            <span className={cn("text-sm font-semibold", avatarColor.text)}>
                              {getInitials(user.full_name || 'U')}
                            </span>
                          </div>
                          <span className={cn(
                            "flex-1 text-left font-medium truncate",
                            isSelected ? "text-slate-900" : "text-slate-600"
                          )}>
                            {user.full_name}
                          </span>
                          {isSelected && (
                            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                              <Check className="w-3.5 h-3.5 text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Case Card */}
              <div className={CARD_STYLES.base}>
                <div className="p-4">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Case</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    <button
                      onClick={() => onFiltersChange({ ...selectedFilters, caseId: 'all' })}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl transition-all active:scale-[0.98]",
                        selectedFilters.caseId === 'all'
                          ? "bg-sky-50"
                          : "bg-slate-50 hover:bg-slate-100"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        selectedFilters.caseId === 'all' ? "bg-sky-100" : "bg-slate-200"
                      )}>
                        <Briefcase className={cn(
                          "w-5 h-5",
                          selectedFilters.caseId === 'all' ? "text-sky-500" : "text-slate-400"
                        )} />
                      </div>
                      <span className={cn(
                        "flex-1 text-left font-medium",
                        selectedFilters.caseId === 'all' ? "text-slate-900" : "text-slate-600"
                      )}>
                        All Cases
                      </span>
                      {selectedFilters.caseId === 'all' && (
                        <div className="w-6 h-6 rounded-full bg-sky-500 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </button>
                    {cases.map((caseItem) => {
                      const isSelected = selectedFilters.caseId === caseItem.id;
                      return (
                        <button
                          key={caseItem.id}
                          onClick={() => onFiltersChange({ ...selectedFilters, caseId: caseItem.id })}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-xl transition-all active:scale-[0.98]",
                            isSelected
                              ? "bg-sky-50"
                              : "bg-slate-50 hover:bg-slate-100"
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                            isSelected ? "bg-sky-100" : "bg-slate-200"
                          )}>
                            <Briefcase className={cn(
                              "w-5 h-5",
                              isSelected ? "text-sky-500" : "text-slate-400"
                            )} />
                          </div>
                          <span className={cn(
                            "flex-1 text-left font-medium truncate",
                            isSelected ? "text-slate-900" : "text-slate-600"
                          )}>
                            {caseItem.case_title}
                          </span>
                          {isSelected && (
                            <div className="w-6 h-6 rounded-full bg-sky-500 flex items-center justify-center flex-shrink-0">
                              <Check className="w-3.5 h-3.5 text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-lg border-t border-slate-100 flex gap-3">
              {hasActiveFilters && (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="flex-1 h-12 rounded-full border-slate-200 text-slate-700"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              )}
              <Button
                onClick={() => setShowMobileFilters(false)}
                className={cn(
                  "h-12 rounded-full bg-slate-800 hover:bg-slate-700 text-white",
                  hasActiveFilters ? "flex-1" : "w-full"
                )}
              >
                Apply Filters
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      )}

      <UploadDocumentDialog 
        open={showUploadDialog} 
        onClose={() => setShowUploadDialog(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </>
  );
};
