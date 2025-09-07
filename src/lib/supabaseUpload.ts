export async function uploadToPydio({
  clientName,
  caseName,
  docType,
  file,
}: {
  clientName: string;
  caseName: string;
  docType: string;
  file: File;
}) {
  const SUPABASE_URL = "https://hpcnipcbymruvsnqrmjx.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwY25pcGNieW1ydXZzbnFybWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNjIzNTMsImV4cCI6MjA2MDgzODM1M30.d65xnv4f9JyaRlrBHaCPl_W4_EiQaYIs97Eph_MEJtY";

  const arrayBuffer = await file.arrayBuffer();
  const base64Data = btoa(
    String.fromCharCode(...new Uint8Array(arrayBuffer))
  );

  const response = await fetch(`${SUPABASE_URL}/functions/v1/pydio-webdav`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      clientName,
      caseName,
      docType,
      fileName: file.name,
      fileContent: base64Data,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Upload failed");
  }

  return data;
}