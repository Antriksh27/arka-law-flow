import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, CheckCircle2, XCircle, Eye, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface FetchHistory {
  id: string;
  created_at: string;
  search_type: string;
  status?: string;
  error_message?: string;
  response_data?: any;
}

interface FetchHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseTitle: string;
  history: FetchHistory[];
  onRetry: (searchType: string) => void;
}

export const FetchHistoryModal = ({
  open,
  onOpenChange,
  caseTitle,
  history,
  onRetry,
}: FetchHistoryModalProps) => {
  const [viewingJson, setViewingJson] = useState<any>(null);

  const getStatusBadge = (status?: string, errorMessage?: string) => {
    if (errorMessage) {
      return <Badge variant="error">Failed</Badge>;
    }
    if (status === "success") {
      return <Badge variant="success">Success</Badge>;
    }
    return <Badge variant="default">Completed</Badge>;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Fetch History: {caseTitle}</DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[500px] pr-4">
            {history.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No fetch attempts yet
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {format(new Date(item.created_at), "PPp")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            Search Type:{" "}
                            <span className="font-normal capitalize">
                              {item.search_type.replace("_", " ")}
                            </span>
                          </span>
                        </div>
                      </div>
                      {getStatusBadge(item.status, item.error_message)}
                    </div>

                    {item.error_message && (
                      <div className="bg-red-50 border border-red-200 rounded p-3">
                        <p className="text-sm text-red-600">
                          {item.error_message}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {item.response_data && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setViewingJson(item.response_data)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Response
                        </Button>
                      )}
                      {item.error_message && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onRetry(item.search_type)}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Retry
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* JSON Viewer Dialog */}
      <Dialog open={!!viewingJson} onOpenChange={() => setViewingJson(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Response Data</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[600px]">
            <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
              {JSON.stringify(viewingJson, null, 2)}
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};
