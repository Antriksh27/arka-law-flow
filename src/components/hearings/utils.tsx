
import { Badge } from "@/components/ui/badge";
import { HearingStatus } from "./types";
import React from "react";
import { TimeUtils } from '@/lib/timeUtils';

// Function to get status badge with appropriate color
export const getHearingStatusBadge = (status: HearingStatus) => {
  switch (status) {
    case "scheduled":
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          Scheduled
        </Badge>
      );
    case "adjourned":
      return (
        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
          Adjourned
        </Badge>
      );
    case "completed":
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Completed
        </Badge>
      );
    case "cancelled":
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          Cancelled
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
          {status}
        </Badge>
      );
  }
};

// Function to check if current user can edit hearings
export const canEditHearing = () => {
  // This is a placeholder - in a real app, this would check the user's role
  // For now, we'll return true to enable editing for demo purposes
  return true;
};

// Function to convert ISO date string to formatted string
export const formatDate = (dateString: string) => {
  if (!dateString) return "";
  return TimeUtils.formatDate(dateString) || "";
};

// Function to convert time string to formatted string
export const formatTime = (timeString: string | null) => {
  if (!timeString) return "";
  return timeString;
};

// Function to format hearing type for display
export const formatHearingType = (type: string) => {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
