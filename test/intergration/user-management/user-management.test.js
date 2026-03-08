const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const path = require('path');

const BASE_URL = 'http://localhost:5173';
const WAIT = 30000;

const testUser = {
    username: `user_${Date.now()}`,
    email: `testuser_${Date.now()}@coordina.com`,
    password: 'TestPass123!',
    phoneNumber: '1234567890',
    profileImage: path.resolve(__dirname, '..', '..', 'dummy_profile.png'),
    newUsername: `updated_${Date.now()}`,
    newPhoneNumber: '0987654321'
};

async function waitForElement(driver, locator) {
    return await driver.wait(until.elementLocated(locator), WAIT);
}

async function typeInto(driver, locator, text) {
    const el = await waitForElement(driver, locator);
    await el.clear();
    await el.sendKeys(text);
}

async function clickOn(driver, locator) {
    const el = await waitForElement(driver, locator);
    await el.click();
}

async function getText(driver, locator) {
    const el = await waitForElement(driver, locator);
    return await el.getText();
}

async function doLogin(driver, user, pass) {
    // Go to login page. If we are redirected to dashboard, clear storage and try again.
    await driver.get(`${BASE_URL}/login`);
    const currentUrl = await driver.getCurrentUrl();
    if (currentUrl.includes('/dashboard')) {
        await driver.executeScript('window.localStorage.clear(); window.sessionStorage.clear();');
        await driver.get(`${BASE_URL}/login`);
    }

    // Some insurance: clear just in case we are on the login page but tokens are still there
    await driver.executeScript('window.localStorage.clear(); window.sessionStorage.clear();');

    await typeInto(driver, By.css('input[placeholder*="username or email"]'), user);
    await typeInto(driver, By.css('input[placeholder*="password"]'), pass);
    await clickOn(driver, By.css('button[type="submit"]'));
}

describe('User Management Integration Tests', () => {

    let driver;

    beforeAll(async () => {
        const service = new chrome.ServiceBuilder('C:\\Users\\HP\\OneDrive\\Desktop\\Coordina\\coordina-group-16\\test\\node_modules\\chromedriver\\lib\\chromedriver\\chromedriver.exe');
        const options = new chrome.Options();
        options.setChromeBinaryPath('C:\\Users\\HP\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe');
        options.addArguments('--headless=new');
        options.addArguments('--disable-gpu');
        options.addArguments('--no-sandbox');
        options.addArguments('--disable-dev-shm-usage');
        options.addArguments('--window-size=1920,1080');

        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .setChromeService(service)
            .build();

        await driver.manage().setTimeouts({ implicit: WAIT });
    }, 60000);

    afterAll(async () => {
        if (driver) {
            await driver.quit();
        }
    }, 60000);

    describe('1. Signup Tests', () => {

        test('Should register a new user successfully', async () => {
            console.log('Testing: New user signup');
            await driver.get(`${BASE_URL}/signup`);

            await typeInto(driver, By.css('input[placeholder*="Username"]'), testUser.username);
            await typeInto(driver, By.css('input[placeholder*="email"]'), testUser.email);
            await typeInto(driver, By.css('input[placeholder*="strong password"]'), testUser.password);
            await typeInto(driver, By.css('input[placeholder*="Confirm your password"]'), testUser.password);
            await typeInto(driver, By.css('input[placeholder*="phone number"]'), testUser.phoneNumber);

            const fileInput = await driver.findElement(By.css('input[type="file"]'));
            await fileInput.sendKeys(testUser.profileImage);

            await clickOn(driver, By.css('button[type="submit"]'));

            await driver.wait(until.urlContains('/login'), WAIT);
            expect(await driver.getCurrentUrl()).toContain('/login');
            console.log('Signup successful → redirected to login');
        }, 60000);

        test('Should show error for duplicate email', async () => {
            console.log('Testing: Duplicate email signup');
            await driver.get(`${BASE_URL}/signup`);

            await typeInto(driver, By.css('input[placeholder*="Username"]'), 'JaneDoe');
            await typeInto(driver, By.css('input[placeholder*="email"]'), testUser.email);
            await typeInto(driver, By.css('input[placeholder*="strong password"]'), testUser.password);
            await typeInto(driver, By.css('input[placeholder*="Confirm your password"]'), testUser.password);
            await typeInto(driver, By.css('input[placeholder*="phone number"]'), '0000000000');

            const fileInput = await driver.findElement(By.css('input[type="file"]'));
            await fileInput.sendKeys(testUser.profileImage);

            await clickOn(driver, By.css('button[type="submit"]'));

            const error = await getText(driver, By.css('p.bg-orange-50'));
            expect(error).toBeTruthy();
            console.log(`Duplicate email error shown: ${error}`);
        }, 60000);

    });

    describe('2. Login Tests', () => {

        test('Should login with valid credentials', async () => {
            console.log('Testing: Valid login');
            await doLogin(driver, testUser.username, testUser.password);

            await driver.wait(until.urlContains('/dashboard'), WAIT);
            expect(await driver.getCurrentUrl()).toContain('/dashboard');
            console.log('Login successful → on dashboard');
        }, 60000);

        test('Should show error for wrong password', async () => {
            console.log('Testing: Wrong password');
            await doLogin(driver, testUser.username, 'WrongPass!!!');

            const error = await getText(driver, By.css('p.bg-orange-50'));
            expect(error).toBeTruthy();
            console.log(`Wrong password error shown: ${error}`);
        }, 60000);

    });

    describe('3. Update Profile Tests', () => {

        test('Should update profile details successfully', async () => {
            console.log('Testing: Update profile');
            // Ensure login specifically for this test
            await doLogin(driver, testUser.username, testUser.password);
            await driver.wait(until.urlContains('/dashboard'), WAIT);

            // Correct URL is /settings which renders Dashboard with Settings tab active
            await driver.get(`${BASE_URL}/settings`);

            // Wait for the form to appear (the input should be present)
            await typeInto(driver, By.xpath("//label[contains(.,'Username')]/input"), testUser.newUsername);
            await typeInto(driver, By.xpath("//label[contains(.,'Phone Number')]/input"), testUser.newPhoneNumber);

            await clickOn(driver, By.css('button[type="submit"]'));

            // Check for success toast
            const success = await driver.wait(until.elementLocated(By.className('Toastify__toast--success')), WAIT);
            expect(success).toBeTruthy();
            console.log('Profile updated successfully');
        }, 90000);

        test('Should logout and lose access to profile', async () => {
            console.log('Testing: Logout and unauthorized access');
            await driver.executeScript('window.localStorage.clear(); window.sessionStorage.clear();');
            await driver.get(`${BASE_URL}/settings`);

            await driver.wait(until.urlContains('/login'), WAIT);
            expect(await driver.getCurrentUrl()).toContain('/login');
            console.log('Access denied → redirected to login');
        }, 60000);

    });

});
