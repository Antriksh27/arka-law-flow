import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar as CalendarIcon, Search, Download, Printer, User } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DailyBoardFilters } from './types';

interface DailyBoardHeaderProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  filters: DailyBoardFilters;
  onFiltersChange: (filters: DailyBoardFilters) => void;
  courts: string[];
  judges: string[];
  onExportPDF: () => void;
  onPrint: () => void;
}

export const DailyBoardHeader: React.FC<DailyBoardHeaderProps> = ({
  selectedDate,
  onDateChange,
  filters,
  onFiltersChange,
  courts,
  judges,
  onExportPDF,
  onPrint,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Daily Hearings Board</h1>
          <p className="text-sm text-gray-600 mt-1">
            Court cause list for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("justify-start text-left font-normal")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, 'PPP')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && onDateChange(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          <Button variant="outline" onClick={onPrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          
          <Button variant="outline" onClick={onExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search cases, parties, lawyers..."
            value={filters.searchQuery}
            onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
            className="pl-9"
          />
        </div>
        
        <Select value={filters.court} onValueChange={(value) => onFiltersChange({ ...filters, court: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by Court" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courts</SelectItem>
            {courts.map((court) => (
              <SelectItem key={court} value={court}>{court}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={filters.judge} onValueChange={(value) => onFiltersChange({ ...filters, judge: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by Judge" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Judges</SelectItem>
            {judges.map((judge) => (
              <SelectItem key={judge} value={judge}>{judge}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button
          variant={filters.myHearingsOnly ? "default" : "outline"}
          onClick={() => onFiltersChange({ ...filters, myHearingsOnly: !filters.myHearingsOnly })}
          className="w-full"
        >
          <User className="h-4 w-4 mr-2" />
          My Hearings
        </Button>
      </div>
    </div>
  );
};
