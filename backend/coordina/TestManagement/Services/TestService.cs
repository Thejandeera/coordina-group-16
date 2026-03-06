using coordina.TestManagement.Entities;
using coordina.TestManagement.Interface;
// Make sure you have installed the 'Microsoft.Data.SqlClient' NuGet package.
using Microsoft.Data.SqlClient;
using System.Data;

namespace coordina.TestManagement.Services
{
    public class TestService : ITestService
    {
        private readonly string _connectionString;

        // Inject IConfiguration to access the appsettings.json file.
        public TestService(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found in appsettings.json.");
        }

        public async Task<List<TestEntity>> GetAllTestsAsync()
        {
            var tests = new List<TestEntity>();

            // Use ADO.NET to connect to the SQL Server database.
            using (var connection = new SqlConnection(_connectionString))
            {
                await connection.OpenAsync();

                // Define your SQL query. Make sure a 'Tests' table exists in your DB.
                string query = "SELECT Id, Name, Description FROM Tests";

                using (var command = new SqlCommand(query, connection))
                using (var reader = await command.ExecuteReaderAsync())
                {
                    // Read the data row by row.
                    while (await reader.ReadAsync())
                    {
                        tests.Add(new TestEntity
                        {
                            Id = Convert.ToInt32(reader["Id"]),
                            Name = reader["Name"].ToString() ?? string.Empty,
                            // Handle potential NULL values in the database
                            Description = reader["Description"] == DBNull.Value ? string.Empty : reader["Description"].ToString()
                        });
                    }
                }
            }

            return tests;
        }
    }
}