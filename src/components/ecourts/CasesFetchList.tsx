import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Download, History, Loader2, Search, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CaseWithFetchStatus, useCasesFetchStatus } from "@/hooks/useCasesFetchStatus";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { FetchHistoryModal } from "./FetchHistoryModal";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface CasesFetchListProps {
  onFetchCase: (caseId: string, cnrNumber: string, courtType: string) => void;
  isFetching: boolean;
  selectedCases: Set<string>;
  onSelectedCasesChange: (selected: Set<string>) => void;
}

export const CasesFetchList = ({ onFetchCase, isFetching, selectedCases, onSelectedCasesChange }: CasesFetchListProps) => {
  const { data, isLoading } = useCasesFetchStatus();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [courtFilter, setCourtFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [historyCase, setHistoryCase] = useState<CaseWithFetchStatus | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch history for the selected case
  const { data: historyData } = useQuery({
    queryKey: ["case-fetch-history", historyCase?.id],
    queryFn: async () => {
      if (!historyCase) return [];
      const { data, error } = await supabase
        .from("legalkart_case_searches")
        .select("*")
        .eq("case_id", historyCase.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!historyCase,
  });

  const cases = data?.cases || [];
  const counts = data?.counts || {
    not_fetched: 0,
    success: 0,
    failed: 0,
    pending: 0,
    total: 0,
  };

  // Get unique court names for filter
  const courtNames = useMemo(() => {
    const names = new Set(cases.map((c) => c.court_name).filter(Boolean));
    return Array.from(names);
  }, [cases]);

  // Filter cases
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      // Status filter
      if (statusFilter !== "all" && c.fetch_status !== statusFilter) {
        return false;
      }

      // Court filter
      if (courtFilter !== "all" && c.court_name !== courtFilter) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          c.case_title.toLowerCase().includes(query) ||
          c.cnr_number.toLowerCase().includes(query) ||
          c.case_number?.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [cases, statusFilter, courtFilter, searchQuery]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectedCasesChange(new Set(filteredCases.map((c) => c.id)));
    } else {
      onSelectedCasesChange(new Set());
    }
  };

  const handleSelectCase = (caseId: string, checked: boolean) => {
    const newSelected = new Set(selectedCases);
    if (checked) {
      newSelected.add(caseId);
    } else {
      newSelected.delete(caseId);
    }
    onSelectedCasesChange(newSelected);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: text,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "not_fetched":
        return <Badge variant="default">Not Fetched</Badge>;
      case "success":
        return <Badge variant="success">Success</Badge>;
      case "failed":
        return <Badge variant="error">Failed</Badge>;
      case "pending":
        return <Badge variant="warning">Pending</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const handleRetryFetch = (searchType: string) => {
    if (historyCase) {
      onFetchCase(historyCase.id, historyCase.cnr_number, historyCase.court_type || "");
      setHistoryCase(null);
    }
  };

  const deleteCasesMutation = useMutation({
    mutationFn: async (caseIds: string[]) => {
      const { data, error } = await supabase.rpc('delete_cases_and_dependencies', {
        p_case_ids: caseIds
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cases-fetch-status"] });
      toast({
        title: "Cases deleted",
        description: `${selectedCases.size} case(s) deleted successfully`,
      });
      onSelectedCasesChange(new Set());
      setShowDeleteDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete cases",
        variant: "destructive",
      });
    },
  });

  const handleDeleteSelected = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    deleteCasesMutation.mutate(Array.from(selectedCases));
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        <div className="space-y-4">
          {/* Header with stats */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">
                Cases Ready for Fetch ({counts.total})
              </h3>
              <div className="flex gap-3 mt-2">
                <span className="text-sm text-muted-foreground">
                  Not Fetched: {counts.not_fetched}
                </span>
                <span className="text-sm text-green-600">
                  Success: {counts.success}
                </span>
                <span className="text-sm text-red-600">
                  Failed: {counts.failed}
                </span>
              </div>
            </div>
            {selectedCases.size > 0 && (
              <div className="flex items-center gap-3">
                <div className="text-sm text-muted-foreground">
                  {selectedCases.size} selected
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteSelected}
                  disabled={deleteCasesMutation.isPending}
                >
                  {deleteCasesMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Delete Selected
                </Button>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by case title or CNR..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="not_fetched">Not Fetched</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={courtFilter} onValueChange={setCourtFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by court" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courts</SelectItem>
                {courtNames.map((name) => (
                  <SelectItem key={name} value={name!}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        filteredCases.length > 0 &&
                        selectedCases.size === filteredCases.length
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Case Title</TableHead>
                  <TableHead>CNR Number</TableHead>
                  <TableHead>Forum</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Fetched</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No cases found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCases.map((caseItem) => (
                    <TableRow key={caseItem.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedCases.has(caseItem.id)}
                          onCheckedChange={(checked) =>
                            handleSelectCase(caseItem.id, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => navigate(`/cases/${caseItem.id}`)}
                          className="text-primary hover:underline text-left"
                        >
                          {caseItem.case_title}
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">
                            {caseItem.cnr_number}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopy(caseItem.cnr_number)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{caseItem.court_name || "-"}</TableCell>
                      <TableCell>
                        {caseItem.client_name ? (
                          <button
                            onClick={() =>
                              navigate(`/clients/${caseItem.client_id}`)
                            }
                            className="text-primary hover:underline"
                          >
                            {caseItem.client_name}
                          </button>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(caseItem.fetch_status)}</TableCell>
                      <TableCell>
                        {caseItem.last_fetched_at
                          ? format(new Date(caseItem.last_fetched_at), "PPp")
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              onFetchCase(
                                caseItem.id,
                                caseItem.cnr_number,
                                caseItem.court_type || ""
                              )
                            }
                            disabled={isFetching}
                          >
                            {isFetching ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setHistoryCase(caseItem)}
                          >
                            <History className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </Card>

      {historyCase && (
        <FetchHistoryModal
          open={!!historyCase}
          onOpenChange={(open) => !open && setHistoryCase(null)}
          caseTitle={historyCase.case_title}
          history={historyData || []}
          onRetry={handleRetryFetch}
        />
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Cases</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedCases.size} case(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
