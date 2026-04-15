
// Mock the GUJARAT_HC_CASE_TYPES array
const GUJARAT_HC_CASE_TYPES = [
    "AO-APPEAL FROM ORDER",
    "CA-CIVIL APPLICATION",
    "CR-CIVIL REFERENCES",
    "CRA-CIVIL REVISION APPLICATION",
    "FA-FIRST APPEAL",
    "LPA-LETTERS PATENT APPEAL",
    "MCA-MISC. CIVIL APPLICATION",
    "MCACP-MISC. CIVIL APPLN. (CONTEMPT PETITION)",
    "SA-SECOND APPEAL",
    "SCA-SPECIAL CIVIL APPLICATION",
    "COMA-COMPANY APPLICATION",
    "COMP-COMPANY PETITION",
    "CS-CIVIL SUITS",
    "EA-ELECTION APPLICATION",
    "EP-ELECTION PETITION",
    "ITA-INCOME TAX APPLICATION",
    "ITR-INCOME TAX REFERENCE",
    "TAXAP-TAX APPEAL",
    "CR.A-CRIMINAL APPEAL",
    "CR.MA-CRIMINAL MISC.APPLICATION",
    "CR.RA-CRIMINAL REVISION APPLICATION",
    "SCR.A-SPECIAL CRIMINAL APPLICATION",
    "Other"
];

function testParsing(caseNumber) {
    console.log(`\nTesting case number: "${caseNumber}"`);
    let parsed = false;
    let caseType, caseNo, caseYear, searchType, caseMode;

    if (caseNumber) {
        const cleanCaseNum = caseNumber.trim();
        // Normalize separators to slash
        const normalizedNum = cleanCaseNum.replace(/[\s-]+/g, '/');
        const parts = normalizedNum.split('/').filter(p => p.length > 0);

        if (parts.length >= 3) {
            const possibleYear = parts.find(p => /^\d{4}$/.test(p));
            const yearIndex = parts.lastIndexOf(possibleYear || '');

            if (yearIndex > 0) {
                caseYear = parts[yearIndex];
                // Case No is usually at yearIndex - 1
                if (/^\d+$/.test(parts[yearIndex - 1])) {
                    caseNo = parts[yearIndex - 1];
                }
            }

            if (caseYear && caseNo) {
                for (const part of parts) {
                    const partUpper = part.toUpperCase();
                    const matchedType = GUJARAT_HC_CASE_TYPES.find(t =>
                        t === partUpper || t.startsWith(partUpper + '-')
                    );

                    if (matchedType) {
                        caseType = matchedType;
                        break; // Found it
                    }
                }

                if (caseType) {
                    searchType = 'gujarat_high_court';
                    caseMode = 'REGISTRATION';
                    parsed = true;
                    console.log('Parsed GHC details:', { caseType, caseNo, caseYear });
                } else {
                    console.log('Could not find valid GHC Case Type in parts:', parts);
                }
            } else {
                console.log('Could not find year and number. Year:', caseYear, 'No:', caseNo);
            }
        } else {
            console.log('Parts length < 3:', parts);
        }
    } else {
        console.log('Empty case number');
    }

    if (!parsed) {
        console.log('Fallback to High Court CNR search');
    }
}

// Test cases
testParsing("R/SCA/123/2024");
testParsing("SCA/123/2024");
testParsing("C/SCA/123/2024");
testParsing("R/SCA/123/2024");
testParsing("R / SCA / 123 / 2024"); // Spaces
testParsing("SCA-123-2024"); // Hyphens
testParsing("Random/123/2024"); // Invalid type
testParsing("SCA/NotANumber/2024"); // Invalid number
