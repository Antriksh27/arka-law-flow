
import { GUJARAT_HC_CASE_TYPES } from './src/components/cases/legalkart/constants';

function debugParsing(caseNumber: string) {
    console.log(`\nDEBUG: "${caseNumber}"`);
    const cleanCaseNum = caseNumber.trim();
    const normalizedNum = cleanCaseNum.replace(/[\s-]+/g, '/');
    const parts = normalizedNum.split('/').filter(p => p.length > 0);

    console.log('Parts:', JSON.stringify(parts));

    // Find year by searching backwards, as year is usually at the end
    // and case number might be 4 digits (e.g., 3788)
    let yearIndex = -1;
    let possibleYear = '';

    for (let i = parts.length - 1; i >= 0; i--) {
        if (/^\d{4}$/.test(parts[i])) {
            yearIndex = i;
            possibleYear = parts[i];
            break;
        }
    }

    console.log('Possible Year:', possibleYear);
    console.log('Year Index:', yearIndex);

    let caseNo;
    let caseYear;
    let caseType;

    if (yearIndex > 0) {
        caseYear = parts[yearIndex];
        const potentialNo = parts[yearIndex - 1];
        console.log('Potential No:', potentialNo);
        if (/^\d+$/.test(potentialNo)) {
            caseNo = potentialNo;
        } else {
            console.log('Potential No is NOT digits');
        }
    }

    console.log('Case Year:', caseYear, 'Case No:', caseNo);

    if (caseYear && caseNo) {
        for (const part of parts) {
            const partUpper = part.toUpperCase();
            console.log('Checking part:', partUpper);
            const matchedType = GUJARAT_HC_CASE_TYPES.find(t =>
                t === partUpper || t.startsWith(partUpper + '-')
            );

            if (matchedType) {
                caseType = matchedType;
                console.log('MATCHED:', matchedType);
                break;
            }
        }
    } else {
        console.log('Year/No not found');
    }

    if (!caseType) {
        console.log('Type NOT FOUND');
    }
}

debugParsing("FA /3788/2016");
