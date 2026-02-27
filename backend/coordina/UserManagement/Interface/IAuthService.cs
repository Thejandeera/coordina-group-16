using coordina.UserManagement.Models;

namespace coordina.UserManagement.Interface
{
    public interface IAuthService
    {
        Task<SignUpResponse> RegisterAsync(SignUpRequest request);
        Task<AuthResponse> LoginAsync(LoginRequest request);
        Task<AuthResponse> RefreshAccessTokenAsync(RefreshTokenRequest request);
        Task<string> UpdateProfileImageAsync(long userId, IFormFile profileImage);
    }
}
