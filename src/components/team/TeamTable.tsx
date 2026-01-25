
import React from "react";
import { useTeamMembers } from "./useTeamMembers";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";

const statusColor: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  onboarding: "bg-blue-100 text-blue-800",
  inactive: "bg-slate-100 text-slate-500",
  invited: "bg-blue-50 text-blue-700",
  suspended: "bg-red-50 text-red-700",
};

const roleColor: Record<string, string> = {
  admin: "bg-primary text-white",
  lawyer: "bg-blue-200 text-blue-900",
  paralegal: "bg-yellow-100 text-yellow-900",
  office_staff: "bg-indigo-100 text-indigo-900",
};

function AvatarCell({ avatar_url, name }: { avatar_url?: string; name: string }) {
  if (avatar_url) {
    return (
      <img
        src={avatar_url}
        alt={name}
        className="w-8 h-8 rounded-full object-cover border"
      />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-accent-blue flex items-center justify-center border">
      <User className="w-4 h-4 text-primary" />
    </div>
  );
}

const TeamTable = () => {
  const { data, isLoading, error } = useTeamMembers();

  if (isLoading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[1, 2, 3].map((i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="w-36 h-6" /></TableCell>
              <TableCell><Skeleton className="w-44 h-6" /></TableCell>
              <TableCell><Skeleton className="w-20 h-6" /></TableCell>
              <TableCell><Skeleton className="w-16 h-6" /></TableCell>
              <TableCell><Skeleton className="w-20 h-6" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  if (error) {
    return <p className="text-destructive font-medium px-3 py-4">Error loading team members.</p>;
  }

  if (!data || data.length === 0) {
    return <p className="text-muted-foreground py-8 px-4">No team members found.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-20">Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Joined</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((member: any) => (
          <TableRow key={member.id}>
            <TableCell className="flex items-center gap-3">
              <AvatarCell avatar_url={member.avatar_url} name={member.full_name} />
              <div>
                <div className="text-base font-medium">{member.full_name}</div>
                {member.phone_number && (
                  <div className="text-xs text-muted-foreground">{member.phone_number}</div>
                )}
              </div>
            </TableCell>
            <TableCell>
              <span>{member.email}</span>
            </TableCell>
            <TableCell>
              <Badge className={`rounded-full px-3 py-1 text-xs font-medium ${roleColor[member.role] || "bg-slate-100 text-slate-900"}`}>
                {member.role.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge className={`rounded-full px-3 py-1 text-xs ${statusColor[member.status] || "bg-slate-100 text-slate-900"}`}>
                {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
              </Badge>
            </TableCell>
            <TableCell>
              <span>
                {member.join_date
                  ? new Date(member.join_date).toLocaleDateString()
                  : member.joined_at
                  ? new Date(member.joined_at).toLocaleDateString()
                  : "-"}
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default TeamTable;
