
export type ViewType = 'calendar' | 'timeline' | 'table';

export type HearingStatus = 'scheduled' | 'adjourned' | 'completed' | 'cancelled';

// Updated to match database schema exactly
export type HearingType = 'order' | 'evidence' | 'judgment' | 'other' | 'preliminary' | 'bail' | 'arguments' | 'cross_examination';

export interface FilterState {
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  status: HearingStatus[];
  case: string;
  court: string;
  assignedUser: string;
  searchQuery: string;
}

export interface Hearing {
  id: string;
  case_id: string;
  hearing_date: string;
  hearing_time: string | null;
  court_name: string;
  bench: string | null;
  coram: string | null;
  hearing_type: HearingType;
  status: HearingStatus;
  outcome: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  firm_id: string | null;
  assigned_to: string | null;
  // Additional fields from the hearing_details view
  case_title?: string;
  case_number?: string;
  client_name?: string;
  created_by_name?: string;
}

export interface HearingFormData {
  case_id: string;
  hearing_date: Date | string;
  hearing_time: string | null;
  court_name: string;
  bench: string | null;
  coram: string | null;
  hearing_type: HearingType;
  status: HearingStatus;
  outcome: string | null;
  notes: string | null;
}
