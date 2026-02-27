using System.ComponentModel.DataAnnotations;

namespace coordina.UserManagement.Models
{
    public class UpdateProfileImageRequest
    {
        [Required]
        public IFormFile ProfileImage { get; set; } = default!;
    }
}
