using DotNetEnv;
using coordina.Configurations;
using coordina.DashboardManagement.Interface;
using coordina.DashboardManagement.Services;
using coordina.ProjectManagement.Interface;
using coordina.ProjectManagement.Services;
using coordina.TestManagement.Services;
using coordina.TestManagement.Interface;
using coordina.UserManagement.Interface;
using coordina.UserManagement.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Microsoft.Data.SqlClient;
using System.Text;


Env.Load();

var builder = WebApplication.CreateBuilder(args);

var connectionString = Environment.GetEnvironmentVariable("DB_CONNECTION_STRING") ?? throw new InvalidOperationException("DB_CONNECTION_STRING environment variable is missing.");
var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? throw new InvalidOperationException("JWT_ISSUER environment variable is missing.");
var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? throw new InvalidOperationException("JWT_AUDIENCE environment variable is missing.");
var accessTokenSecret = Environment.GetEnvironmentVariable("JWT_ACCESS_SECRET") ?? throw new InvalidOperationException("JWT_ACCESS_SECRET environment variable is missing.");
var refreshTokenSecret = Environment.GetEnvironmentVariable("JWT_REFRESH_SECRET") ?? throw new InvalidOperationException("JWT_REFRESH_SECRET environment variable is missing.");
var cloudinaryCloudName = Environment.GetEnvironmentVariable("CLOUDINARY_CLOUD_NAME") ?? string.Empty;
var cloudinaryApiKey = Environment.GetEnvironmentVariable("CLOUDINARY_API_KEY") ?? string.Empty;
var cloudinaryApiSecret = Environment.GetEnvironmentVariable("CLOUDINARY_API_SECRET") ?? string.Empty;
var frontendUrl = Environment.GetEnvironmentVariable("FRONTEND_URL") ?? throw new InvalidOperationException("FRONTEND_URL environment variable is missing.");

// Update configuration so other services (like TestService) can use it
builder.Configuration["ConnectionStrings:DefaultConnection"] = connectionString;
builder.Configuration["Jwt:Issuer"] = jwtIssuer;
builder.Configuration["Jwt:Audience"] = jwtAudience;
builder.Configuration["Jwt:AccessTokenSecret"] = accessTokenSecret;
builder.Configuration["Jwt:RefreshTokenSecret"] = refreshTokenSecret;
builder.Configuration["Cloudinary:CloudName"] = cloudinaryCloudName;
builder.Configuration["Cloudinary:ApiKey"] = cloudinaryApiKey;
builder.Configuration["Cloudinary:ApiSecret"] = cloudinaryApiSecret;

builder.Services.AddSingleton(new SqlConnection(connectionString));
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));
builder.Services.Configure<CloudinarySettings>(builder.Configuration.GetSection("Cloudinary"));
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IProjectManagementService, ProjectManagementService>();

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
        policy.AllowAnyOrigin()
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

// Minimal API test endpoint
app.MapGet("/ping", () => "hello from backedn");

app.MapControllers();

app.Run();
