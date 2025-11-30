/**
 * Smart format advocates with party numbers
 * Handles multi-line format where advocate names and party numbers may be on different lines
 * Input: "ADVOCATE NAME\n(Status)\n[P-1]\nADVOCATE NAME\n[P-2]"
 * Output: "ADVOCATE NAME (Pet 1-2)"
 */
export const formatAdvocatesSmart = (
  advocates: string | null, 
  type: 'petitioner' | 'respondent'
): string => {
  if (!advocates) return '-';
  
  const marker = type === 'petitioner' ? 'P' : 'R';
  const prefix = type === 'petitioner' ? 'Pet' : 'Resp';
  
  // Match party numbers with preceding text (advocate name)
  // Pattern: text (possibly multi-line) followed by [P-N] or [R-N]
  const entryPattern = new RegExp(`([^\\[\\n]+?)(?:\\s*\\([^)]*\\))?\\s*\\[${marker}-(\\d+)\\]`, 'gs');
  
  const advocateMap = new Map<string, number[]>();
  let match;
  
  // Find all entries with party numbers
  while ((match = entryPattern.exec(advocates)) !== null) {
    let name = match[1].trim();
    const partyNum = parseInt(match[2], 10);
    
    // Clean up name - remove status notes, caveat markers, extra whitespace
    name = name.replace(/\([^)]*\)/g, '').trim();
    name = name.replace(/\[caveat\]/gi, '').trim();
    name = name.replace(/\s+/g, ' ').trim();
    
    // Skip empty names or just commas
    if (name && name !== ',' && name.length > 1) {
      if (!advocateMap.has(name)) {
        advocateMap.set(name, []);
      }
      advocateMap.get(name)!.push(partyNum);
    }
  }
  
  // If no party numbers found, fallback to simple parsing
  if (advocateMap.size === 0) {
    const lines = advocates.split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('(') && !l.match(/^\[.*\]$/) && l !== ',');
    
    if (lines.length > 0) {
      return lines.join(', ');
    }
    return advocates.trim() || '-';
  }
  
  // Format output with grouped party numbers
  const formatted = Array.from(advocateMap.entries()).map(([name, nums]) => {
    nums.sort((a, b) => a - b);
    
    // Find consecutive ranges
    const ranges: string[] = [];
    let start = nums[0], end = nums[0];
    
    for (let i = 1; i <= nums.length; i++) {
      if (i < nums.length && nums[i] === end + 1) {
        end = nums[i];
      } else {
        ranges.push(start === end ? `${start}` : `${start}-${end}`);
        if (i < nums.length) {
          start = end = nums[i];
        }
      }
    }
    
    return `${name} (${prefix} ${ranges.join(', ')})`;
  });
  
  return formatted.join(', ') || '-';
};
