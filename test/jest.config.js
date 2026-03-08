module.exports = {
    testTimeout: 60000,
    testEnvironment: 'node',
    reporters: [
        "default",
        [
            "jest-html-reporters",
            {
                "publicPath": "./reports",
                "filename": "report.html",
                "expand": true,
                "pageTitle": "Coordina Integration Reports",
                "hideIcon": true
            }
        ]
    ]
};