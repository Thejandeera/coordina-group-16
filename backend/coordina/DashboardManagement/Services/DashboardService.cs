using coordina.DashboardManagement.Interface;
using coordina.DashboardManagement.Models;
using MySql.Data.MySqlClient;
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

            using var connection = new MySqlConnection(_connectionString);
            await connection.OpenAsync();

            var response = new DashboardOverviewResponse();

            response.ActiveProjects = await GetScalarIntAsync(connection, @"
                SELECT COUNT(*)
                FROM DashboardProjectsEvents
                WHERE ItemType = 'Project' AND Status = 'Active';");

            response.UpcomingEvents = await GetScalarIntAsync(connection, @"
                SELECT COUNT(*)
                FROM DashboardProjectsEvents
                WHERE ItemType = 'Event' AND EventDate >= UTC_DATE();");

            response.PendingTasks = await GetScalarIntAsync(connection, @"
                SELECT COALESCE(SUM(TaskCount), 0)
                FROM DashboardWeeklyTasks
                WHERE WeekStart = @WeekStart;", ("@WeekStart", weekStart));

            response.DonationsRaised = await GetScalarDecimalAsync(connection, @"
                SELECT COALESCE(SUM(RaisedAmount), 0)
                FROM DashboardProjectsEvents
                WHERE ItemType = 'Donation Drive';");

            response.RecentActivity = await GetRecentActivityAsync(connection);
            response.UpcomingSchedule = await GetUpcomingAsync(connection);
            response.WeeklyTasks = await GetWeeklyTasksAsync(connection, weekStart);
            response.ProjectsEvents = await GetProjectsEventsAsync(connection);

            return response;
        }

        private async Task EnsureDashboardTablesAsync()
        {
            using var connection = new MySqlConnection(_connectionString);
            await connection.OpenAsync();

            const string query = @"
                CREATE TABLE IF NOT EXISTS DashboardProjectsEvents (
                    Id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    Title VARCHAR(160) NOT NULL,
                    Description TEXT NOT NULL,
                    ItemType VARCHAR(40) NOT NULL,
                    Status VARCHAR(40) NOT NULL,
                    MembersCount INT NOT NULL,
                    EventDate DATE NOT NULL,
                    TimeRange VARCHAR(40) NULL,
                    RaisedAmount DECIMAL(14,2) NULL,
                    GoalAmount DECIMAL(14,2) NULL,
                    CreatedAt DATETIME NOT NULL
                );

                CREATE TABLE IF NOT EXISTS DashboardActivities (
                    Id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    Actor VARCHAR(120) NOT NULL,
                    ActionText VARCHAR(255) NOT NULL,
                    TargetText VARCHAR(160) NOT NULL,
                    OccurredAt DATETIME NOT NULL
                );

                CREATE TABLE IF NOT EXISTS DashboardWeeklyTasks (
                    Id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    WeekStart DATE NOT NULL,
                    DayIndex TINYINT NOT NULL,
                    TaskCount INT NOT NULL,
                    UNIQUE KEY UX_DashboardWeeklyTasks_WeekDay (WeekStart, DayIndex)
                );";

            using var command = new MySqlCommand(query, connection);
            await command.ExecuteNonQueryAsync();
        }

        private static async Task<int> GetScalarIntAsync(MySqlConnection connection, string query, params (string Name, object Value)[] parameters)
        {
            using var command = new MySqlCommand(query, connection);
            foreach (var (name, value) in parameters)
            {
                command.Parameters.AddWithValue(name, value);
            }

            var result = await command.ExecuteScalarAsync();
            return result is null || result is DBNull ? 0 : Convert.ToInt32(result, CultureInfo.InvariantCulture);
        }

        private static async Task<decimal> GetScalarDecimalAsync(MySqlConnection connection, string query, params (string Name, object Value)[] parameters)
        {
            using var command = new MySqlCommand(query, connection);
            foreach (var (name, value) in parameters)
            {
                command.Parameters.AddWithValue(name, value);
            }

            var result = await command.ExecuteScalarAsync();
            return result is null || result is DBNull ? 0m : Convert.ToDecimal(result, CultureInfo.InvariantCulture);
        }

        private static async Task<List<ActivityItem>> GetRecentActivityAsync(MySqlConnection connection)
        {
            var result = new List<ActivityItem>();
            const string query = @"
                SELECT Actor, ActionText, TargetText, OccurredAt
                FROM DashboardActivities
                ORDER BY OccurredAt DESC
                LIMIT 5;";

            using var command = new MySqlCommand(query, connection);
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

        private static async Task<List<UpcomingItem>> GetUpcomingAsync(MySqlConnection connection)
        {
            var result = new List<UpcomingItem>();
            const string query = @"
                SELECT EventDate, Title, COALESCE(TimeRange, '09:00 - 16:00') AS TimeRange
                FROM DashboardProjectsEvents
                WHERE ItemType = 'Event'
                  AND EventDate >= UTC_DATE()
                ORDER BY EventDate ASC
                LIMIT 3;";

            using var command = new MySqlCommand(query, connection);
            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                result.Add(new UpcomingItem
                {
                    EventDate = Convert.ToDateTime(reader["EventDate"], CultureInfo.InvariantCulture).Date,
                    Title = reader["Title"].ToString() ?? string.Empty,
                    TimeRange = reader["TimeRange"].ToString() ?? "09:00 - 16:00"
                });
            }

            return result;
        }

        private static async Task<List<WeeklyTaskPoint>> GetWeeklyTasksAsync(MySqlConnection connection, DateTime weekStart)
        {
            var raw = new Dictionary<int, int>();
            const string query = @"
                SELECT DayIndex, TaskCount
                FROM DashboardWeeklyTasks
                WHERE WeekStart = @WeekStart;";

            using (var command = new MySqlCommand(query, connection))
            {
                command.Parameters.AddWithValue("@WeekStart", weekStart);
                using var reader = await command.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    raw[Convert.ToInt32(reader["DayIndex"], CultureInfo.InvariantCulture)] =
                        Convert.ToInt32(reader["TaskCount"], CultureInfo.InvariantCulture);
                }
            }

            var dayNames = new[] { "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun" };
            var result = new List<WeeklyTaskPoint>();
            for (var dayIndex = 0; dayIndex < 7; dayIndex++)
            {
                result.Add(new WeeklyTaskPoint
                {
                    Day = dayNames[dayIndex],
                    Value = raw.TryGetValue(dayIndex, out var value) ? value : 0
                });
            }

            return result;
        }

        private static async Task<List<ProjectEventItem>> GetProjectsEventsAsync(MySqlConnection connection)
        {
            var result = new List<ProjectEventItem>();
            const string query = @"
                SELECT Id, Title, Description, ItemType, Status, MembersCount, EventDate, RaisedAmount, GoalAmount
                FROM DashboardProjectsEvents
                ORDER BY CreatedAt DESC;";

            using var command = new MySqlCommand(query, connection);
            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                result.Add(new ProjectEventItem
                {
                    Id = Convert.ToInt64(reader["Id"], CultureInfo.InvariantCulture),
                    Title = reader["Title"].ToString() ?? string.Empty,
                    Description = reader["Description"].ToString() ?? string.Empty,
                    ItemType = reader["ItemType"].ToString() ?? string.Empty,
                    Status = reader["Status"].ToString() ?? string.Empty,
                    MembersCount = Convert.ToInt32(reader["MembersCount"], CultureInfo.InvariantCulture),
                    EventDate = Convert.ToDateTime(reader["EventDate"], CultureInfo.InvariantCulture).Date,
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
