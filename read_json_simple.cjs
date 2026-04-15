
const fs = require('fs');

try {
    let content = fs.readFileSync('case_details.json', 'utf8');
    // If it looks like garbage, try utf16le
    if (!content.trim().startsWith('[')) {
        content = fs.readFileSync('case_details.json', 'utf16le');
    }

    if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
    }

    const jsonStart = content.indexOf('[');
    if (jsonStart !== -1) {
        content = content.substring(jsonStart);
    }

    const data = JSON.parse(content);
    if (Array.isArray(data) && data.length > 0) {
        const output = `
FULL_CASE_NUMBER: "${data[0].case_number}"
FULL_CNR_NUMBER: "${data[0].cnr_number}"
FULL_COURT_TYPE: "${data[0].court_type}"
`;
        fs.writeFileSync('case_info.txt', output);
        console.log('Written to case_info.txt');
        console.log(output);
    } else {
        console.log('Data is empty or not array');
    }
} catch (e) {
    console.error('Error:', e.message);
}
