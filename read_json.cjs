
const fs = require('fs');

try {
    let content;
    try {
        content = fs.readFileSync('case_details.json', 'utf8');
    } catch (e) {
        content = fs.readFileSync('case_details.json', 'utf16le');
    }

    if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
    }

    // Try to find the JSON start
    const jsonStart = content.indexOf('[');
    if (jsonStart !== -1) {
        content = content.substring(jsonStart);
    }

    const data = JSON.parse(content);
    if (Array.isArray(data) && data.length > 0) {
        // Print safely
        const cn = data[0].case_number;
        const cnr = data[0].cnr_number;
        console.log('FULL_CASE_NUMBER: "' + cn + '"');
        console.log('FULL_CNR_NUMBER: "' + cnr + '"');
    } else {
        console.log('Data is valid JSON but empty or not an array:', data);
    }

} catch (e) {
    console.log('Error parsing JSON:', e.message);
}
