import React, { useState } from "react";
import { uploadToPydio } from "../lib/supabaseUpload";

export default function ClientDocuments({ clientId, caseId }: { clientId: string, caseId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("");

  async function handleUpload() {
    if (!file || !docType) return alert("Please select file and doc type");

    try {
      const result = await uploadToPydio({
        clientName: clientId,
        caseName: caseId,
        docType,
        file,
      });

      alert("✅ File uploaded successfully!");
      console.log(result);
    } catch (err: any) {
      alert("❌ Upload failed: " + err.message);
    }
  }

  return (
    <div>
      <select value={docType} onChange={(e) => setDocType(e.target.value)}>
        <option value="">Select Document Type</option>
        <option value="Contracts">Contracts</option>
        <option value="Affidavits">Affidavits</option>
        <option value="CourtOrders">Court Orders</option>
        <option value="Pleadings">Pleadings</option>
        <option value="Evidence">Evidence</option>
      </select>

      <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <button onClick={handleUpload}>Upload File</button>
    </div>
  );
}