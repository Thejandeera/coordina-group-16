const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

async function test() {
    console.log('Starting Standalone Selenium Test...');
    const options = new chrome.Options();
    options.addArguments('--headless=new');
    options.addArguments('--disable-gpu');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--window-size=1920,1080');

    let driver;
    try {
        console.log('Building Driver...');
        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();
        console.log('Driver built!');

        console.log('Loading http://localhost:5173/signup ...');
        await driver.get('http://localhost:5173/signup');

        console.log('Page Title:', await driver.getTitle());

        const root = await driver.findElement(By.id('root'));
        console.log('Root element found!');

        const html = await driver.getPageSource();
        console.log('Page Source Length:', html.length);
        // console.log('Sample Source:', html.substring(0, 500));

    } catch (err) {
        console.error('ERROR:', err);
    } finally {
        if (driver) {
            console.log('Quitting Driver...');
            await driver.quit();
        }
    }
}

test();
