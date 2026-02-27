using System.ComponentModel.DataAnnotations;

namespace coordina.UserManagement.Models
{
    public class SignUpRequest
    {
        [Required]
        [MinLength(3)]
        [MaxLength(50)]
        public string Username { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$",
            ErrorMessage = "Password must be at least 8 characters and include uppercase, lowercase, and symbol.")]
        public string Password { get; set; } = string.Empty;

        [Required]
        [RegularExpression(@"^\d{10}$", ErrorMessage = "Phone number must contain exactly 10 digits.")]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required]
        public IFormFile ProfileImage { get; set; } = default!;
    }
}
