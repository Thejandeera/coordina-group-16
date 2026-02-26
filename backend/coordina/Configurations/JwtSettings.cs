namespace coordina.Configurations
{
    public class JwtSettings
    {
        public string Issuer { get; set; } = "coordina-api";
        public string Audience { get; set; } = "coordina-client";
        public string AccessTokenSecret { get; set; } = string.Empty;
        public string RefreshTokenSecret { get; set; } = string.Empty;
        public int AccessTokenMinutes { get; set; } = 15;
        public int RefreshTokenDays { get; set; } = 7;
    }
}
