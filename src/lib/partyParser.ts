/**
 * Parses party and advocate strings from court API data
 * Example input: "1) RAKESH KAMLASHANKAR RAI Advocate- MR SP MAJMUDAR(3456),MR JAMSHED KAVINA(11236)"
 * Output: { name: "RAKESH KAMLASHANKAR RAI", advocates: ["MR SP MAJMUDAR", "MR JAMSHED KAVINA"] }
 */

export interface ParsedParty {
  name: string;
  advocates: string[];
}

export function parsePartyString(input: string): ParsedParty[] {
  if (!input || typeof input !== 'string') {
    return [];
  }

  const parties: ParsedParty[] = [];
  
  // Split by numbers followed by parentheses (e.g., "1)", "2)")
  const partyStrings = input.split(/\d+\)\s*/g).filter(s => s.trim().length > 0);

  for (const partyStr of partyStrings) {
    // Split at "Advocate" keyword (case insensitive)
    const parts = partyStr.split(/\s+advocate[s]?[\s:-]*?/i);
    
    if (parts.length === 0) continue;
    
    // First part is the party name
    const name = parts[0].trim();
    
    // Extract advocates if present
    let advocates: string[] = [];
    if (parts.length > 1) {
      const advocatePart = parts[1];
      // Split by comma or "and" to get individual advocates
      const advocateNames = advocatePart
        .split(/,|\s+and\s+/i)
        .map(adv => {
          // Remove enrollment numbers in parentheses
          return adv.replace(/\([^)]*\)/g, '').trim();
        })
        .filter(adv => adv.length > 0);
      
      advocates = advocateNames;
    }
    
    if (name) {
      parties.push({ name, advocates });
    }
  }

  return parties;
}

/**
 * Opens a base64 PDF string in a new tab
 */
export function openBase64PdfInNewTab(base64Data: string): void {
  try {
    // Remove data URL prefix if present
    const base64 = base64Data.replace(/^data:application\/pdf;base64,/, '');
    
    // Convert base64 to binary
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Create blob and URL
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    // Open in new tab
    window.open(url, '_blank');
    
    // Clean up after a delay
    setTimeout(() => URL.revokeObjectURL(url), 100);
  } catch (error) {
    console.error('Error opening PDF:', error);
    alert('Failed to open PDF. Please try again.');
  }
}
