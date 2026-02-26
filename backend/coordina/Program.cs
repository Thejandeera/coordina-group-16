using DotNetEnv;
using coordina.Configurations;
using coordina.TestManagement.Services;
using coordina.TestManagement.Interface;
using coordina.UserManagement.Interface;
using coordina.UserManagement.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using MySql.Data.MySqlClient;
using System.Text;


Env.Load();

var builder = WebApplication.CreateBuilder(args);

var dbHost = Environment.GetEnvironmentVariable("DB_HOST") ?? "localhost";
var dbPort = Environment.GetEnvironmentVariable("DB_PORT") ?? "3306";
var dbUser = Environment.GetEnvironmentVariable("DB_USER") ?? "root";
var dbPassword = Environment.GetEnvironmentVariable("DB_PASSWORD") ?? "xyz";
var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? "coordina-api";
var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? "coordina-client";
var accessTokenSecret = Environment.GetEnvironmentVariable("JWT_ACCESS_SECRET") ?? "coordina_default_access_secret_change_me_32_chars";
var refreshTokenSecret = Environment.GetEnvironmentVariable("JWT_REFRESH_SECRET") ?? "coordina_default_refresh_secret_change_me_32_chars";
var cloudinaryCloudName = Environment.GetEnvironmentVariable("CLOUDINARY_CLOUD_NAME") ?? string.Empty;
var cloudinaryApiKey = Environment.GetEnvironmentVariable("CLOUDINARY_API_KEY") ?? string.Empty;
var cloudinaryApiSecret = Environment.GetEnvironmentVariable("CLOUDINARY_API_SECRET") ?? string.Empty;

var connectionString =
    $"Server={dbHost};Port={dbPort};Database=ccrp_db;Uid={dbUser};Pwd={dbPassword};";

// Update configuration so other services (like TestService) can use it
builder.Configuration["ConnectionStrings:DefaultConnection"] = connectionString;
builder.Configuration["Jwt:Issuer"] = jwtIssuer;
builder.Configuration["Jwt:Audience"] = jwtAudience;
builder.Configuration["Jwt:AccessTokenSecret"] = accessTokenSecret;
builder.Configuration["Jwt:RefreshTokenSecret"] = refreshTokenSecret;
builder.Configuration["Cloudinary:CloudName"] = cloudinaryCloudName;
builder.Configuration["Cloudinary:ApiKey"] = cloudinaryApiKey;
builder.Configuration["Cloudinary:ApiSecret"] = cloudinaryApiSecret;

builder.Services.AddSingleton(new MySqlConnection(connectionString));
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));
builder.Services.Configure<CloudinarySettings>(builder.Configuration.GetSection("Cloudinary"));
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IAuthService, AuthService>();

var jwtSettings = builder.Configuration.GetSection("Jwt").Get<JwtSettings>() ?? new JwtSettings();
var accessKey = Encoding.UTF8.GetBytes(jwtSettings.AccessTokenSecret);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateIssuerSigningKey = true,
        ValidateLifetime = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidAudience = jwtSettings.Audience,
        IssuerSigningKey = new SymmetricSecurityKey(accessKey),
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddControllers();
builder.Services.AddAuthorization();
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "https://localhost:5173",
                "https://127.0.0.1:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    var securityScheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    };

    options.AddSecurityDefinition("Bearer", securityScheme);

});

// Register your services
builder.Services.AddScoped<ITestService, TestService>();

var app = builder.Build();


if (app.Environment.IsDevelopment())
{
    // 3. Enable the Swagger UI
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors("FrontendPolicy");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
