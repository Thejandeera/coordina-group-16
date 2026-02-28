using System.ComponentModel.DataAnnotations;

namespace coordina.UserManagement.Models
{
    public class RefreshTokenRequest
    {
        [Required]
        public string RefreshToken { get; set; } = string.Empty;
    }
}
