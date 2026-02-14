using coordina.TestManagement.Services;
using coordina.TestManagement.Interface;

var builder = WebApplication.CreateBuilder(args);


builder.Services.AddControllers();


builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 2. ---> REGISTER YOUR NEW SERVICE HERE <---
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