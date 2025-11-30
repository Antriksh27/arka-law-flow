/**
 * Smart format advocates with party numbers
 * Input: "GURMEET SINGH MAKKER[P-3]\nGURMEET SINGH MAKKER[P-4]\nSHREEKANT NEELAPPA TERDAL[P-1]"
 * Output: "GURMEET SINGH MAKKER (Pet 3-4), SHREEKANT NEELAPPA TERDAL (Pet 1)"
 */
export const formatAdvocatesSmart = (
  advocates: string | null, 
  type: 'petitioner' | 'respondent'
): string => {
  if (!advocates) return '-';
  
  // Pattern matches: NAME[P-1] or NAME[R-1]
  const pattern = type === 'petitioner' ? /\[P-(\d+)\]/g : /\[R-(\d+)\]/g;
  const prefix = type === 'petitioner' ? 'Pet' : 'Resp';
  
  // Split by newlines
  const lines = advocates.split('\n').filter(line => line.trim());
  
  // Group advocates by name
  const advocateMap = new Map<string, number[]>();
  
  lines.forEach(line => {
    const matches = Array.from(line.matchAll(pattern));
    if (matches.length > 0) {
      const name = line.replace(pattern, '').trim();
      const partyNums = matches.map(m => parseInt(m[1], 10));
      
      if (!advocateMap.has(name)) {
        advocateMap.set(name, []);
      }
      advocateMap.get(name)!.push(...partyNums);
    } else {
      // No party number, just add the name
      const cleanName = line.trim();
      if (cleanName && !advocateMap.has(cleanName)) {
        advocateMap.set(cleanName, []);
      }
    }
  });
  
  // Format output
  const formatted = Array.from(advocateMap.entries()).map(([name, nums]) => {
    if (nums.length === 0) return name;
    
    nums.sort((a, b) => a - b);
    
    // Check if consecutive
    const isConsecutive = nums.every((num, i) => 
      i === 0 || num === nums[i - 1] + 1
    );
    
    if (nums.length === 1) {
      return `${name} (${prefix} ${nums[0]})`;
    } else if (isConsecutive) {
      return `${name} (${prefix} ${nums[0]}-${nums[nums.length - 1]})`;
    } else {
      return `${name} (${prefix} ${nums.join(', ')})`;
    }
  });
  
  return formatted.join(', ') || '-';
};
