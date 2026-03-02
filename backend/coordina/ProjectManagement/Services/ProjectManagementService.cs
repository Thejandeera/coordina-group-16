using coordina.ProjectManagement.Interface;
using coordina.ProjectManagement.Models;
using MySql.Data.MySqlClient;
using System.Data.Common;
using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace coordina.ProjectManagement.Services
{
    public class ProjectManagementService : IProjectManagementService
    {
        private static readonly HashSet<string> AllowedTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            "Project",
            "Event",
            "Donation Drive"
        };

        private readonly string _connectionString;

        public ProjectManagementService(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
        }

        public async Task<IReadOnlyList<ProjectEntityItemResponse>> GetEntitiesAsync(string? search, string? type)
        {
            await EnsureTableAsync();

            var items = new List<ProjectEntityItemResponse>();
            var queryBuilder = new StringBuilder(@"
                SELECT Id, Name, Description, EntityType, Status, StartDate, EndDate, Goals, MembersCount, RaisedAmount, GoalAmount, PadletEvidence
                FROM ProjectManagementEntities
                WHERE 1=1");

            using var connection = new MySqlConnection(_connectionString);
            await connection.OpenAsync();
            using var command = new MySqlCommand { Connection = connection };

            if (!string.IsNullOrWhiteSpace(search))
            {
                queryBuilder.Append(" AND (Name LIKE @Search OR Description LIKE @Search)");
                command.Parameters.AddWithValue("@Search", $"%{search.Trim()}%");
            }

            if (!string.IsNullOrWhiteSpace(type) && !string.Equals(type, "All Types", StringComparison.OrdinalIgnoreCase))
            {
                queryBuilder.Append(" AND EntityType = @EntityType");
                command.Parameters.AddWithValue("@EntityType", NormalizeType(type));
            }

            queryBuilder.Append(" ORDER BY CreatedAt DESC;");
            command.CommandText = queryBuilder.ToString();

            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                items.Add(MapEntity(reader));
            }

            return items;
        }

        public async Task<ProjectEntityItemResponse> CreateEntityAsync(CreateProjectEntityRequest request)
        {
            await EnsureTableAsync();

            var entityType = NormalizeType(request.Type);
            var startDate = request.StartDate.Date;
            var endDate = request.EndDate?.Date;
            var status = ResolveStatus(entityType, startDate, endDate);
            
            // Overriding fields based on logical rules: 
            // - Events/Projects get MembersCount, not RaisedAmount/GoalAmount
            // - Donation Drives get RaisedAmount/GoalAmount, PadletEvidence
            var goalAmount = entityType == "Donation Drive" ? request.GoalAmount : null;
            var raisedAmount = entityType == "Donation Drive" ? request.RaisedAmount : null;
            var membersCount = (entityType == "Event" || entityType == "Project") ? (request.MembersCount ?? 0) : 0;
            var padletEvidence = entityType == "Donation Drive" ? request.PadletEvidence?.Trim() : null;

            using var connection = new MySqlConnection(_connectionString);
            await connection.OpenAsync();

            const string insertQuery = @"
                INSERT INTO ProjectManagementEntities
                (Name, Description, EntityType, Status, StartDate, EndDate, Goals, MembersCount, RaisedAmount, GoalAmount, PadletEvidence, CreatedAt)
                VALUES
                (@Name, @Description, @EntityType, @Status, @StartDate, @EndDate, @Goals, @MembersCount, @RaisedAmount, @GoalAmount, @PadletEvidence, UTC_TIMESTAMP());
                SELECT LAST_INSERT_ID();";

            using var insertCommand = new MySqlCommand(insertQuery, connection);
            insertCommand.Parameters.AddWithValue("@Name", request.Name.Trim());
            insertCommand.Parameters.AddWithValue("@Description", request.Description.Trim());
            insertCommand.Parameters.AddWithValue("@EntityType", entityType);
            insertCommand.Parameters.AddWithValue("@Status", status);
            insertCommand.Parameters.AddWithValue("@StartDate", startDate);
            insertCommand.Parameters.AddWithValue("@EndDate", endDate);
            insertCommand.Parameters.AddWithValue("@Goals", string.IsNullOrWhiteSpace(request.Goals) ? DBNull.Value : request.Goals.Trim());
            insertCommand.Parameters.AddWithValue("@MembersCount", membersCount);
            insertCommand.Parameters.AddWithValue("@RaisedAmount", raisedAmount.HasValue ? raisedAmount.Value : DBNull.Value);
            insertCommand.Parameters.AddWithValue("@GoalAmount", goalAmount.HasValue ? goalAmount.Value : DBNull.Value);
            insertCommand.Parameters.AddWithValue("@PadletEvidence", string.IsNullOrWhiteSpace(padletEvidence) ? DBNull.Value : padletEvidence);

            var insertedId = Convert.ToInt64(await insertCommand.ExecuteScalarAsync(), CultureInfo.InvariantCulture);

            const string fetchQuery = @"
                SELECT Id, Name, Description, EntityType, Status, StartDate, EndDate, Goals, MembersCount, RaisedAmount, GoalAmount, PadletEvidence
                FROM ProjectManagementEntities
                WHERE Id = @Id;";

            using var fetchCommand = new MySqlCommand(fetchQuery, connection);
            fetchCommand.Parameters.AddWithValue("@Id", insertedId);
            using var reader = await fetchCommand.ExecuteReaderAsync();
            if (!await reader.ReadAsync())
            {
                throw new InvalidOperationException("Created entity could not be loaded.");
            }

            var mappedEntity = MapEntity(reader);
            
            await LogActivityAsync("created a new", $"{entityType}: {mappedEntity.Name}");

            return mappedEntity;
        }

        public async Task<ProjectEntityItemResponse> UpdateEntityAsync(long id, UpdateProjectEntityRequest request)
        {
            await EnsureTableAsync();

            var entityType = NormalizeType(request.Type);
            var startDate = request.StartDate.Date;
            var endDate = request.EndDate?.Date;
            var status = ResolveStatus(entityType, startDate, endDate);

            var goalAmount = entityType == "Donation Drive" ? request.GoalAmount : null;
            var raisedAmount = entityType == "Donation Drive" ? request.RaisedAmount : null;
            var membersCount = (entityType == "Event" || entityType == "Project") ? (request.MembersCount ?? 0) : 0;
            var padletEvidence = entityType == "Donation Drive" ? request.PadletEvidence?.Trim() : null;

            using var connection = new MySqlConnection(_connectionString);
            await connection.OpenAsync();

            const string updateQuery = @"
                UPDATE ProjectManagementEntities
                SET Name = @Name,
                    Description = @Description,
                    EntityType = @EntityType,
                    Status = @Status,
                    StartDate = @StartDate,
                    EndDate = @EndDate,
                    Goals = @Goals,
                    MembersCount = @MembersCount,
                    RaisedAmount = @RaisedAmount,
                    GoalAmount = @GoalAmount,
                    PadletEvidence = @PadletEvidence
                WHERE Id = @Id;";

            using var updateCommand = new MySqlCommand(updateQuery, connection);
            updateCommand.Parameters.AddWithValue("@Id", id);
            updateCommand.Parameters.AddWithValue("@Name", request.Name.Trim());
            updateCommand.Parameters.AddWithValue("@Description", request.Description.Trim());
            updateCommand.Parameters.AddWithValue("@EntityType", entityType);
            updateCommand.Parameters.AddWithValue("@Status", status);
            updateCommand.Parameters.AddWithValue("@StartDate", startDate);
            updateCommand.Parameters.AddWithValue("@EndDate", endDate.HasValue ? endDate.Value : DBNull.Value);
            updateCommand.Parameters.AddWithValue("@Goals", string.IsNullOrWhiteSpace(request.Goals) ? DBNull.Value : request.Goals.Trim());
            updateCommand.Parameters.AddWithValue("@MembersCount", membersCount);
            updateCommand.Parameters.AddWithValue("@RaisedAmount", raisedAmount.HasValue ? raisedAmount.Value : DBNull.Value);
            updateCommand.Parameters.AddWithValue("@GoalAmount", goalAmount.HasValue ? goalAmount.Value : DBNull.Value);
            updateCommand.Parameters.AddWithValue("@PadletEvidence", string.IsNullOrWhiteSpace(padletEvidence) ? DBNull.Value : padletEvidence);

            var rowsAffected = await updateCommand.ExecuteNonQueryAsync();
            if (rowsAffected == 0)
            {
                const string checkQuery = "SELECT COUNT(*) FROM ProjectManagementEntities WHERE Id = @Id;";
                using var checkCommand = new MySqlCommand(checkQuery, connection);
                checkCommand.Parameters.AddWithValue("@Id", id);
                var exists = Convert.ToInt32(await checkCommand.ExecuteScalarAsync()) > 0;
                
                if (!exists)
                {
                    throw new ArgumentException($"Entity with ID {id} not found.");
                }
            }

            const string fetchQuery = @"
                SELECT Id, Name, Description, EntityType, Status, StartDate, EndDate, Goals, MembersCount, RaisedAmount, GoalAmount, PadletEvidence
                FROM ProjectManagementEntities
                WHERE Id = @Id;";

            using var fetchCommand = new MySqlCommand(fetchQuery, connection);
            fetchCommand.Parameters.AddWithValue("@Id", id);
            using var reader = await fetchCommand.ExecuteReaderAsync();
            if (!await reader.ReadAsync())
            {
                throw new InvalidOperationException("Updated entity could not be loaded.");
            }

            var mappedEntity = MapEntity(reader);

            await LogActivityAsync("updated the", $"{entityType}: {mappedEntity.Name}");

            return mappedEntity;
        }

        public async Task DeleteEntityAsync(long id)
        {
            await EnsureTableAsync();

            using var connection = new MySqlConnection(_connectionString);
            await connection.OpenAsync();

            // Fetch entity name for logging before it gets deleted
            string? entityName = null;
            string? entityType = null;
            const string fetchQuery = "SELECT Name, EntityType FROM ProjectManagementEntities WHERE Id = @Id;";
            using (var fetchCommand = new MySqlCommand(fetchQuery, connection))
            {
                fetchCommand.Parameters.AddWithValue("@Id", id);
                using var reader = await fetchCommand.ExecuteReaderAsync();
                if (await reader.ReadAsync())
                {
                    entityName = reader["Name"].ToString();
                    entityType = reader["EntityType"].ToString();
                }
            }

            const string deleteQuery = @"
                DELETE FROM ProjectManagementEntities
                WHERE Id = @Id;";

            using var deleteCommand = new MySqlCommand(deleteQuery, connection);
            deleteCommand.Parameters.AddWithValue("@Id", id);
            
            var rowsAffected = await deleteCommand.ExecuteNonQueryAsync();
            if (rowsAffected == 0)
            {
                throw new ArgumentException($"Entity with ID {id} not found.");
            }

            if (entityName != null && entityType != null)
            {
                await LogActivityAsync("deleted the", $"{entityType}: {entityName}");
            }
        }

        private async Task EnsureTableAsync()
        {
            using var connection = new MySqlConnection(_connectionString);
            await connection.OpenAsync();

            const string query = @"
                CREATE TABLE IF NOT EXISTS ProjectManagementEntities (
                    Id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    Name VARCHAR(160) NOT NULL,
                    Description TEXT NOT NULL,
                    EntityType VARCHAR(40) NOT NULL,
                    Status VARCHAR(40) NOT NULL,
                    StartDate DATE NOT NULL,
                    EndDate DATE NULL,
                    Goals VARCHAR(255) NULL,
                    MembersCount INT NOT NULL DEFAULT 0,
                    RaisedAmount DECIMAL(14,2) NULL,
                    GoalAmount DECIMAL(14,2) NULL,
                    PadletEvidence VARCHAR(500) NULL,
                    CreatedAt DATETIME NOT NULL
                );";

            using var command = new MySqlCommand(query, connection);
            await command.ExecuteNonQueryAsync();

            // Check if PadletEvidence column exists, and add it if it doesnt (for backward compatibility during migration)
            try
            {
                 const string alterQuery = "ALTER TABLE ProjectManagementEntities ADD COLUMN IF NOT EXISTS PadletEvidence VARCHAR(500) NULL;";
                 using var alterCommand = new MySqlCommand(alterQuery, connection);
                 await alterCommand.ExecuteNonQueryAsync();
            }
            catch(Exception)
            {
                 // Ignore if error, it might mean the syntax isn't perfectly supported on this MySQL version or column exists via other means
            }
        }

        private static ProjectEntityItemResponse MapEntity(DbDataReader reader)
        {
            return new ProjectEntityItemResponse
            {
                Id = Convert.ToInt64(reader["Id"], CultureInfo.InvariantCulture),
                Name = reader["Name"].ToString() ?? string.Empty,
                Description = reader["Description"].ToString() ?? string.Empty,
                Type = reader["EntityType"].ToString() ?? string.Empty,
                Status = reader["Status"].ToString() ?? string.Empty,
                StartDate = Convert.ToDateTime(reader["StartDate"], CultureInfo.InvariantCulture).Date,
                EndDate = reader["EndDate"] is DBNull
                    ? null
                    : Convert.ToDateTime(reader["EndDate"], CultureInfo.InvariantCulture).Date,
                Goals = reader["Goals"] is DBNull ? null : reader["Goals"].ToString(),
                MembersCount = Convert.ToInt32(reader["MembersCount"], CultureInfo.InvariantCulture),
                RaisedAmount = reader["RaisedAmount"] is DBNull ? null : Convert.ToDecimal(reader["RaisedAmount"], CultureInfo.InvariantCulture),
                GoalAmount = reader["GoalAmount"] is DBNull ? null : Convert.ToDecimal(reader["GoalAmount"], CultureInfo.InvariantCulture),
                PadletEvidence = reader["PadletEvidence"] is DBNull ? null : reader["PadletEvidence"].ToString()
            };
        }

        private static string NormalizeType(string input)
        {
            var normalized = input.Trim();
            foreach (var allowedType in AllowedTypes)
            {
                if (string.Equals(allowedType, normalized, StringComparison.OrdinalIgnoreCase))
                {
                    return allowedType;
                }
            }

            throw new ArgumentException("Type must be one of: Project, Event, Donation Drive.");
        }

        private static string ResolveStatus(string entityType, DateTime startDate, DateTime? endDate)
        {
            var today = DateTime.UtcNow.Date;

            if (endDate.HasValue && endDate.Value < today)
            {
                return "Completed";
            }

            if (entityType == "Event" && startDate > today)
            {
                return "Upcoming";
            }

            return "Active";
        }

        private static decimal? TryExtractGoalAmount(string? goals)
        {
            if (string.IsNullOrWhiteSpace(goals))
            {
                return null;
            }

            var numericPart = Regex.Replace(goals, @"[^\d\.]", string.Empty);
            if (string.IsNullOrWhiteSpace(numericPart))
            {
                return null;
            }

            return decimal.TryParse(numericPart, NumberStyles.Number, CultureInfo.InvariantCulture, out var value)
                ? value
                : null;
        }

        private async Task LogActivityAsync(string actionText, string targetText)
        {
            try
            {
                using var connection = new MySqlConnection(_connectionString);
                await connection.OpenAsync();

                const string query = @"
                    INSERT INTO DashboardActivities (Actor, ActionText, TargetText, OccurredAt)
                    VALUES (@Actor, @ActionText, @TargetText, UTC_TIMESTAMP());";

                using var command = new MySqlCommand(query, connection);
                // Currently using a placeholder "A user" until RBAC is fully implemented
                command.Parameters.AddWithValue("@Actor", "A user"); 
                command.Parameters.AddWithValue("@ActionText", actionText);
                command.Parameters.AddWithValue("@TargetText", targetText);

                await command.ExecuteNonQueryAsync();
            }
            catch (Exception ex)
            {
                // Silently swallow logging errors so they never block the main Create/Update flow
                Console.WriteLine($"Failed to log activity: {ex.Message}");
            }
        }
    }
}
