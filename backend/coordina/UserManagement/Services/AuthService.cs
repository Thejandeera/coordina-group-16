using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using coordina.Configurations;
using coordina.UserManagement.Entities;
using coordina.UserManagement.Interface;
using coordina.UserManagement.Models;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Npgsql;
using System.Data.Common;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.RegularExpressions;

namespace coordina.UserManagement.Services
{
    public class AuthService : IAuthService
    {
        private readonly string _connectionString;
        private readonly JwtSettings _jwtSettings;
        private readonly CloudinarySettings _cloudinarySettings;

        public AuthService(
            IConfiguration configuration,
            IOptions<JwtSettings> jwtOptions,
            IOptions<CloudinarySettings> cloudinaryOptions)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
            _jwtSettings = jwtOptions.Value;
            _cloudinarySettings = cloudinaryOptions.Value;
        }

        public async Task<SignUpResponse> RegisterAsync(SignUpRequest request)
        {
            await EnsureUsersTableAsync();

            var userExists = await UserExistsAsync(request.Username, request.Email);
            if (userExists)
            {
                throw new InvalidOperationException("Username or email is already registered.");
            }

            var profileImageUrl = await UploadProfileImageAsync(request.ProfileImage);
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();

            const string query = @"
                INSERT INTO Users (Username, Email, PasswordHash, PhoneNumber, ProfileImageUrl, CreatedAt)
                VALUES (@Username, @Email, @PasswordHash, @PhoneNumber, @ProfileImageUrl, @CreatedAt);";

            using var command = new NpgsqlCommand(query, connection);
            command.Parameters.AddWithValue("@Username", request.Username.Trim());
            command.Parameters.AddWithValue("@Email", request.Email.Trim().ToLowerInvariant());
            command.Parameters.AddWithValue("@PasswordHash", passwordHash);
            command.Parameters.AddWithValue("@PhoneNumber", request.PhoneNumber.Trim());
            command.Parameters.AddWithValue("@ProfileImageUrl", profileImageUrl);
            command.Parameters.AddWithValue("@CreatedAt", DateTime.UtcNow);

            await command.ExecuteNonQueryAsync();

            return new SignUpResponse();
        }

        private async Task<bool> UserExistsAsync(string username, string email)
        {
            using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();

            const string query = @"
                SELECT 1
                FROM Users
                WHERE LOWER(Username) = LOWER(@Username)
                   OR LOWER(Email) = LOWER(@Email)
                LIMIT 1;";

            using var command = new NpgsqlCommand(query, connection);
            command.Parameters.AddWithValue("@Username", username.Trim());
            command.Parameters.AddWithValue("@Email", email.Trim());

            var result = await command.ExecuteScalarAsync();
            return result is not null;
        }

        public async Task<AuthResponse> LoginAsync(LoginRequest request)
        {
            await EnsureUsersTableAsync();

            var user = await GetUserByIdentifierAsync(request.Identifier);
            if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                throw new UnauthorizedAccessException("Invalid username/email or password.");
            }

            var tokenPair = GenerateTokenPair(user);

            return new AuthResponse
            {
                AccessToken = tokenPair.AccessToken,
                RefreshToken = tokenPair.RefreshToken,
                AccessTokenExpiresAt = tokenPair.AccessTokenExpiresAt
            };
        }

        public async Task<AuthResponse> RefreshAccessTokenAsync(RefreshTokenRequest request)
        {
            await EnsureUsersTableAsync();

            var principal = ValidateRefreshToken(request.RefreshToken);
            var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(userIdClaim, out var userId))
            {
                throw new UnauthorizedAccessException("Invalid refresh token.");
            }

            var user = await GetUserByIdAsync(userId);
            if (user is null)
            {
                throw new UnauthorizedAccessException("User not found for refresh token.");
            }

            var tokenPair = GenerateTokenPair(user);

            return new AuthResponse
            {
                AccessToken = tokenPair.AccessToken,
                RefreshToken = tokenPair.RefreshToken,
                AccessTokenExpiresAt = tokenPair.AccessTokenExpiresAt
            };
        }

        public async Task<UserProfileResponse> GetCurrentUserAsync(long userId)
        {
            await EnsureUsersTableAsync();

            var user = await GetUserByIdAsync(userId);
            if (user is null)
            {
                throw new KeyNotFoundException("User not found.");
            }

            return new UserProfileResponse
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                ProfileImageUrl = user.ProfileImageUrl,
                CreatedAt = user.CreatedAt
            };
        }

        public async Task<UserProfileResponse> UpdateProfileAsync(long userId, UpdateProfileRequest request)
        {
            await EnsureUsersTableAsync();

            var user = await GetUserByIdAsync(userId);
            if (user is null)
            {
                throw new KeyNotFoundException("User not found.");
            }

            var nextUsername = request.Username.Trim();
            var nextPhoneNumber = request.PhoneNumber.Trim();

            if (nextUsername.Length < 3)
            {
                throw new InvalidOperationException("Username must be at least 3 characters.");
            }

            if (!Regex.IsMatch(nextPhoneNumber, @"^\d{10}$"))
            {
                throw new InvalidOperationException("Phone number must contain exactly 10 digits.");
            }

            if (await IsUsernameTakenByAnotherUserAsync(userId, nextUsername))
            {
                throw new InvalidOperationException("Username is already taken.");
            }

            string? nextPasswordHash = null;
            var wantsPasswordUpdate = !string.IsNullOrWhiteSpace(request.NewPassword) ||
                                      !string.IsNullOrWhiteSpace(request.CurrentPassword);

            if (wantsPasswordUpdate)
            {
                if (string.IsNullOrWhiteSpace(request.CurrentPassword) || string.IsNullOrWhiteSpace(request.NewPassword))
                {
                    throw new InvalidOperationException("Current password and new password are required to change password.");
                }

                if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
                {
                    throw new InvalidOperationException("Current password is incorrect.");
                }

                if (!Regex.IsMatch(request.NewPassword, @"^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$"))
                {
                    throw new InvalidOperationException("Password must be 8+ chars with uppercase, lowercase, and symbol.");
                }

                nextPasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            }

            using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();

            const string query = @"
                UPDATE Users
                SET Username = @Username,
                    PhoneNumber = @PhoneNumber,
                    PasswordHash = COALESCE(@PasswordHash, PasswordHash)
                WHERE Id = @Id;";

            using var command = new NpgsqlCommand(query, connection);
            command.Parameters.AddWithValue("@Username", nextUsername);
            command.Parameters.AddWithValue("@PhoneNumber", nextPhoneNumber);
            command.Parameters.AddWithValue("@PasswordHash", nextPasswordHash ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@Id", userId);
            await command.ExecuteNonQueryAsync();

            return await GetCurrentUserAsync(userId);
        }

        public async Task<string> UpdateProfileImageAsync(long userId, IFormFile profileImage)
        {
            await EnsureUsersTableAsync();

            var user = await GetUserByIdAsync(userId);
            if (user is null)
            {
                throw new KeyNotFoundException("User not found.");
            }

            var imageUrl = await UploadProfileImageAsync(profileImage);

            using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();

            const string query = "UPDATE Users SET ProfileImageUrl = @ProfileImageUrl WHERE Id = @Id;";
            using var command = new NpgsqlCommand(query, connection);
            command.Parameters.AddWithValue("@ProfileImageUrl", imageUrl);
            command.Parameters.AddWithValue("@Id", userId);
            await command.ExecuteNonQueryAsync();

            return imageUrl;
        }

        public async Task<IReadOnlyList<UserSearchResponse>> SearchUsersAsync(string query)
        {
            await EnsureUsersTableAsync();

            var users = new List<UserSearchResponse>();
            if (string.IsNullOrWhiteSpace(query))
            {
                return users;
            }

            using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();

            const string sql = @"
                SELECT Id, Username, Email, ProfileImageUrl
                FROM Users
                WHERE Username ILIKE @Query OR Email ILIKE @Query
                ORDER BY Username ASC
                LIMIT 10;";

            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@Query", $"%{query.Trim()}%");

            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                users.Add(new UserSearchResponse
                {
                    Id = Convert.ToInt64(reader["Id"]),
                    Username = reader["Username"].ToString() ?? string.Empty,
                    Email = reader["Email"].ToString() ?? string.Empty,
                    ProfileImageUrl = reader["ProfileImageUrl"] is DBNull ? null : reader["ProfileImageUrl"].ToString()
                });
            }

            return users;
        }

        private async Task EnsureUsersTableAsync()
        {
            using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();

            const string query = @"
                CREATE TABLE IF NOT EXISTS Users (
                    Id BIGSERIAL PRIMARY KEY,
                    Username VARCHAR(100) NOT NULL UNIQUE,
                    Email VARCHAR(255) NOT NULL UNIQUE,
                    PasswordHash VARCHAR(255) NOT NULL,
                    PhoneNumber VARCHAR(30) NOT NULL,
                    ProfileImageUrl TEXT NULL,
                    CreatedAt TIMESTAMP NOT NULL
                );";

            using var command = new NpgsqlCommand(query, connection);
            await command.ExecuteNonQueryAsync();
        }

        private async Task<UserEntity?> GetUserByIdentifierAsync(string identifier)
        {
            using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();

            const string query = @"
                SELECT Id, Username, Email, PasswordHash, PhoneNumber, ProfileImageUrl, CreatedAt
                FROM Users
                WHERE Username = @Identifier OR Email = @Identifier
                LIMIT 1;";

            using var command = new NpgsqlCommand(query, connection);
            command.Parameters.AddWithValue("@Identifier", identifier.Trim());

            using var reader = await command.ExecuteReaderAsync();
            if (!await reader.ReadAsync())
            {
                return null;
            }

            return MapUser(reader);
        }

        private async Task<UserEntity?> GetUserByIdAsync(long userId)
        {
            using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();

            const string query = @"
                SELECT Id, Username, Email, PasswordHash, PhoneNumber, ProfileImageUrl, CreatedAt
                FROM Users
                WHERE Id = @Id
                LIMIT 1;";

            using var command = new NpgsqlCommand(query, connection);
            command.Parameters.AddWithValue("@Id", userId);

            using var reader = await command.ExecuteReaderAsync();
            if (!await reader.ReadAsync())
            {
                return null;
            }

            return MapUser(reader);
        }

        private async Task<bool> IsUsernameTakenByAnotherUserAsync(long userId, string username)
        {
            using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();

            const string query = @"
                SELECT 1
                FROM Users
                WHERE LOWER(Username) = LOWER(@Username)
                  AND Id <> @Id
                LIMIT 1;";

            using var command = new NpgsqlCommand(query, connection);
            command.Parameters.AddWithValue("@Username", username);
            command.Parameters.AddWithValue("@Id", userId);

            var result = await command.ExecuteScalarAsync();
            return result is not null;
        }

        private static UserEntity MapUser(DbDataReader reader)
        {
            return new UserEntity
            {
                Id = Convert.ToInt64(reader["Id"]),
                Username = reader["Username"].ToString() ?? string.Empty,
                Email = reader["Email"].ToString() ?? string.Empty,
                PasswordHash = reader["PasswordHash"].ToString() ?? string.Empty,
                PhoneNumber = reader["PhoneNumber"].ToString() ?? string.Empty,
                ProfileImageUrl = reader["ProfileImageUrl"] == DBNull.Value ? null : reader["ProfileImageUrl"].ToString(),
                CreatedAt = Convert.ToDateTime(reader["CreatedAt"]).ToUniversalTime()
            };
        }

        private ClaimsPrincipal ValidateRefreshToken(string refreshToken)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateIssuerSigningKey = true,
                ValidateLifetime = true,
                ValidIssuer = _jwtSettings.Issuer,
                ValidAudience = _jwtSettings.Audience,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.RefreshTokenSecret)),
                ClockSkew = TimeSpan.Zero
            };

            var principal = tokenHandler.ValidateToken(refreshToken, validationParameters, out var validatedToken);
            if (validatedToken is not JwtSecurityToken jwtToken ||
                !jwtToken.Claims.Any(c => c.Type == "token_type" && c.Value == "refresh"))
            {
                throw new UnauthorizedAccessException("Invalid refresh token.");
            }

            return principal;
        }

        private (string AccessToken, DateTime AccessTokenExpiresAt, string RefreshToken, DateTime RefreshTokenExpiresAt) GenerateTokenPair(UserEntity user)
        {
            var now = DateTime.UtcNow;
            var accessExpires = now.AddMinutes(_jwtSettings.AccessTokenMinutes);
            var refreshExpires = now.AddDays(_jwtSettings.RefreshTokenDays);

            var accessClaims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new(ClaimTypes.Name, user.Username),
                new(ClaimTypes.Email, user.Email),
                new("token_type", "access")
            };

            var refreshClaims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new("token_type", "refresh")
            };

            var accessToken = CreateJwt(accessClaims, accessExpires, _jwtSettings.AccessTokenSecret);
            var refreshToken = CreateJwt(refreshClaims, refreshExpires, _jwtSettings.RefreshTokenSecret);

            return (accessToken, accessExpires, refreshToken, refreshExpires);
        }

        private string CreateJwt(IEnumerable<Claim> claims, DateTime expires, string secret)
        {
            var credentials = new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
                SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _jwtSettings.Issuer,
                audience: _jwtSettings.Audience,
                claims: claims,
                expires: expires,
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private async Task<string> UploadProfileImageAsync(IFormFile file)
        {
            if (file.Length == 0)
            {
                throw new InvalidOperationException("Profile image file is empty.");
            }

            const long maxFileSize = 5 * 1024 * 1024; // 5 MB
            if (file.Length > maxFileSize)
            {
                throw new InvalidOperationException("Profile image exceeds the maximum allowed size of 5MB.");
            }

            var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp" };
            if (!allowedTypes.Contains(file.ContentType.ToLowerInvariant()))
            {
                throw new InvalidOperationException("Invalid image format. Only JPEG, PNG, and WEBP are allowed.");
            }

            if (string.IsNullOrWhiteSpace(_cloudinarySettings.CloudName) ||
                string.IsNullOrWhiteSpace(_cloudinarySettings.ApiKey) ||
                string.IsNullOrWhiteSpace(_cloudinarySettings.ApiSecret))
            {
                // For test/dev environments without Cloudinary, return a placeholder
                return "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg";
            }

            var account = new Account(
                _cloudinarySettings.CloudName,
                _cloudinarySettings.ApiKey,
                _cloudinarySettings.ApiSecret);

            var cloudinary = new Cloudinary(account);

            await using var stream = file.OpenReadStream();
            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(file.FileName, stream),
                Folder = _cloudinarySettings.Folder,
                UseFilename = true,
                UniqueFilename = true,
                Overwrite = false
            };

            var uploadResult = await cloudinary.UploadAsync(uploadParams);
            if (uploadResult.Error is not null || string.IsNullOrWhiteSpace(uploadResult.SecureUrl?.ToString()))
            {
                throw new InvalidOperationException(uploadResult.Error?.Message ?? "Profile image upload failed.");
            }

            return uploadResult.SecureUrl!.ToString();
        }
    }
}
