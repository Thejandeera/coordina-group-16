using System;
using Xunit;
using Moq;
using coordina.UserManagement.Services;
using coordina.UserManagement.Interfaces;
using coordina.UserManagement.Models;

namespace tests.unit
{
    public class UserManagementUnitTests
    {
        private readonly Mock<IUserRepository> _userRepositoryMock;
        private readonly UserService _userService;

        public UserManagementUnitTests()
        {
            _userRepositoryMock = new Mock<IUserRepository>();
            // Assuming UserService handles password hashing and basic validation
            _userService = new UserService(_userRepositoryMock.Object);
        }

        [Fact]
        public async Task RegisterUser_ShouldHashPassword_WhenSuccessful()
        {
            // Arrange
            var userDto = new RegisterDto 
            { 
                Email = "test@example.com", 
                Password = "Password123!",
                FullName = "Test User",
                PhoneNumber = "0771234567",
                ProfilePhoto = "profile.jpg"
            };

            // Act
            var result = await _userService.RegisterAsync(userDto);

            // Assert
            Assert.True(result.IsSuccess);
            _userRepositoryMock.Verify(r => r.AddUserAsync(It.Is<User>(u => 
                u.PasswordHash != userDto.Password && 
                u.PhoneNumber == userDto.PhoneNumber &&
                u.ProfilePhoto == userDto.ProfilePhoto)), Times.Once);
        }

        [Fact]
        public async Task RegisterUser_ShouldFail_WhenEmailAlreadyExists()
        {
            // Arrange
            var userDto = new RegisterDto { Email = "existing@example.com", Password = "Password123!" };
            _userRepositoryMock.Setup(r => r.GetUserByEmailAsync(userDto.Email))
                .ReturnsAsync(new User());

            // Act
            var result = await _userService.RegisterAsync(userDto);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.Equal("Email already registered", result.ErrorMessage);
        }

        [Fact]
        public void AssignRole_ShouldUpdateUserRole_WhenValidRoleProvided()
        {
            // Arrange
            var user = new User { Id = 1, RoleId = 3 }; // 3 = Participant
            var newRoleId = 2; // 2 = Organizer

            // Act
            _userService.AssignRole(user, newRoleId);

            // Assert
            Assert.Equal(newRoleId, user.RoleId);
        }

        [Theory]
        [InlineData("invalid-email")]
        [InlineData("")]
        [InlineData(null)]
        public async Task RegisterUser_ShouldThrowValidationException_ForInvalidEmails(string email)
        {
            // Arrange
            var userDto = new RegisterDto { Email = email, Password = "Password123!" };

            // Act & Assert
            await Assert.ThrowsAsync<ValidationException>(() => _userService.RegisterAsync(userDto));
        }

        [Fact]
        public async Task LoginUser_ShouldReturnToken_WhenCredentialsAreValid()
        {
            // Arrange
            var loginDto = new LoginDto { Email = "admin@cepm.com", Password = "AdminPassword123" };
            var existingUser = new User { Email = "admin@cepm.com", PasswordHash = "HashedPassword" };
            
            _userRepositoryMock.Setup(r => r.GetUserByEmailAsync(loginDto.Email))
                .ReturnsAsync(existingUser);
                
            // Act
            var result = await _userService.LoginAsync(loginDto);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.NotNull(result.Token);
        }

        [Fact]
        public async Task LoginUser_ShouldFail_WhenPasswordIsIncorrect()
        {
            // Arrange
            var loginDto = new LoginDto { Email = "admin@cepm.com", Password = "WrongPassword" };
            var existingUser = new User { Email = "admin@cepm.com", PasswordHash = "CorrectHashedPassword" };
            
            _userRepositoryMock.Setup(r => r.GetUserByEmailAsync(loginDto.Email))
                .ReturnsAsync(existingUser);
                
            // Act
            var result = await _userService.LoginAsync(loginDto);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.Equal("Invalid credentials", result.ErrorMessage);
        }
    }
}
