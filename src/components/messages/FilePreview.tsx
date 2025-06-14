
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Download } from "lucide-react";

interface FilePreviewProps {
  fileUrl: string;
}

export const FilePreview: React.FC<FilePreviewProps> = ({ fileUrl }) => {
  const [publicUrl, setPublicUrl] = useState<string | null>(null);

  // Get download URL for Supabase Storage private objects
  useEffect(() => {
    const getUrl = async () => {
      const { data } = supabase.storage.from("message_attachments").getPublicUrl(fileUrl);
      setPublicUrl(data.publicUrl);
    };
    getUrl();
  }, [fileUrl]);

  if (!publicUrl) return <div className="text-xs text-gray-400">Attachment unavailable</div>;

  const ext = fileUrl.slice(fileUrl.lastIndexOf(".") + 1).toLowerCase();
  if (
    [
      "jpg",
      "jpeg",
      "png",
      "webp",
      "gif",
      "bmp",
      "svg",
      "ico"
    ].includes(ext)
  ) {
    return (
      <a
        href={publicUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <img
          src={publicUrl}
          alt="attachment"
          className="rounded h-32 max-w-xs object-contain border border-gray-200"
        />
      </a>
    );
  }
  // PDF/doc
  if (["pdf", "doc", "docx", "xls", "xlsx", "txt"].includes(ext)) {
    return (
      <a
        href={publicUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-blue-600 hover:underline"
      >
        <Download className="w-4 h-4" />
        <span className="truncate">Download file</span>
      </a>
    );
  }
  // Fallback
  return (
    <a
      href={publicUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 text-blue-600 hover:underline"
    >
      <Download className="w-4 h-4" />
      <span className="truncate">Open attachment</span>
    </a>
  );
};
