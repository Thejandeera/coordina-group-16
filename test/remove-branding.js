const fs = require('fs');
const path = require('path');

const reportPath = path.resolve(__dirname, 'reports', 'report.html');

if (fs.existsSync(reportPath)) {
    console.log('清理报告品牌标识 (Cleaning up report branding)...');
    let content = fs.readFileSync(reportPath, 'utf8');

    const style = `
    <style>
        /* Hide the entire footer and specific branding links */
        footer, .ant-layout-footer { 
            display: none !important; 
        }
        /* Extra insurance for links containing specific text */
        a[href*="github.com/Hazyzh"], 
        a[href*="feedback"],
        .jest-html-reporters-about {
            display: none !important;
        }
    </style>
    `;

    if (content.includes('</head>')) {
        content = content.replace('</head>', `${style}</head>`);
        fs.writeFileSync(reportPath, content);
        console.log('Branding removed from report.');
    } else {
        console.error('Could not find <head> tag to inject styles.');
    }
} else {
    console.error(`Report file not found at: ${reportPath}`);
}
