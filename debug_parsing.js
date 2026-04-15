
const GUJARAT_HC_CASE_TYPES = ["SCA-SPECIAL CIVIL APPLICATION", "SCA"];

function debugParsing(caseNumber) {
    console.log(`\nDEBUG: "${caseNumber}"`);
    const cleanCaseNum = caseNumber.trim();
    const normalizedNum = cleanCaseNum.replace(/[\s-]+/g, '/');
    const parts = normalizedNum.split('/').filter(p => p.length > 0);

    console.log('Parts:', JSON.stringify(parts));

    const possibleYear = parts.find(p => /^\d{4}$/.test(p));
    console.log('Possible Year:', possibleYear);

    const yearIndex = parts.lastIndexOf(possibleYear || '');
    console.log('Year Index:', yearIndex);

    let caseNo;
    if (yearIndex > 0) {
        const potentialNo = parts[yearIndex - 1];
        console.log('Potential No:', potentialNo);
        if (/^\d+$/.test(potentialNo)) {
            caseNo = potentialNo;
        } else {
            console.log('Potential No is NOT digits');
        }
    }
    console.log('Case No:', caseNo);
    console.log('-------------------');
}

debugParsing("FA /3788/2016");
debugParsing("FA/3788/2016");
debugParsing("FA / 3788 / 2016");
debugParsing("R/SCA/123/2024");
