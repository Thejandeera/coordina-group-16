using DotNetEnv;
using coordina.TestManagement.Services;
using coordina.TestManagement.Interface;


Env.Load();

var builder = WebApplication.CreateBuilder(args);

var dbHost = Environment.GetEnvironmentVariable("DB_HOST") ?? "localhost";
var dbPort = Environment.GetEnvironmentVariable("DB_PORT") ?? "3306";
var dbUser = Environment.GetEnvironmentVariable("DB_USER") ?? "root";
var dbPassword = Environment.GetEnvironmentVariable("DB_PASSWORD") ?? "xyz";

var connectionString =
    $"Server={dbHost};Port={dbPort};Database=cepm_db;Uid={dbUser};Pwd={dbPassword};";

// Update configuration so other services (like TestService) can use it
builder.Configuration["ConnectionStrings:DefaultConnection"] = connectionString;

builder.Services.AddSingleton(new MySql.Data.MySqlClient.MySqlConnection(connectionString));


builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Register your services
builder.Services.AddScoped<ITestService, TestService>();

var app = builder.Build();


if (app.Environment.IsDevelopment())
{
    // 3. Enable the Swagger UI
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();