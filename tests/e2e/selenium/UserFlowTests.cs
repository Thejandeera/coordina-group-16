using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using Xunit;

namespace tests.e2e.selenium
{
    public class UserFlowTests : IDisposable
    {
        private readonly IWebDriver _driver;
        private readonly string _baseUrl = "http://localhost:5173"; // Default Vite port

        public UserFlowTests()
        {
            _driver = new ChromeDriver();
            _driver.Manage().Timeouts().ImplicitWait = TimeSpan.FromSeconds(10);
        }

        [Fact]
        public void FullUserJourney_RegistrationToLogout()
        {
            // 1. Go to Registration Page
            _driver.Navigate().GoToUrl($"{_baseUrl}/register");

            // 2. Register
            _driver.FindElement(By.Id("fullName")).SendKeys("Selenium Test User");
            _driver.FindElement(By.Id("email")).SendKeys("selenium@example.com");
            _driver.FindElement(By.Id("phoneNumber")).SendKeys("0778889990");
            
            // Upload profile photo (file path)
            _driver.FindElement(By.Id("profilePhoto")).SendKeys(Path.GetFullPath("test_data/avatar.png"));

            _driver.FindElement(By.Id("password")).SendKeys("Testing123!");
            _driver.FindElement(By.Id("confirmPassword")).SendKeys("Testing123!");
            _driver.FindElement(By.Id("registerBtn")).Click();

            // 3. Verify Login Redirection
            Assert.Contains("/login", _driver.Url);

            // 4. Login
            _driver.FindElement(By.Id("email")).SendKeys("selenium@example.com");
            _driver.FindElement(By.Id("password")).SendKeys("Testing123!");
            _driver.FindElement(By.Id("loginBtn")).Click();

            // 5. Verify Dashboard/Home after login
            var welcomeMsg = _driver.FindElement(By.TagName("h1")).Text;
            Assert.Contains("Welcome", welcomeMsg);

            // 6. Navigate to Profile
            _driver.FindElement(By.Id("profileMenu")).Click();
            _driver.FindElement(By.Id("viewProfile")).Click();
            
            Assert.Equal("selenium@example.com", _driver.FindElement(By.Id("userEmail")).Text);

            // 7. Logout
            _driver.FindElement(By.Id("logoutBtn")).Click();
            
            // 8. Verify back at login
            Assert.Contains("/login", _driver.Url);
        }

        public void Dispose()
        {
            _driver.Quit();
        }
    }
}
