import React, { useMemo, useState, useEffect } from "react";
import { useTeamMembers } from "@/components/team/useTeamMembers";
import { useTeamMemberStats } from "@/hooks/useTeamMemberStats";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogHeader, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { JoinHruLegal } from "@/components/team/JoinHruLegal";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobilePageContainer } from "@/components/mobile/MobilePageContainer";
import { MobileHeader } from "@/components/mobile/MobileHeader";

import { MobileFAB } from "@/components/mobile/MobileFAB";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// FIXED: Updated icon imports to available names in lucide-react
import { UserPlus, Search, Check, Mail, Phone, MoreHorizontal, User, Briefcase, CheckSquare, Settings, X, Calendar, Edit, Trash2, SlidersHorizontal, KeyRound, UserCheck } from "lucide-react";
import AddTeamMemberDialog from "@/components/team/AddTeamMemberDialog";
import EditTeamMemberDialog from "@/components/team/EditTeamMemberDialog";
import ResetPasswordDialog from "@/components/team/ResetPasswordDialog";
import ReactivateTeamMemberDialog from "@/components/team/ReactivateTeamMemberDialog";
import DeleteTeamMemberDialog from "@/components/team/DeleteTeamMemberDialog";
import { getTeamMemberStatusColor } from "@/lib/statusColors";

const roleLabels: Record<string, string> = {
  admin: "Admin",
  lawyer: "Lawyer",
  paralegal: "Paralegal",
  office_staff: "Office",
  receptionist: "Reception"
};

const roleOrder = ["lawyer", "paralegal"];

function TeamDirectory() {
  const {
    data = [],
    isLoading
  } = useTeamMembers();
  const { user, firmId, role: userRole, loading: authLoading } = useAuth();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [sidebarMember, setSidebarMember] = useState<any | null>(null);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [editMemberOpen, setEditMemberOpen] = useState(false);
  const [deleteMemberOpen, setDeleteMemberOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [reactivateMemberOpen, setReactivateMemberOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showMemberSheet, setShowMemberSheet] = useState(false);

  // Check if user can add members - admin only
  const canAddMembers = userRole === 'admin';

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let filteredData = !q ? data : data.filter((m: any) => m.full_name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q));
    
    // Apply role filter
    if (selectedFilter !== "all") {
      filteredData = filteredData.filter((m: any) => m.role === selectedFilter);
    }
    
    return filteredData;
  }, [search, data, selectedFilter]);

  const filters = useMemo(() => {
    let stats = {
      all: 0,
      lawyer: 0,
      paralegal: 0
    };
    data.forEach((m: any) => {
      stats.all++;
      if (m.role === "lawyer") stats.lawyer++;
      if (m.role === "paralegal") stats.paralegal++;
    });
    return stats;
  }, [data]);

  // Show selected member details (null = none)
  const detailMember = sidebarMember || filtered[0] || null;
  
  // Get stats for the selected member
  const { data: memberStats } = useTeamMemberStats(detailMember?.user_id);

  const handleEditMember = (member: any) => {
    setSelectedMember(member);
    setEditMemberOpen(true);
  };

  const handleDeleteMember = (member: any) => {
    setSelectedMember(member);
    setDeleteMemberOpen(true);
  };

  const handleResetPassword = (member: any) => {
    setSelectedMember(member);
    setResetPasswordOpen(true);
  };

  const handleReactivateMember = (member: any) => {
    setSelectedMember(member);
    setReactivateMemberOpen(true);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading team members...</p>
        </div>
      </div>
    );
  }

  if (user && !firmId) {
    return <JoinHruLegal user={user} />;
  }

  const mainContent = (
    <>
      {/* Header + Actions - Desktop Only */}
      {!isMobile && (
        <div className="flex w-full flex-col items-start gap-4">
          <div className="flex w-full items-center justify-between">
            <div className="flex flex-col items-start gap-2">
              <span className="text-2xl font-semibold text-gray-900">
                Team Directory
              </span>
              <span className="text-base text-slate-900">
                Manage your firm's team and collaboration
              </span>
            </div>
            {canAddMembers && (
              <Button 
                variant="default" 
                className="gap-2" 
                size="default"
                onClick={() => setAddMemberOpen(true)}
              >
                <UserPlus className="w-5 h-5" />
                Add New Member
              </Button>
            )}
          </div>
          <div className="flex w-full flex-wrap items-center gap-4">
            {/* Search */}
            <div className="h-auto w-80 flex-none">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input type="text" className="w-full rounded-lg bg-gray-100 pl-10 pr-4 py-2 text-sm border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition placeholder:text-gray-500" placeholder="Search team members..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            {/* Filter badges */}
            <div className="flex items-center gap-2">
              <FilterBadge label="All" count={filters.all} selected={selectedFilter === "all"} onClick={() => setSelectedFilter("all")} />
              <FilterBadge label="Lawyers" count={filters.lawyer} selected={selectedFilter === "lawyer"} onClick={() => setSelectedFilter("lawyer")} />
              <FilterBadge label="Paralegals" count={filters.paralegal} selected={selectedFilter === "paralegal"} onClick={() => setSelectedFilter("paralegal")} />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Search & Filter Bar - iOS Style Sticky */}
      {isMobile && (
        <div className="sticky top-14 z-30 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input 
                type="text" 
                className="w-full rounded-xl bg-white pl-10 pr-4 py-3 text-base border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none min-h-[48px] shadow-sm" 
                placeholder="Search team..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
              />
            </div>
            <button 
              onClick={() => setShowMobileFilters(true)}
              className="relative h-12 w-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm active:scale-95 transition-transform"
            >
              <SlidersHorizontal className="w-5 h-5 text-slate-600" />
              {selectedFilter !== "all" && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-slate-50" />
              )}
            </button>
          </div>
        </div>
      )}
      {/* Main table + details */}
      <div className="flex w-full items-start gap-6">
        {/* Team Table - Desktop */}
        {!isMobile && (
          <div className="flex grow shrink-0 basis-0 flex-col items-start gap-4">
            <div className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cases</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? <TableRow>
                      <TableCell colSpan={6}>
                        <Skeleton className="h-11 w-full rounded-lg" />
                      </TableCell>
                    </TableRow> : filtered.length === 0 ? <TableRow>
                      <TableCell colSpan={6}>
                        <span className="text-sm block px-2 py-6 text-center text-slate-900">No team members found.</span>
                      </TableCell>
                    </TableRow> : filtered.map((member: any) => <TableRow key={member.id} className="cursor-pointer data-[selected=true]:bg-accent" onClick={() => setSidebarMember(member)} data-selected={detailMember?.id === member.id}>
                        {/* Member Avatar, Name, Email */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={member.avatar_url} alt={member.full_name} />
                              <AvatarFallback>
                                {getInitials(member.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col items-start">
                              <span className="font-medium text-gray-900">{member.full_name}</span>
                              <span className="text-xs text-muted-foreground">{member.email}</span>
                            </div>
                          </div>
                        </TableCell>
                        {/* Role */}
                        <TableCell>
                          <Badge className="rounded-full px-3 py-1 text-xs font-medium">
                            {roleLabels[member.role] || member.role}
                          </Badge>
                        </TableCell>
                        {/* Status */}
                        <TableCell>
                          {(() => {
                            const statusColors = getTeamMemberStatusColor(member.status || '');
                            return (
                              <Badge className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors.bg} ${statusColors.text}`}>
                                {member.status ? member.status.charAt(0).toUpperCase() + member.status.slice(1) : 'Unknown'}
                              </Badge>
                            );
                          })()}
                        </TableCell>
                        {/* Real Cases Count */}
                        <TableCell>
                          <CaseCountCell memberId={member.user_id} />
                        </TableCell>
                        {/* Contact Buttons */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {member.email && <Button variant="ghost" size="icon" onClick={e => {
                        e.stopPropagation();
                        window.open(`mailto:${member.email}`);
                      }}>
                                <Mail className="w-4 h-4" />
                              </Button>}
                            {member.phone_number && <Button variant="ghost" size="icon" onClick={e => {
                        e.stopPropagation();
                        window.open(`tel:${member.phone_number}`);
                      }}>
                                <Phone className="w-4 h-4" />
                              </Button>}
                          </div>
                        </TableCell>
                        {/* Row Actions */}
                        <TableCell>
                          <div className="flex grow shrink-0 basis-0 items-center justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={e => e.stopPropagation()}>
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSidebarMember(member)}>
                                  <User className="w-4 h-4 mr-2" /> View Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Briefcase className="w-4 h-4 mr-2" /> Assign to Case
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <CheckSquare className="w-4 h-4 mr-2" /> Assign Task
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {userRole === 'admin' && (
                                  <>
                                    <DropdownMenuItem onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditMember(member);
                                    }}>
                                      <Edit className="w-4 h-4 mr-2" /> Edit Member
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => {
                                      e.stopPropagation();
                                      handleResetPassword(member);
                                    }}>
                                      <KeyRound className="w-4 h-4 mr-2" /> Reset Password
                                    </DropdownMenuItem>
                                    {member.status === 'suspended' && (
                                      <DropdownMenuItem 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleReactivateMember(member);
                                        }}
                                        className="text-green-600 focus:text-green-600"
                                      >
                                        <UserCheck className="w-4 h-4 mr-2" /> Reactivate Member
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteMember(member);
                                      }}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" /> Delete Member
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>)}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Mobile Card List - iOS Style */}
        {isMobile && (
          <div className="flex flex-col gap-3 px-4 w-full">
            {isLoading ? (
              <>
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-2xl" />
                ))}
              </>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <User className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">No team members found</h3>
                <p className="text-sm text-slate-500 text-center">
                  {search ? 'Try adjusting your search' : 'Add team members to get started'}
                </p>
              </div>
            ) : (
              filtered.map((member: any) => (
                <div
                  key={member.id}
                  className="bg-white rounded-2xl p-4 active:scale-[0.98] transition-all duration-200 shadow-sm"
                  onClick={() => {
                    setSidebarMember(member);
                    setShowMemberSheet(true);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="w-14 h-14 flex-shrink-0 ring-2 ring-slate-100">
                      <AvatarImage src={member.avatar_url} alt={member.full_name} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold text-lg">
                        {getInitials(member.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 truncate text-base">{member.full_name}</p>
                          <p className="text-sm text-slate-500 truncate mt-0.5">{member.email}</p>
                        </div>
                        {(() => {
                          const statusColors = getTeamMemberStatusColor(member.status || '');
                          return (
                            <Badge className={`rounded-full px-2.5 py-1 text-[10px] font-medium flex-shrink-0 ${statusColors.bg} ${statusColors.text}`}>
                              {member.status ? member.status.charAt(0).toUpperCase() + member.status.slice(1) : 'Unknown'}
                            </Badge>
                          );
                        })()}
                      </div>
                      <div className="flex items-center gap-2 mt-2.5">
                        <Badge className="rounded-full px-2.5 py-1 text-[10px] font-medium bg-sky-50 text-sky-700 border-0">
                          {roleLabels[member.role] || member.role}
                        </Badge>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          <CaseCountCell memberId={member.user_id} /> cases
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick contact actions - iOS Style */}
                  {(member.email || member.phone_number) && (
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                      {member.phone_number && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`tel:${member.phone_number}`);
                          }}
                          className="flex items-center justify-center gap-2 flex-1 py-3 px-4 rounded-xl bg-emerald-50 text-emerald-700 active:scale-95 transition-transform min-h-[48px]"
                        >
                          <Phone className="h-4 w-4" />
                          <span className="text-sm font-semibold">Call</span>
                        </button>
                      )}
                      {member.email && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`mailto:${member.email}`);
                          }}
                          className="flex items-center justify-center gap-2 flex-1 py-3 px-4 rounded-xl bg-sky-50 text-sky-700 active:scale-95 transition-transform min-h-[48px]"
                        >
                          <Mail className="h-4 w-4" />
                          <span className="text-sm font-semibold">Email</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Details sidebar - Desktop Only */}
        {!isMobile && (
          <div className="flex w-80 flex-none flex-col items-start gap-6">
            {!detailMember ? <span className="text-sm text-slate-900">Select a team member to view details</span> : <div className="flex w-full flex-col items-start gap-4 rounded-lg border border-solid border-gray-200 bg-white px-6 py-6">
                <div className="flex w-full items-center justify-between">
                  <span className="text-xl font-semibold text-gray-900">
                    Member Details
                  </span>
                  <Button variant="ghost" size="icon" onClick={() => setSidebarMember(null)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <div className="flex w-full flex-col items-start gap-4">
                  <div className="flex w-full items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={detailMember.avatar_url} alt={detailMember.full_name} />
                      <AvatarFallback>
                        {getInitials(detailMember.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                      <span className="font-medium text-gray-900">
                        {detailMember.full_name}
                      </span>
                      <Badge className="mt-1">{roleLabels[detailMember.role] || detailMember.role}</Badge>
                    </div>
                  </div>
                  <div className="flex w-full flex-col items-start gap-2">
                    <DataFieldHorizontal icon={<Mail className="w-4 h-4" />} label="Email">
                      <span className="text-sm text-gray-900">
                        {detailMember.email}
                      </span>
                    </DataFieldHorizontal>
                    <DataFieldHorizontal icon={<Phone className="w-4 h-4" />} label="Phone">
                      <span className="text-sm text-gray-900">
                        {detailMember.phone_number || "-"}
                      </span>
                    </DataFieldHorizontal>
                    <DataFieldHorizontal icon={<Calendar className="w-4 h-4" />} label="Joined">
                      <span className="text-sm text-gray-900">
                        {detailMember.join_date || (detailMember.joined_at ? new Date(detailMember.joined_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short'
                    }) : "-")}
                      </span>
                    </DataFieldHorizontal>
                  </div>
                </div>
                {/* Statistics */}
                <div className="flex w-full flex-col items-start gap-2">
                  <span className="font-medium text-gray-900">
                    Statistics
                  </span>
                  <div className="grid grid-cols-2 gap-4 w-full">
                    <div className="text-center p-3 bg-primary/5 rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {memberStats?.caseCount || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Active Cases</div>
                    </div>
                    <div className="text-center p-3 bg-accent/20 rounded-lg">
                      <div className="text-2xl font-bold text-accent-foreground">
                        {memberStats?.taskCount || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Tasks</div>
                    </div>
                  </div>
                </div>
                {/* Recent cases */}
                <div className="flex w-full flex-col items-start gap-2">
                  <span className="font-medium text-gray-900">
                    Recent Cases
                  </span>
                  <div className="flex w-full flex-col items-start">
                    {memberStats?.recentCases?.length > 0 ? (
                      memberStats.recentCases.map((case_item: any) => (
                        <div key={case_item.id} className="flex w-full items-center justify-between border-b border-solid border-border px-2 py-3">
                          <span className="text-sm text-foreground truncate">
                            {case_item.case_title}
                          </span>
                          <Badge variant="outline" className="ml-2">
                            {case_item.status}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground py-4 text-center w-full">
                        No recent cases found
                      </div>
                    )}
                  </div>
                </div>
                {/* Role-based permissions */}
                <div className="flex w-full flex-col items-start gap-2">
                  <span className="font-medium text-gray-900">Role Permissions</span>
                  <div className="flex w-full flex-col items-start gap-2">
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        checked={['admin', 'lawyer'].includes(detailMember.role)} 
                        disabled
                        id="assign-tasks"
                      />
                      <span className="text-sm text-muted-foreground ml-2">Can assign tasks</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        checked={['admin', 'lawyer', 'paralegal', 'office_staff'].includes(detailMember.role)} 
                        disabled
                        id="upload-documents"
                      />
                      <span className="text-sm text-muted-foreground ml-2">Can upload documents</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        checked={detailMember.role === 'admin'} 
                        disabled
                        id="manage-team"
                      />
                      <span className="text-sm text-muted-foreground ml-2">Can manage team</span>
                    </div>
                  </div>
                </div>
              </div>}
          </div>
        )}
      </div>

      {/* Mobile Member Details Sheet - iOS Style */}
      {isMobile && detailMember && (
        <Sheet open={showMemberSheet} onOpenChange={setShowMemberSheet}>
          <SheetContent 
            side="bottom" 
            className="h-[95vh] rounded-t-3xl bg-slate-50 overflow-hidden p-0"
            hideCloseButton
          >
            {/* iOS-style Header */}
            <div className="flex items-center justify-between px-4 h-14 bg-white border-b border-slate-100 sticky top-0 z-10">
              <button 
                onClick={() => setShowMemberSheet(false)}
                className="text-primary font-medium text-base active:opacity-70"
              >
                Cancel
              </button>
              <span className="font-semibold text-slate-900">Member Details</span>
              <div className="w-14" /> {/* Spacer for centering */}
            </div>
            
            {/* iOS Drag Handle */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-slate-300 rounded-full" />

            <div className="flex flex-col gap-4 p-4 overflow-y-auto h-[calc(95vh-56px)]">
              {/* Profile Header Card */}
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-4">
                  <Avatar className="w-20 h-20 ring-4 ring-slate-100">
                    <AvatarImage src={detailMember.avatar_url} alt={detailMember.full_name} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold text-2xl">
                      {getInitials(detailMember.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xl text-slate-900 truncate">{detailMember.full_name}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="rounded-full px-3 py-1 text-xs font-medium bg-sky-50 text-sky-700 border-0">
                        {roleLabels[detailMember.role] || detailMember.role}
                      </Badge>
                      {(() => {
                        const statusColors = getTeamMemberStatusColor(detailMember.status || '');
                        return (
                          <Badge className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors.bg} ${statusColors.text}`}>
                            {detailMember.status ? detailMember.status.charAt(0).toUpperCase() + detailMember.status.slice(1) : 'Unknown'}
                          </Badge>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Info Card */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Contact Information</p>
                </div>
                <div className="divide-y divide-slate-100">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-9 h-9 rounded-full bg-sky-50 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-sky-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500">Email</p>
                      <p className="text-sm font-medium text-slate-900 truncate">{detailMember.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center">
                      <Phone className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500">Phone</p>
                      <p className="text-sm font-medium text-slate-900">{detailMember.phone_number || "Not provided"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-9 h-9 rounded-full bg-violet-50 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500">Joined</p>
                      <p className="text-sm font-medium text-slate-900">
                        {detailMember.join_date || (detailMember.joined_at ? new Date(detailMember.joined_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short'
                        }) : "Unknown")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics Card */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Statistics</p>
                </div>
                <div className="grid grid-cols-2 divide-x divide-slate-100">
                  <div className="text-center py-5">
                    <div className="text-3xl font-bold text-primary">
                      {memberStats?.caseCount || 0}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Active Cases</div>
                  </div>
                  <div className="text-center py-5">
                    <div className="text-3xl font-bold text-amber-600">
                      {memberStats?.taskCount || 0}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Tasks</div>
                  </div>
                </div>
              </div>

              {/* Recent Cases Card */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Recent Cases</p>
                </div>
                {memberStats?.recentCases?.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {memberStats.recentCases.map((case_item: any) => (
                      <div key={case_item.id} className="flex items-center justify-between px-4 py-3">
                        <span className="text-sm font-medium text-slate-900 truncate flex-1 pr-2">
                          {case_item.case_title}
                        </span>
                        <Badge variant="outline" className="rounded-full text-[10px] px-2 py-0.5">
                          {case_item.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 py-8 text-center">
                    No recent cases found
                  </div>
                )}
              </div>

              {/* Permissions Card */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Permissions</p>
                </div>
                <div className="divide-y divide-slate-100">
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-slate-700">Can assign tasks</span>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${['admin', 'lawyer'].includes(detailMember.role) ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                      {['admin', 'lawyer'].includes(detailMember.role) && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-slate-700">Can upload documents</span>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${['admin', 'lawyer', 'paralegal', 'office_staff'].includes(detailMember.role) ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                      {['admin', 'lawyer', 'paralegal', 'office_staff'].includes(detailMember.role) && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-slate-700">Can manage team</span>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${detailMember.role === 'admin' ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                      {detailMember.role === 'admin' && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Actions */}
              {userRole === 'admin' && (
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Admin Actions</p>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-100 text-slate-700 active:scale-95 transition-transform font-medium text-sm"
                        onClick={() => {
                          setShowMemberSheet(false);
                          handleEditMember(detailMember);
                        }}
                      >
                        <Edit className="w-4 h-4" /> Edit
                      </button>
                      <button 
                        className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-100 text-slate-700 active:scale-95 transition-transform font-medium text-sm"
                        onClick={() => {
                          setShowMemberSheet(false);
                          handleResetPassword(detailMember);
                        }}
                      >
                        <KeyRound className="w-4 h-4" /> Password
                      </button>
                    </div>
                    {detailMember.status === 'suspended' && (
                      <button 
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500 text-white active:scale-95 transition-transform font-semibold text-sm"
                        onClick={() => {
                          setShowMemberSheet(false);
                          handleReactivateMember(detailMember);
                        }}
                      >
                        <UserCheck className="w-4 h-4" /> Reactivate Member
                      </button>
                    )}
                    <button 
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rose-50 text-rose-600 active:scale-95 transition-transform font-semibold text-sm"
                      onClick={() => {
                        setShowMemberSheet(false);
                        handleDeleteMember(detailMember);
                      }}
                    >
                      <Trash2 className="w-4 h-4" /> Delete Member
                    </button>
                  </div>
                </div>
              )}

              {/* Bottom spacing for safe area */}
              <div className="h-8" />
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Mobile Filter Sheet - iOS Style */}
      {isMobile && (
        <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
          <SheetContent 
            side="bottom" 
            className="rounded-t-3xl bg-slate-50 p-0"
            hideCloseButton
          >
            {/* iOS Drag Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-slate-300 rounded-full" />
            </div>
            
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white">
              <button 
                onClick={() => setShowMobileFilters(false)}
                className="text-primary font-medium text-base active:opacity-70"
              >
                Cancel
              </button>
              <span className="font-semibold text-slate-900">Filter Team</span>
              <button 
                onClick={() => setShowMobileFilters(false)}
                className="text-primary font-semibold text-base active:opacity-70"
              >
                Done
              </button>
            </div>

            <div className="p-4 space-y-3 pb-8">
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <button
                  className={`w-full text-left px-4 py-4 flex items-center justify-between transition-colors ${
                    selectedFilter === "all" ? "bg-primary/5" : ""
                  }`}
                  onClick={() => {
                    setSelectedFilter("all");
                    setShowMobileFilters(false);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-slate-600" />
                    </div>
                    <span className="font-medium text-slate-900">All Members</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">{filters.all}</span>
                    {selectedFilter === "all" && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </button>
                <div className="h-px bg-slate-100 ml-16" />
                <button
                  className={`w-full text-left px-4 py-4 flex items-center justify-between transition-colors ${
                    selectedFilter === "lawyer" ? "bg-primary/5" : ""
                  }`}
                  onClick={() => {
                    setSelectedFilter("lawyer");
                    setShowMobileFilters(false);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-sky-600" />
                    </div>
                    <span className="font-medium text-slate-900">Lawyers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">{filters.lawyer}</span>
                    {selectedFilter === "lawyer" && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </button>
                <div className="h-px bg-slate-100 ml-16" />
                <button
                  className={`w-full text-left px-4 py-4 flex items-center justify-between transition-colors ${
                    selectedFilter === "paralegal" ? "bg-primary/5" : ""
                  }`}
                  onClick={() => {
                    setSelectedFilter("paralegal");
                    setShowMobileFilters(false);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center">
                      <User className="w-5 h-5 text-violet-600" />
                    </div>
                    <span className="font-medium text-slate-900">Paralegals</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">{filters.paralegal}</span>
                    {selectedFilter === "paralegal" && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Dialogs */}
      <AddTeamMemberDialog 
        open={addMemberOpen} 
        onOpenChange={setAddMemberOpen} 
      />
      <EditTeamMemberDialog 
        open={editMemberOpen} 
        onOpenChange={setEditMemberOpen}
        member={selectedMember}
      />
      <DeleteTeamMemberDialog 
        open={deleteMemberOpen} 
        onOpenChange={setDeleteMemberOpen}
        member={selectedMember}
      />
      <ResetPasswordDialog 
        open={resetPasswordOpen} 
        onOpenChange={setResetPasswordOpen}
        member={selectedMember}
      />
      <ReactivateTeamMemberDialog 
        open={reactivateMemberOpen} 
        onOpenChange={setReactivateMemberOpen}
        member={selectedMember}
      />
    </>
  );

  if (isMobile) {
    return (
      <MobilePageContainer>
        <MobileHeader title="Team Directory" />
        <div className="space-y-4 pb-6">
          {mainContent}
        </div>
        {canAddMembers && (
          <MobileFAB 
            onClick={() => setAddMemberOpen(true)}
            icon={UserPlus}
            label="Add Member"
          />
        )}
        
      </MobilePageContainer>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {mainContent}
    </div>
  );
}
function FilterBadge({
  label,
  count,
  selected,
  onClick
}: {
  label: string;
  count: number;
  selected?: boolean;
  onClick?: () => void;
}) {
  return <button className={`rounded-full px-4 py-1 text-sm font-medium border 
        ${selected ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:bg-muted/80"} 
        transition-colors`} type="button" onClick={onClick}>
      {label} <span className="ml-1 opacity-75">{count}</span>
    </button>;
}

// Case Count Cell Component
function CaseCountCell({ memberId }: { memberId: string }) {
  const { data: stats } = useTeamMemberStats(memberId);
  return (
    <span className="text-base font-body text-default-font">
      {stats?.caseCount || 0}
    </span>
  );
}

// Utility: Initials from name
function getInitials(name?: string): string {
  if (!name) return "";
  return name.split(" ").filter(s => s.length > 0).map(s => s[0]).join("").substring(0, 2).toUpperCase();
}
function DataFieldHorizontal({
  icon,
  label,
  children
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return <div className="flex items-center gap-2">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-xs text-muted-foreground min-w-[56px]">{label}</span>
      {children}
    </div>;
}
export default TeamDirectory;
