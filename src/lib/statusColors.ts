// Shared status color utilities for consistent styling across the app

export type CaseStatus = 'pending' | 'disposed' | 'stayed' | 'transferred';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type AppointmentStatus = 'upcoming' | 'arrived' | 'late' | 'completed' | 'cancelled' | 'rescheduled' | 'in-progress';
export type HearingStatus = 'scheduled' | 'completed' | 'adjourned' | 'cancelled';
export type ClientStatus = 'active' | 'inactive' | 'lead';

// Case status colors
export const getCaseStatusColor = (status: CaseStatus | string) => {
  switch (status) {
    case 'pending':
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        border: 'border-blue-200',
        dot: 'bg-blue-600'
      };
    case 'disposed':
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        border: 'border-gray-200',
        dot: 'bg-gray-600'
      };
    case 'stayed':
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        border: 'border-yellow-200',
        dot: 'bg-yellow-600'
      };
    case 'transferred':
      return {
        bg: 'bg-purple-100',
        text: 'text-purple-800',
        border: 'border-purple-200',
        dot: 'bg-purple-600'
      };
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        border: 'border-gray-200',
        dot: 'bg-gray-600'
      };
  }
};

// Task status colors
export const getTaskStatusColor = (status: TaskStatus | string) => {
  switch (status) {
    case 'pending':
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        border: 'border-yellow-200',
        dot: 'bg-yellow-600'
      };
    case 'in_progress':
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        border: 'border-blue-200',
        dot: 'bg-blue-600'
      };
    case 'completed':
      return {
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-200',
        dot: 'bg-green-600'
      };
    case 'cancelled':
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-500',
        border: 'border-gray-200',
        dot: 'bg-gray-500'
      };
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        border: 'border-gray-200',
        dot: 'bg-gray-600'
      };
  }
};

// Appointment status colors
export const getAppointmentStatusColor = (status: AppointmentStatus | string) => {
  switch (status) {
    case 'upcoming':
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        border: 'border-blue-200',
        dot: 'bg-blue-600'
      };
    case 'arrived':
    case 'completed':
      return {
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-200',
        dot: 'bg-green-600'
      };
    case 'late':
      return {
        bg: 'bg-orange-100',
        text: 'text-orange-800',
        border: 'border-orange-200',
        dot: 'bg-orange-600'
      };
    case 'rescheduled':
      return {
        bg: 'bg-purple-100',
        text: 'text-purple-800',
        border: 'border-purple-200',
        dot: 'bg-purple-600'
      };
    case 'in-progress':
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        border: 'border-yellow-200',
        dot: 'bg-yellow-600'
      };
    case 'cancelled':
      return {
        bg: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-200',
        dot: 'bg-red-600'
      };
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        border: 'border-gray-200',
        dot: 'bg-gray-600'
      };
  }
};

// Client status colors
export const getClientStatusColor = (status: ClientStatus | string) => {
  switch (status) {
    case 'active':
      return {
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-200',
        dot: 'bg-green-600'
      };
    case 'inactive':
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-500',
        border: 'border-gray-200',
        dot: 'bg-gray-500'
      };
    case 'lead':
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        border: 'border-blue-200',
        dot: 'bg-blue-600'
      };
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        border: 'border-gray-200',
        dot: 'bg-gray-600'
      };
  }
};

// Team member status colors
export const getTeamMemberStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return {
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-200'
      };
    case 'suspended':
      return {
        bg: 'bg-red-100',
        text: 'text-red-500',
        border: 'border-red-200'
      };
    case 'invited':
    default:
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        border: 'border-blue-200'
      };
  }
};
