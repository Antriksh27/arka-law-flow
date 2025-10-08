interface ParsedParty {
  name: string;
  advocates: string[];
}

export function parsePartyString(partyString: string | null): ParsedParty[] {
  if (!partyString) return [];
  
  // Split by numbers followed by closing parenthesis
  const segments = partyString.split(/\d+\)\s*/).filter(s => s.trim());
  
  return segments.map(segment => {
    // Split at "Advocate" keyword (with various formats)
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
