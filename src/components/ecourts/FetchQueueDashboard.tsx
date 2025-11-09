import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Play, 
  Trash2, 
  RefreshCw, 
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  FileText,
  Plug
} from "lucide-react";
import { useFetchQueue, QueueItem } from "@/hooks/useFetchQueue";
import { useLegalkartIntegration } from "@/hooks/useLegalkartIntegration";
import { useNavigate } from "react-router-dom";
import TimeUtils from "@/lib/timeUtils";

export const FetchQueueDashboard = () => {
  const navigate = useNavigate();
  const {
    queueItems,
    stats,
    isLoading,
    processQueue,
    updateQueueItem,
    deleteQueueItems,
    retryFailed,
    clearCompleted,
    queueAllEligible,
    stopProcessing,
  } = useFetchQueue();

  const { authenticate } = useLegalkartIntegration();

  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [errorDialog, setErrorDialog] = useState<{ open: boolean; error?: string }>({ open: false });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      queued: { variant: "outline", icon: Clock, label: "Queued" },
      processing: { variant: "default", icon: Loader2, label: "Processing" },
      completed: { variant: "default", icon: CheckCircle2, label: "Completed" },
      failed: { variant: "destructive", icon: XCircle, label: "Failed" },
    };

    const config = variants[status] || variants.queued;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className={`h-3 w-3 ${status === 'processing' ? 'animate-spin' : ''}`} />
        {config.label}
      </Badge>
    );
  };

  const filteredItems = queueItems.filter(item => {
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        item.cnr_number.toLowerCase().includes(query) ||
        item.cases?.case_title?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const progressPercentage = stats.total > 0 
    ? ((stats.completed / stats.total) * 100).toFixed(1)
    : 0;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(filteredItems.map(item => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedItems(newSelected);
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.size === 0) return;
    await deleteQueueItems.mutateAsync(Array.from(selectedItems));
    setSelectedItems(new Set());
  };

  const handleRetryItem = async (id: string) => {
    await updateQueueItem.mutateAsync({
      id,
      updates: { 
        status: 'queued',
        next_retry_at: new Date().toISOString()
      }
    });
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Fetch Queue Manager</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Monitor and control case fetch operations
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => authenticate.mutateAsync()}
              disabled={authenticate.isPending}
            >
              {authenticate.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Testing...</>
              ) : (
                <><Plug className="mr-2 h-4 w-4" /> Test Connection</>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => queueAllEligible.mutateAsync()}
              disabled={queueAllEligible.isPending}
            >
              {queueAllEligible.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Queueing...</>
              ) : (
                <><Play className="mr-2 h-4 w-4" /> Queue All Eligible</>
              )}
            </Button>
            {stats.processing > 0 && (
              <Button
                variant="destructive"
                onClick={() => stopProcessing.mutateAsync()}
                disabled={stopProcessing.isPending}
              >
                {stopProcessing.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Stopping...</>
                ) : (
                  <><XCircle className="mr-2 h-4 w-4" /> Stop Processing</>
                )}
              </Button>
            )}
            <Button
              onClick={() => processQueue.mutateAsync({ batch_size: 10, delay_ms: 1500 })}
              disabled={processQueue.isPending || stats.queued === 0}
            >
              {processQueue.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
              ) : (
                <><Play className="mr-2 h-4 w-4" /> Process Now</>
              )}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary rounded-lg">
                <Clock className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.queued}</p>
                <p className="text-sm text-muted-foreground">Queued</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <Loader2 className="h-5 w-5 text-primary-foreground animate-spin" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.processing}</p>
                <p className="text-sm text-muted-foreground">Processing</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive rounded-lg">
                <XCircle className="h-5 w-5 text-destructive-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.failed}</p>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Progress Bar */}
        {stats.total > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-medium">{progressPercentage}% ({stats.completed}/{stats.total})</span>
            </div>
            <Progress value={Number(progressPercentage)} className="h-2" />
          </div>
        )}

        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by CNR or case title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="queued">Queued</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => retryFailed.mutateAsync()}
            disabled={stats.failed === 0 || retryFailed.isPending}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry Failed
          </Button>
          <Button
            variant="outline"
            onClick={() => clearCompleted.mutateAsync()}
            disabled={stats.completed === 0 || clearCompleted.isPending}
          >
            Clear Completed
          </Button>
        </div>

        {/* Bulk Actions */}
        {selectedItems.size > 0 && (
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">{selectedItems.size} selected</span>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDeleteSelected}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove
            </Button>
          </div>
        )}

        {/* Queue Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Case Details</TableHead>
                <TableHead>CNR Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Retry</TableHead>
                <TableHead>Queued At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No items in queue
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item: QueueItem) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedItems.has(item.id)}
                        onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{item.cases?.case_title || 'Unknown Case'}</p>
                        {item.cases?.case_number && (
                          <p className="text-xs text-muted-foreground">{item.cases.case_number}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{item.cnr_number}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {item.retry_count}/{item.max_retries}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {TimeUtils.formatDateTime(item.queued_at, 'dd/MM/yyyy hh:mm a')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        {item.last_error && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setErrorDialog({ open: true, error: item.last_error })}
                          >
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                        {item.status === 'failed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRetryItem(item.id)}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/cases/${item.case_id}`)}
                        >
                          <FileText className="h-4 w-4" />
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

      {/* Error Dialog */}
      <Dialog open={errorDialog.open} onOpenChange={(open) => setErrorDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Error Details</DialogTitle>
            <DialogDescription>
              Details about why the fetch failed
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
            <p className="text-sm text-destructive">{errorDialog.error}</p>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};