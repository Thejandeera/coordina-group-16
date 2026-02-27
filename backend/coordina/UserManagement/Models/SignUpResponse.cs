namespace coordina.UserManagement.Models
{
    public class SignUpResponse
    {
        public string Message { get; set; } = "Your Account created successfully";
        public string RedirectTo { get; set; } = "/login";
    }
}
