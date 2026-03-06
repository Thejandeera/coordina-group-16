using coordina.DashboardManagement.Interface;
using coordina.DashboardManagement.Models;
using Npgsql;
using System.Globalization;

namespace coordina.DashboardManagement.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly string _connectionString;

        public DashboardService(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
        }

        public async Task<DashboardOverviewResponse> GetOverviewAsync()
        {
            await EnsureDashboardTablesAsync();

            var weekStart = GetCurrentWeekStart(DateTime.UtcNow.Date);

            using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();

            var response = new DashboardOverviewResponse();

            response.ActiveProjects = await GetScalarIntAsync(connection, @"
                SELECT COUNT(*)
                FROM ProjectManagementEntities
                WHERE EntityType = 'Project' AND Status = 'Active';");

            response.UpcomingEvents = await GetScalarIntAsync(connection, @"
                SELECT COUNT(*)
                FROM ProjectManagementEntities
                WHERE EntityType = 'Event' AND StartDate >= CAST(CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AS DATE);");

            // Removed pending tasks query reliant on DashboardWeeklyTasks
            response.PendingTasks = 0;

            response.DonationsRaised = await GetScalarDecimalAsync(connection, @"
                SELECT COALESCE(SUM(RaisedAmount), 0)
                FROM ProjectManagementEntities
                WHERE EntityType = 'Donation Drive';");

            response.RecentActivity = await GetRecentActivityAsync(connection);
            response.UpcomingSchedule = await GetUpcomingAsync(connection);
            // Removed weekly tasks query reliant on DashboardWeeklyTasks
            response.WeeklyTasks = GenerateEmptyWeeklyTasks();
            response.ProjectsEvents = await GetProjectsEventsAsync(connection);

            return response;
        }

        private async Task EnsureDashboardTablesAsync()
        {
            using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();

            const string query = @"
                CREATE TABLE IF NOT EXISTS DashboardActivities (
                    Id BIGSERIAL PRIMARY KEY,
                    Actor VARCHAR(120) NOT NULL,
                    ActionText VARCHAR(255) NOT NULL,
                    TargetText VARCHAR(160) NOT NULL,
                    OccurredAt TIMESTAMP NOT NULL
                );";

            using var command = new NpgsqlCommand(query, connection);
            await command.ExecuteNonQueryAsync();
        }

        private static async Task<int> GetScalarIntAsync(NpgsqlConnection connection, string query, params (string Name, object Value)[] parameters)
        {
            using var command = new NpgsqlCommand(query, connection);
            foreach (var (name, value) in parameters)
            {
                command.Parameters.AddWithValue(name, value);
            }

            var result = await command.ExecuteScalarAsync();
            return result is null || result is DBNull ? 0 : Convert.ToInt32(result, CultureInfo.InvariantCulture);
        }

        private static async Task<decimal> GetScalarDecimalAsync(NpgsqlConnection connection, string query, params (string Name, object Value)[] parameters)
        {
            using var command = new NpgsqlCommand(query, connection);
            foreach (var (name, value) in parameters)
            {
                command.Parameters.AddWithValue(name, value);
            }

            var result = await command.ExecuteScalarAsync();
            return result is null || result is DBNull ? 0m : Convert.ToDecimal(result, CultureInfo.InvariantCulture);
        }

        private static async Task<List<ActivityItem>> GetRecentActivityAsync(NpgsqlConnection connection)
        {
            var result = new List<ActivityItem>();
            const string query = @"
                SELECT Actor, ActionText, TargetText, OccurredAt
                FROM DashboardActivities
                ORDER BY OccurredAt DESC
                LIMIT 5;";

            using var command = new NpgsqlCommand(query, connection);
            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                result.Add(new ActivityItem
                {
                    Actor = reader["Actor"].ToString() ?? string.Empty,
                    Action = reader["ActionText"].ToString() ?? string.Empty,
                    Target = reader["TargetText"].ToString() ?? string.Empty,
                    OccurredAt = Convert.ToDateTime(reader["OccurredAt"], CultureInfo.InvariantCulture).ToUniversalTime()
                });
            }

            return result;
        }

        private static async Task<List<UpcomingItem>> GetUpcomingAsync(NpgsqlConnection connection)
        {
            var result = new List<UpcomingItem>();
            const string query = @"
                SELECT StartDate, Name
                FROM ProjectManagementEntities
                WHERE EntityType = 'Event'
                  AND StartDate >= CAST(CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AS DATE)
                ORDER BY StartDate ASC
                LIMIT 3;";

            using var command = new NpgsqlCommand(query, connection);
            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                result.Add(new UpcomingItem
                {
                    EventDate = Convert.ToDateTime(reader["StartDate"], CultureInfo.InvariantCulture).Date,
                    Title = reader["Name"].ToString() ?? string.Empty,
                    TimeRange = "09:00 - 16:00"
                });
            }

            return result;
        }

        private static List<WeeklyTaskPoint> GenerateEmptyWeeklyTasks()
        {
            var dayNames = new[] { "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun" };
            var result = new List<WeeklyTaskPoint>();
            for (var dayIndex = 0; dayIndex < 7; dayIndex++)
            {
                result.Add(new WeeklyTaskPoint
                {
                    Day = dayNames[dayIndex],
                    Value = 0
                });
            }

            return result;
        }

        private static async Task<List<ProjectEventItem>> GetProjectsEventsAsync(NpgsqlConnection connection)
        {
            var result = new List<ProjectEventItem>();
            const string query = @"
                SELECT Id, Name, Description, EntityType, Status, MembersCount, StartDate, RaisedAmount, GoalAmount
                FROM ProjectManagementEntities
                ORDER BY CreatedAt DESC;";

            using var command = new NpgsqlCommand(query, connection);
            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                result.Add(new ProjectEventItem
                {
                    Id = Convert.ToInt64(reader["Id"], CultureInfo.InvariantCulture),
                    Title = reader["Name"].ToString() ?? string.Empty,
                    Description = reader["Description"].ToString() ?? string.Empty,
                    ItemType = reader["EntityType"].ToString() ?? string.Empty,
                    Status = reader["Status"].ToString() ?? string.Empty,
                    MembersCount = Convert.ToInt32(reader["MembersCount"], CultureInfo.InvariantCulture),
                    EventDate = Convert.ToDateTime(reader["StartDate"], CultureInfo.InvariantCulture).Date,
                    RaisedAmount = reader["RaisedAmount"] is DBNull ? null : Convert.ToDecimal(reader["RaisedAmount"], CultureInfo.InvariantCulture),
                    GoalAmount = reader["GoalAmount"] is DBNull ? null : Convert.ToDecimal(reader["GoalAmount"], CultureInfo.InvariantCulture)
                });
            }

            return result;
        }

        private static DateTime GetCurrentWeekStart(DateTime dateUtc)
        {
            var mondayOffset = ((int)dateUtc.DayOfWeek + 6) % 7;
            return dateUtc.AddDays(-mondayOffset).Date;
        }
    }
}
