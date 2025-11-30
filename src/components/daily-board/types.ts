export interface DailyHearing {
  hearing_id: string;
  hearing_date: string;
  hearing_time: string | null;
  judge: string | null;
  court_name: string | null;
  purpose_of_hearing: string | null;
  cause_list_type: string | null;
  status: string | null;
  hearing_notes: string | null;
  bench: string | null;
  coram: string | null;
  firm_id: string;
  assigned_to: string | null;
  
  case_id: string;
  case_number: string | null;
  case_title: string;
  petitioner: string | null;
  respondent: string | null;
  petitioner_advocate: string | null;
  respondent_advocate: string | null;
  case_court_name: string | null;
  advocate_name: string | null;
  
  assigned_lawyer_name: string | null;
  assigned_lawyer_user_id: string | null;
}

export interface GroupedHearings {
  courtName: string;
  judges: {
    judgeName: string;
    hearings: DailyHearing[];
  }[];
}

export interface DailyBoardFilters {
  searchQuery: string;
  court: string;
  judge: string;
  myHearingsOnly: boolean;
}
