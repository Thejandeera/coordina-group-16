using DotNetEnv;
using coordina.TestManagement.Services;
using coordina.TestManagement.Interface;


Env.Load();

var builder = WebApplication.CreateBuilder(args);


string baseString = builder.Configuration.GetConnectionString("DefaultConnection") ?? "";
string dbPort = Environment.GetEnvironmentVariable("DB_PORT") ?? "3306";
string dbPassword = Environment.GetEnvironmentVariable("DB_PASSWORD") ?? "";


string masterConnectionString = $"{baseString}Port={dbPort};Pwd={dbPassword};";


builder.Configuration["ConnectionStrings:DefaultConnection"] = masterConnectionString;


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