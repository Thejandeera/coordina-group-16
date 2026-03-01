using System.ComponentModel.DataAnnotations;

namespace coordina.UserManagement.Models
{
    public class UpdateProfileRequest
    {
        [Required]
        [MinLength(3)]
        [MaxLength(100)]
        public string Username { get; set; } = string.Empty;

        [Required]
        [RegularExpression(@"^\d{10}$", ErrorMessage = "Phone number must contain exactly 10 digits.")]
        public string PhoneNumber { get; set; } = string.Empty;

        public string? CurrentPassword { get; set; }

        public string? NewPassword { get; set; }
    }
}
