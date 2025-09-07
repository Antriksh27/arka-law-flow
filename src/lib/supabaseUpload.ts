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
  const SUPABASE_URL = process.env.SUPABASE_URL!;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;

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