import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { uploadFileToWebDAV } from '@/lib/pydioIntegration';

interface Client {
  id: string;
  full_name: string;
}

interface Case {
  id: string;
  case_title: string;
  client_id: string;
}

export default function ClientDocuments() {
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch clients on component mount
  useEffect(() => {
    async function fetchClients() {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('id, full_name')
          .order('full_name');

        if (error) throw error;
        setClients(data || []);
      } catch (error) {
        console.error('Error fetching clients:', error);
        alert('Failed to fetch clients');
      } finally {
        setLoading(false);
      }
    }

    fetchClients();
  }, []);

  // Fetch cases when client is selected
  useEffect(() => {
    async function fetchCases() {
      if (!selectedClientId) {
        setCases([]);
        setSelectedCaseId("");
        return;
      }

      try {
        const { data, error } = await supabase
          .from('cases')
          .select('id, case_title, client_id')
          .eq('client_id', selectedClientId)
          .order('title');

        if (error) throw error;
        setCases(data || []);
        setSelectedCaseId(""); // Reset case selection when client changes
      } catch (error) {
        console.error('Error fetching cases:', error);
        alert('Failed to fetch cases for selected client');
      }
    }

    fetchCases();
  }, [selectedClientId]);

  async function handleUpload() {
    if (!file || !docType || !selectedClientId || !selectedCaseId) {
      return alert("Please select client, case, document type, and file");
    }

    try {
      const selectedClient = clients.find(c => c.id === selectedClientId);
      const selectedCase = cases.find(c => c.id === selectedCaseId);

      // Convert file to base64 for WebDAV upload
      const arrayBuffer = await file.arrayBuffer();
      const base64Content = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      // Create organized filename: ClientName/CaseName/DocumentType/filename
      const clientName = selectedClient?.full_name || 'Unknown Client';
      const caseName = selectedCase?.case_title || 'Unknown Case';
      const organizedFilename = `${clientName}/${caseName}/${docType}/${file.name}`;
      
      console.log('🔧 Starting WebDAV upload for:', organizedFilename);
      
      const result = await uploadFileToWebDAV({
        filename: organizedFilename,
        content: base64Content
      });

      if (result.success) {
        alert("✅ File uploaded successfully to WebDAV!");
        console.log('WebDAV upload result:', result);
      } else {
        throw new Error(result.error || 'WebDAV upload failed');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      alert("❌ Upload failed: " + err.message);
    }
  }

  if (loading) {
    return <div>Loading clients...</div>;
  }

  return (
    <div style={{ padding: "20px", maxWidth: "600px" }}>
      <h2>Upload Document</h2>
      
      <div style={{ marginBottom: "15px" }}>
        <label style={{ display: "block", marginBottom: "5px" }}>Client Name:</label>
        <select 
          value={selectedClientId} 
          onChange={(e) => setSelectedClientId(e.target.value)}
          style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
        >
          <option value="">Select Client</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.full_name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label style={{ display: "block", marginBottom: "5px" }}>Case Name:</label>
        <select 
          value={selectedCaseId} 
          onChange={(e) => setSelectedCaseId(e.target.value)}
          disabled={!selectedClientId}
          style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
        >
          <option value="">Select Case</option>
          {cases.map((case_item) => (
            <option key={case_item.id} value={case_item.id}>
              {case_item.case_title}
            </option>
          ))}
        </select>
        {selectedClientId && cases.length === 0 && (
          <p style={{ color: "#666", fontSize: "14px" }}>No cases found for selected client</p>
        )}
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label style={{ display: "block", marginBottom: "5px" }}>Document Type:</label>
        <select 
          value={docType} 
          onChange={(e) => setDocType(e.target.value)}
          style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
        >
          <option value="">Select Document Type</option>
          <option value="Contracts">Contracts</option>
          <option value="Affidavits">Affidavits</option>
          <option value="CourtOrders">Court Orders</option>
          <option value="Pleadings">Pleadings</option>
          <option value="Evidence">Evidence</option>
        </select>
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label style={{ display: "block", marginBottom: "5px" }}>File:</label>
        <input 
          type="file" 
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
        />
      </div>

      <button 
        onClick={handleUpload}
        disabled={!file || !docType || !selectedClientId || !selectedCaseId}
        style={{ 
          padding: "10px 20px", 
          backgroundColor: "#007cba", 
          color: "white", 
          border: "none", 
          borderRadius: "4px",
          cursor: "pointer",
          opacity: (!file || !docType || !selectedClientId || !selectedCaseId) ? 0.5 : 1
        }}
      >
        Upload File
      </button>
    </div>
  );
}