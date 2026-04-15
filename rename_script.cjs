const fs = require('fs');
const path = require('path');

const directory = './src';

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Component Name Replacements
    content = content.replace(/LegalkartCaseSearch/g, 'ECourtsCaseSearch');
    content = content.replace(/CaseLegalkartIntegration/g, 'CaseECourtsIntegration');
    content = content.replace(/LegalkartApiDocuments/g, 'ECourtsApiDocuments');
    content = content.replace(/LegalkartDocumentsTable/g, 'ECourtsDocumentsTable');
    content = content.replace(/LegalkartHistoryTable/g, 'ECourtsHistoryTable');
    content = content.replace(/LegalkartObjectionsTable/g, 'ECourtsObjectionsTable');
    content = content.replace(/LegalkartOrdersTable/g, 'ECourtsOrdersTable');
    
    // Hooks & libs Replacements
    content = content.replace(/useLegalkartIntegration/g, 'useEcourtsIntegration');
    content = content.replace(/useLegalkartCaseDetails/g, 'useEcourtsCaseDetails');
    content = content.replace(/legalkartSearchType/g, 'ecourtsSearchType');
    content = content.replace(/resolveLegalkartSearchType/g, 'resolveEcourtsSearchType');
    content = content.replace(/normalizeLegalkartCnr/g, 'normalizeEcourtsCnr');
    
    // Directory paths
    content = content.replace(/\/legalkart\//g, '/ecourts_api/');
    
    // State/variable names
    content = content.replace(/legalkartCases/g, 'ecourtsCases');
    content = content.replace(/legalkartUpsert/g, 'ecourtsUpsert');

    // UI Strings
    content = content.replace(/Legalkart Integration/g, 'eCourts Integration');
    content = content.replace(/Legalkart Case Search/g, 'eCourts Case Search');
    content = content.replace(/Legalkart API/g, 'eCourts API');
    content = content.replace(/Legalkart API Response/g, 'eCourts API Response');
    content = content.replace(/from Legalkart/g, 'from eCourts');
    
    // Keep exact table names if we are not renaming DB tables.
    // user requested "preserve old data", so preserving `legalkart_case_searches` and `legalkart_cases` 
    // EXCEPT we want the UI wording shifted. The string occurrences in supabase.from('legalkart_something') should remain untouched.

    // If modifications happened, write to file
    if (original !== content) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            replaceInFile(fullPath);
        }
    }
}

processDirectory(directory);
console.log('Done replacement.');
