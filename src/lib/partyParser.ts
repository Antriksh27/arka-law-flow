export interface ParsedParty {
  name: string;
  advocates: string[];
}

/**
 * Parse party string from LegalKart API
 * Format: "1) PARTY NAME Advocate- ADVOCATE1(ID),ADVOCATE2(ID)"
 */
export function parsePartyString(partyString: string | null): ParsedParty[] {
  if (!partyString) return [];
  
  // Split by numbers followed by closing parenthesis
  const segments = partyString.split(/\d+\)\s*/).filter(s => s.trim());
  
  return segments.map(segment => {
    // Split at "Advocate" keyword (with various formats like "Advocate-" or "Advocate -")
    const advocateMatch = segment.match(/^(.*?)\s*Advocate\s*[-:–—]?\s*(.*)$/i);
    
    if (advocateMatch) {
      const partyName = advocateMatch[1].trim();
      const advocatesString = advocateMatch[2].trim();
      
      // Split advocates by comma
      const advocates = advocatesString
        .split(',')
        .map(adv => adv.trim())
        .filter(adv => adv.length > 0);
      
      return { name: partyName, advocates };
    }
    
    // Fallback: treat entire segment as party name with no advocates
    return { name: segment.trim(), advocates: [] };
  }).filter(party => party.name.length > 0);
}

/**
 * Convert base64 PDF to blob and open in new tab
 */
export function openBase64PdfInNewTab(base64Data: string, filename: string = 'document.pdf') {
  try {
    // Remove data URL prefix if present
    const base64String = base64Data.replace(/^data:application\/pdf;base64,/, '');
    
    // Convert base64 to binary
    const binaryString = window.atob(base64String);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Create blob
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    // Open in new tab
    window.open(url, '_blank');
    
    // Clean up URL after a delay
    setTimeout(() => URL.revokeObjectURL(url), 100);
  } catch (error) {
    console.error('Error opening PDF:', error);
    throw new Error('Failed to open PDF document');
  }
}
