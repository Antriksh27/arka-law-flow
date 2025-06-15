
import React, { useMemo, useState } from "react";
import { useTeamMembers } from "@/components/team/useTeamMembers";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogHeader, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

import {
  FeatherUserPlus,
  FeatherSearch,
  FeatherCheck,
  FeatherMail,
  FeatherPhone,
  FeatherMoreHorizontal,
  FeatherUser,
  FeatherBriefcase,
  FeatherCheckSquare,
  FeatherSettings,
  FeatherX,
  FeatherCalendar
} from "lucide-react";

const roleLabels: Record<string, string> = {
  admin: "Admin",
  lawyer: "Lawyer",
  paralegal: "Paralegal",
  junior: "Junior",
  office_staff: "Office Staff",
};
const roleOrder = ["lawyer", "paralegal", "junior"];

function TeamDirectory() {
  const { data = [], isLoading } = useTeamMembers();
  const [search, setSearch] = useState("");
  const [sidebarMember, setSidebarMember] = useState<any | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return !q
      ? data
      : data.filter(
          (m: any) =>
            m.full_name?.toLowerCase().includes(q) ||
            m.email?.toLowerCase().includes(q)
        );
  }, [search, data]);

  const filters = useMemo(() => {
    let stats = { all: 0, lawyer: 0, paralegal: 0, junior: 0 };
    data.forEach((m: any) => {
      stats.all++;
      if (m.role === "lawyer") stats.lawyer++;
      if (m.role === "paralegal") stats.paralegal++;
      if (m.role === "junior") stats.junior++;
    });
    return stats;
  }, [data]);

  // Show selected member details (null = none)
  const detailMember = sidebarMember || filtered[0] || null;

  return (
    <div className="container max-w-none flex h-full w-full flex-col items-start gap-6 bg-background py-12">
      {/* Header + Actions */}
      <div className="flex w-full flex-col items-start gap-4">
        <div className="flex w-full items-center justify-between">
          <div className="flex flex-col items-start gap-2">
            <span className="text-2xl font-semibold text-gray-900">
              Team Directory
            </span>
            <span className="text-base text-muted-foreground">
              Manage your firm's team and collaboration
            </span>
          </div>
          <Button variant="default" className="gap-2" size="default">
            <FeatherUserPlus className="w-5 h-5" />
            Add New Member
          </Button>
        </div>
        <div className="flex w-full flex-wrap items-center gap-4">
          {/* Search */}
          <div className="h-auto w-80 flex-none">
            <div className="relative">
              <FeatherSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                className="w-full rounded-lg bg-gray-100 pl-10 pr-4 py-2 text-sm border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition placeholder:text-gray-500"
                placeholder="Search team members..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          {/* Filter badges */}
          <div className="flex items-center gap-2">
            <FilterBadge
              label="All"
              count={filters.all}
              selected={true}
              onClick={() => {}}
            />
            <FilterBadge
              label="Lawyers"
              count={filters.lawyer}
              selected={false}
              onClick={() => {}}
            />
            <FilterBadge
              label="Paralegals"
              count={filters.paralegal}
              selected={false}
              onClick={() => {}}
            />
            <FilterBadge
              label="Juniors"
              count={filters.junior}
              selected={false}
              onClick={() => {}}
            />
          </div>
        </div>
      </div>
      {/* Main table + details */}
      <div className="flex w-full items-start gap-6">
        {/* Team Table */}
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
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-11 w-full rounded-lg" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <span className="text-sm text-muted-foreground block px-2 py-6 text-center">No team members found.</span>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((member: any) => (
                    <TableRow
                      key={member.id}
                      className="cursor-pointer"
                      onClick={() => setSidebarMember(member)}
                      data-selected={detailMember?.id === member.id}
                    >
                      {/* Member Avatar, Name, Email */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8" src={member.avatar_url} alt={member.full_name}>
                            {getInitials(member.full_name)}
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
                        <Badge
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            member.status === "active"
                              ? "bg-green-100 text-green-800"
                              : member.status === "inactive"
                              ? "bg-gray-100 text-gray-500"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                        </Badge>
                      </TableCell>
                      {/* Dummy Cases Count */}
                      <TableCell>
                        <span className="text-base font-body text-default-font">{Math.floor(Math.random() * 15) + 4}</span>
                      </TableCell>
                      {/* Contact Buttons */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {member.email && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={e => {
                                e.stopPropagation();
                                window.open(`mailto:${member.email}`);
                              }}
                            >
                              <FeatherMail className="w-4 h-4" />
                            </Button>
                          )}
                          {member.phone_number && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={e => {
                                e.stopPropagation();
                                window.open(`tel:${member.phone_number}`);
                              }}
                            >
                              <FeatherPhone className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      {/* Row Actions */}
                      <TableCell>
                        <div className="flex grow shrink-0 basis-0 items-center justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={e => e.stopPropagation()}
                              >
                                <FeatherMoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSidebarMember(member)}>
                                <FeatherUser className="w-4 h-4 mr-2" /> View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <FeatherBriefcase className="w-4 h-4 mr-2" /> Assign to Case
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <FeatherCheckSquare className="w-4 h-4 mr-2" /> Assign Task
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <FeatherSettings className="w-4 h-4 mr-2" /> Manage Role
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        {/* Details sidebar */}
        <div className="flex w-80 flex-none flex-col items-start gap-6">
          {!detailMember ? (
            <span className="text-sm text-muted-foreground">Select a team member to view details</span>
          ) : (
            <div className="flex w-full flex-col items-start gap-4 rounded-lg border border-solid border-gray-200 bg-white px-6 py-6">
              <div className="flex w-full items-center justify-between">
                <span className="text-xl font-semibold text-gray-900">
                  Member Details
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarMember(null)}
                >
                  <FeatherX className="w-5 h-5" />
                </Button>
              </div>
              <div className="flex w-full flex-col items-start gap-4">
                <div className="flex w-full items-center gap-4">
                  <Avatar className="w-12 h-12" src={detailMember.avatar_url} alt={detailMember.full_name}>
                    {getInitials(detailMember.full_name)}
                  </Avatar>
                  <div className="flex flex-col items-start">
                    <span className="font-medium text-gray-900">
                      {detailMember.full_name}
                    </span>
                    <Badge className="mt-1">{roleLabels[detailMember.role] || detailMember.role}</Badge>
                  </div>
                </div>
                <div className="flex w-full flex-col items-start gap-2">
                  <DataFieldHorizontal icon={<FeatherMail className="w-4 h-4" />} label="Email">
                    <span className="text-sm text-gray-900">
                      {detailMember.email}
                    </span>
                  </DataFieldHorizontal>
                  <DataFieldHorizontal icon={<FeatherPhone className="w-4 h-4" />} label="Phone">
                    <span className="text-sm text-gray-900">
                      {detailMember.phone_number || "-"}
                    </span>
                  </DataFieldHorizontal>
                  <DataFieldHorizontal icon={<FeatherCalendar className="w-4 h-4" />} label="Joined">
                    <span className="text-sm text-gray-900">
                      {detailMember.join_date || (detailMember.joined_at ? new Date(detailMember.joined_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : "-")}
                    </span>
                  </DataFieldHorizontal>
                </div>
              </div>
              {/* Placeholders for active cases */}
              <div className="flex w-full flex-col items-start gap-2">
                <span className="font-medium text-gray-900">
                  Active Cases
                </span>
                <div className="flex w-full flex-col items-start">
                  <div className="flex w-full items-center justify-between border-b border-solid border-gray-200 px-2 py-3">
                    <span className="text-sm text-gray-900">
                      Placeholder vs Placeholder
                    </span>
                    <Badge variant="outline">In Court</Badge>
                  </div>
                  <div className="flex w-full items-center justify-between border-b border-solid border-gray-200 px-2 py-3">
                    <span className="text-sm text-gray-900">
                      Placeholder Holdings
                    </span>
                    <Badge variant="outline">Review</Badge>
                  </div>
                </div>
              </div>
              {/* Member permissions */}
              <div className="flex w-full flex-col items-start gap-2">
                <span className="font-medium text-gray-900">Permissions</span>
                <div className="flex w-full flex-col items-start gap-2">
                  <Checkbox checked={false} id="assign-tasks">
                    <span className="text-sm text-gray-900 ml-2">Can assign tasks</span>
                  </Checkbox>
                  <Checkbox checked={false} id="upload-documents">
                    <span className="text-sm text-gray-900 ml-2">Can upload documents</span>
                  </Checkbox>
                  <Checkbox checked={false} id="manage-team">
                    <span className="text-sm text-gray-900 ml-2">Can manage team</span>
                  </Checkbox>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterBadge({ label, count, selected, onClick }: { label: string; count: number; selected?: boolean; onClick?: () => void }) {
  return (
    <button
      className={`rounded-full px-4 py-1 text-sm font-medium border 
        ${selected ? "bg-primary text-white" : "bg-gray-100 text-gray-800 border-gray-200"} 
        transition-colors hover:bg-primary/10`}
      type="button"
      onClick={onClick}
    >
      {label} <span className="ml-1 opacity-75">{count}</span>
    </button>
  );
}

function DropdownMenu({ children }: { children: React.ReactNode }) {
  // Simple dropdown stub; replace with shadcn/ui dropdown if available.
  return <div className="relative">{children}</div>;
}
function DropdownMenuTrigger({ asChild, children }: { asChild?: boolean; children: React.ReactNode }) {
  return children;
}
function DropdownMenuContent({ align, children }: { align?: string; children: React.ReactNode }) {
  return <div className="absolute right-0 mt-2 min-w-[170px] z-50 bg-white rounded-xl shadow border px-1 py-2">{children}</div>;
}
function DropdownMenuItem({ children, ...props }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <div
      className="flex items-center px-3 py-2 rounded-lg hover:bg-accent hover:text-primary cursor-pointer text-sm"
      {...props}
    >
      {children}
    </div>
  );
}
function DropdownMenuSeparator() {
  return <div className="my-1 border-t border-gray-100"></div>;
}

// Utility: Initials from name
function getInitials(name?: string): string {
  if (!name) return "";
  return name
    .split(" ")
    .map(s => s[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

function DataFieldHorizontal({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-400">{icon}</span>
      <span className="text-xs text-gray-600 min-w-[56px]">{label}</span>
      {children}
    </div>
  );
}

export default TeamDirectory;

