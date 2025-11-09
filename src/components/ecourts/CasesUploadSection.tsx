import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Download, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";

interface UploadResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
}

interface CasesUploadSectionProps {
  onUploadComplete: () => void;
}

export const CasesUploadSection = ({ onUploadComplete }: CasesUploadSectionProps) => {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const { toast } = useToast();

  const downloadTemplate = () => {
    try {
      const template = [
        {
          case_title: "Example: ABC vs XYZ",
          cnr_number: "GJHC010012342025",
          forum: "High Court",
          client_name: "John Doe",
          case_number: "123/2024",
          description: "Sample case description"
        }
      ];

      const ws = XLSX.utils.json_to_sheet(template);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Cases Template");
      
      // Use writeFile which handles browser downloads
      XLSX.writeFile(wb, "cases_upload_template.xlsx", { bookType: 'xlsx' });

      toast({
        title: "Template downloaded",
        description: "Fill in the template. Forum must be: High Court, District Court, or Supreme Court",
      });
    } catch (error: any) {
      toast({
        title: "Download failed",
        description: error.message || "Could not download template",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setResult(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Get current user's firm_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: teamMember } = await supabase
        .from("team_members")
        .select("firm_id")
        .eq("user_id", user.id)
        .single();

      if (!teamMember) throw new Error("No firm found");

      const uploadResult: UploadResult = {
        success: 0,
        failed: 0,
        errors: []
      };

      const successfulCases: Array<{ id: string; cnr: string; courtType: string }> = [];

      // Get all clients for name matching
      const { data: clients } = await supabase
        .from("clients")
        .select("id, full_name")
        .eq("firm_id", teamMember.firm_id);

      for (let i = 0; i < jsonData.length; i++) {
        const row: any = jsonData[i];
        const rowNum = i + 2; // Excel rows start at 1, plus header

        try {
          // Validate required fields
          if (!row.case_title) {
            throw new Error("Missing case_title");
          }
          if (!row.cnr_number) {
            throw new Error("Missing cnr_number");
          }
          if (!row.forum) {
            throw new Error("Missing forum (court type)");
          }

          // Map forum to court_type for storage
          const forumLower = row.forum.toLowerCase();
          let courtType = "";
          if (forumLower.includes("high")) {
            courtType = "High Court";
          } else if (forumLower.includes("district")) {
            courtType = "District Court";
          } else if (forumLower.includes("supreme")) {
            courtType = "Supreme Court";
          } else {
            throw new Error("Invalid forum. Must be: High Court, District Court, or Supreme Court");
          }

          // Find matching client by name (case-insensitive)
          let clientId = null;
          if (row.client_name && clients) {
            const matchedClient = clients.find(
              c => c.full_name.toLowerCase() === row.client_name.toLowerCase()
            );
            clientId = matchedClient?.id || null;
          }

          // Insert case
          const { data: insertedCase, error } = await supabase
            .from("cases")
            .insert({
              title: row.case_title,
              case_title: row.case_title,
              cnr_number: row.cnr_number,
              court_type: courtType,
              court_name: courtType,
              case_number: row.case_number || null,
              description: row.description || null,
              client_id: clientId,
              firm_id: teamMember.firm_id,
              created_by: user.id,
              status: 'open'
            })
            .select('id')
            .single();

          if (error) throw error;

          if (insertedCase) {
            successfulCases.push({
              id: insertedCase.id,
              cnr: row.cnr_number,
              courtType: courtType
            });
          }

          uploadResult.success++;
        } catch (error: any) {
          uploadResult.failed++;
          uploadResult.errors.push({
            row: rowNum,
            message: error.message || "Unknown error"
          });
        }
      }

      setResult(uploadResult);

      // Auto-add to fetch queue
      if (successfulCases.length > 0) {
        const batchId = crypto.randomUUID();
        
        const { error: queueError } = await supabase
          .from('case_fetch_queue')
          .insert(
            successfulCases.map(c => ({
              case_id: c.id,
              cnr_number: c.cnr,
              court_type: c.courtType,
              firm_id: teamMember.firm_id,
              created_by: user.id,
              priority: 5,
              batch_id: batchId,
              metadata: { triggered_by: 'bulk_upload' }
            }))
          );

        if (!queueError) {
          toast({
            title: "Upload complete",
            description: `${uploadResult.success} case(s) uploaded and queued for fetching`,
          });
        } else {
          toast({
            title: "Upload complete",
            description: `${uploadResult.success} case(s) uploaded (queue error: ${queueError.message})`,
          });
        }
        onUploadComplete();
      }

      if (uploadResult.failed > 0) {
        toast({
          title: "Some cases failed to upload",
          description: `${uploadResult.failed} case(s) had errors. See details below.`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold mb-2">Upload Cases in Bulk</h3>
          <p className="text-sm text-muted-foreground">
            Download the template, fill in: <strong>case_title</strong>, <strong>cnr_number</strong>, <strong>forum</strong> (High Court/District Court/Supreme Court), <strong>client_name</strong> (optional), case_number, description. Then upload.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={downloadTemplate}
            disabled={uploading}
          >
            <Download className="mr-2 h-4 w-4" />
            Download Template
          </Button>

          <label htmlFor="file-upload">
            <Button
              variant="default"
              disabled={uploading}
              asChild
            >
              <span>
                <Upload className="mr-2 h-4 w-4" />
                {uploading ? "Uploading..." : "Upload Excel"}
              </span>
            </Button>
          </label>
          <input
            id="file-upload"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {result && (
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-4">
              {result.success > 0 && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">{result.success} successful</span>
                </div>
              )}
              {result.failed > 0 && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">{result.failed} failed</span>
                </div>
              )}
            </div>

            {result.errors.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Errors:</p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {result.errors.map((error, idx) => (
                    <div key={idx} className="text-sm text-red-600">
                      Row {error.row}: {error.message}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
