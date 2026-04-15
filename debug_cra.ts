
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
    console.log(`\nTesting: "${caseNumber}"`);
    let caseType, caseNo, caseYear;
    let parsed = false;

    if (caseNumber) {
        const cleanCaseNum = caseNumber.trim();
        const normalizedNum = cleanCaseNum.replace(/[\s-]+/g, '/');
        const parts = normalizedNum.split('/').filter(p => p.length > 0);
        console.log("Parts:", parts);

        if (parts.length >= 2) {
            let yearIndex = -1;

            for (let i = parts.length - 1; i >= 0; i--) {
                if (/^\d{4}$/.test(parts[i])) {
                    yearIndex = i;
                    break;
                }
            }

            if (yearIndex > 0) {
                caseYear = parts[yearIndex];
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
                        break;
                    }
                }
            }
        }
    }

    if (caseType && caseNo && caseYear) {
        console.log(`SUCCESS: Type="${caseType}", No="${caseNo}", Year="${caseYear}"`);
    } else {
        console.log("FAILED to parse fully.");
        console.log(`Partial: Type="${caseType}", No="${caseNo}", Year="${caseYear}"`);
    }
}

testParsing("CRA /132/2020");
testParsing("FA /3788/2016");
testParsing("SCA/123/2024");
