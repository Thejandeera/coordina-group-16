using Microsoft.AspNetCore.Mvc.Testing;
using System.Net.Http.Json;
using Xunit;
using coordina.UserManagement.Models;

namespace tests.integration
{
    public class UserManagementApiTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;

        public UserManagementApiTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory;
        }

        [Fact]
        public async Task Post_Register_ReturnsSuccessAndCreated()
        {
            // Arrange
            var client = _factory.CreateClient();
            var payload = new { 
                Email = "newuser@example.com", 
                Password = "SecurePassword1!", 
                FullName = "New Member",
                PhoneNumber = "0770000000",
                ProfilePhoto = "data:image/png;base64,..."
            };

            // Act
            var response = await client.PostAsJsonAsync("/api/auth/register", payload);

            // Assert
            response.EnsureSuccessStatusCode();
            Assert.Equal(System.Net.HttpStatusCode.Created, response.StatusCode);
        }

        [Fact]
        public async Task Post_Login_ReturnsJwtToken_WhenCredentialsAreValid()
        {
            // Arrange
            var client = _factory.CreateClient();
            // Assuming this user is seeded in a test database
            var payload = new { Email = "admin@cepm.com", Password = "AdminPassword123" };

            // Act
            var response = await client.PostAsJsonAsync("/api/auth/login", payload);

            // Assert
            response.EnsureSuccessStatusCode();
            var result = await response.Content.ReadFromJsonAsync<AuthResponse>();
            Assert.NotNull(result?.Token);
        }

        [Fact]
        public async Task Get_Profile_ReturnsUnauthorized_WhenNoTokenProvided()
        {
            // Arrange
            var client = _factory.CreateClient();

            // Act
            var response = await client.GetAsync("/api/user/profile");

            // Assert
            Assert.Equal(System.Net.HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task Get_Profile_ReturnsUserData_WhenTokenProvided()
        {
            // Arrange
            var client = _factory.CreateClient();
            // 1. Login to get token
            var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new { Email = "admin@cepm.com", Password = "AdminPassword123" });
            var auth = await loginResponse.Content.ReadFromJsonAsync<AuthResponse>();

            // 2. Set token in header
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", auth.Token);

            // Act
            var response = await client.GetAsync("/api/user/profile");

            // Assert
            response.EnsureSuccessStatusCode();
            var profile = await response.Content.ReadFromJsonAsync<UserProfileDto>();
            Assert.Equal("admin@cepm.com", profile.Email);
        }
    }
}
