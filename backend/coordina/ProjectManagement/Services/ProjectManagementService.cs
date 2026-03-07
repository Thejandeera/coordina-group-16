using coordina.ProjectManagement.Interface;
using coordina.ProjectManagement.Models;
using Npgsql;
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
                SELECT Id, Name, Description, EntityType, Status, StartDate, EndDate, Goals, MembersCount, RaisedAmount, GoalAmount, PadletEvidence, CreatedByUserId
                FROM ProjectManagementEntities
                WHERE 1=1");

            using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();
            using var command = new NpgsqlCommand { Connection = connection };

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

        public async Task<IReadOnlyList<ProjectEntityItemResponse>> GetEntitiesByUserIdAsync(long userId, string? search, string? type)
        {
            await EnsureTableAsync();

            var items = new List<ProjectEntityItemResponse>();
            var queryBuilder = new StringBuilder(@"
                SELECT p.Id, p.Name, p.Description, p.EntityType, p.Status, p.StartDate, p.EndDate, p.Goals, p.MembersCount, p.RaisedAmount, p.GoalAmount, p.PadletEvidence, p.CreatedByUserId
                FROM ProjectManagementEntities p
                LEFT JOIN ProjectMembers pm ON p.Id = pm.ProjectId
                WHERE (p.CreatedByUserId = @UserId OR pm.UserId = @UserId)");

            using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();
            using var command = new NpgsqlCommand { Connection = connection };
            command.Parameters.AddWithValue("@UserId", userId);

            if (!string.IsNullOrWhiteSpace(search))
            {
                queryBuilder.Append(" AND (p.Name LIKE @Search OR p.Description LIKE @Search)");
                command.Parameters.AddWithValue("@Search", $"%{search.Trim()}%");
            }

            if (!string.IsNullOrWhiteSpace(type) && !string.Equals(type, "All Types", StringComparison.OrdinalIgnoreCase))
            {
                queryBuilder.Append(" AND p.EntityType = @EntityType");
                command.Parameters.AddWithValue("@EntityType", NormalizeType(type));
            }

            queryBuilder.Append(" GROUP BY p.Id ORDER BY p.CreatedAt DESC;");
            command.CommandText = queryBuilder.ToString();

            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                items.Add(MapEntity(reader));
            }

            return items;
        }

        public async Task<ProjectEntityItemResponse> CreateEntityAsync(long userId, CreateProjectEntityRequest request)
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

            using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();

            const string insertQuery = @"
                INSERT INTO ProjectManagementEntities
                (Name, Description, EntityType, Status, StartDate, EndDate, Goals, MembersCount, RaisedAmount, GoalAmount, PadletEvidence, CreatedByUserId, CreatedAt)
                VALUES
                (@Name, @Description, @EntityType, @Status, @StartDate, @EndDate, @Goals, @MembersCount, @RaisedAmount, @GoalAmount, @PadletEvidence, @CreatedByUserId, CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
                RETURNING Id;";

            using var insertCommand = new NpgsqlCommand(insertQuery, connection);
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
            insertCommand.Parameters.AddWithValue("@CreatedByUserId", userId);

            var insertedId = Convert.ToInt64(await insertCommand.ExecuteScalarAsync(), CultureInfo.InvariantCulture);

            const string addAdminQuery = @"
                INSERT INTO ProjectMembers (ProjectId, UserId, Role, JoinedAt)
                VALUES (@ProjectId, @UserId, 'Admin', CURRENT_TIMESTAMP AT TIME ZONE 'UTC');";

            using var adminCommand = new NpgsqlCommand(addAdminQuery, connection);
            adminCommand.Parameters.AddWithValue("@ProjectId", insertedId);
            adminCommand.Parameters.AddWithValue("@UserId", userId);
            await adminCommand.ExecuteNonQueryAsync();

            const string fetchQuery = @"
                SELECT Id, Name, Description, EntityType, Status, StartDate, EndDate, Goals, MembersCount, RaisedAmount, GoalAmount, PadletEvidence, CreatedByUserId
                FROM ProjectManagementEntities
                WHERE Id = @Id;";

            using var fetchCommand = new NpgsqlCommand(fetchQuery, connection);
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

            using var connection = new NpgsqlConnection(_connectionString);
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

            using var updateCommand = new NpgsqlCommand(updateQuery, connection);
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
                using var checkCommand = new NpgsqlCommand(checkQuery, connection);
                checkCommand.Parameters.AddWithValue("@Id", id);
                var exists = Convert.ToInt32(await checkCommand.ExecuteScalarAsync()) > 0;

                if (!exists)
                {
                    throw new ArgumentException($"Entity with ID {id} not found.");
                }
            }

            const string fetchQuery = @"
                SELECT Id, Name, Description, EntityType, Status, StartDate, EndDate, Goals, MembersCount, RaisedAmount, GoalAmount, PadletEvidence, CreatedByUserId
                FROM ProjectManagementEntities
                WHERE Id = @Id;";

            using var fetchCommand = new NpgsqlCommand(fetchQuery, connection);
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

            using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();

            // Fetch entity name for logging before it gets deleted
            string? entityName = null;
            string? entityType = null;
            const string fetchQuery = "SELECT Name, EntityType FROM ProjectManagementEntities WHERE Id = @Id;";
            using (var fetchCommand = new NpgsqlCommand(fetchQuery, connection))
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

            using var deleteCommand = new NpgsqlCommand(deleteQuery, connection);
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
            using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();

            const string query = @"
                CREATE TABLE IF NOT EXISTS ProjectManagementEntities (
                    Id BIGSERIAL PRIMARY KEY,
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
                    CreatedAt TIMESTAMP NOT NULL
                );";

            using var command = new NpgsqlCommand(query, connection);
            await command.ExecuteNonQueryAsync();

            // Check if PadletEvidence column exists, and add it if it doesnt (for backward compatibility during migration)
            try
            {
                const string alterQuery = @"
                    ALTER TABLE ProjectManagementEntities ADD COLUMN IF NOT EXISTS PadletEvidence VARCHAR(500);
                    ALTER TABLE ProjectManagementEntities ADD COLUMN IF NOT EXISTS CreatedByUserId BIGINT NULL;
                ";
                using var alterCommand = new NpgsqlCommand(alterQuery, connection);
                await alterCommand.ExecuteNonQueryAsync();
            }
            catch (Exception)
            {
                // Ignore if error
            }

            const string membersQuery = @"
                CREATE TABLE IF NOT EXISTS ProjectMembers (
                    Id BIGSERIAL PRIMARY KEY,
                    ProjectId BIGINT NOT NULL,
                    UserId BIGINT NOT NULL,
                    Role VARCHAR(20) NOT NULL,
                    JoinedAt TIMESTAMP NOT NULL,
                    UNIQUE(ProjectId, UserId)
                );";

            using var membersCommand = new NpgsqlCommand(membersQuery, connection);
            await membersCommand.ExecuteNonQueryAsync();

            // Backward compatibility migration: assign Admin role to legacy creators
            try
            {
                const string migrateCreatorsQuery = @"
                    INSERT INTO ProjectMembers (ProjectId, UserId, Role, JoinedAt)
                    SELECT Id, CreatedByUserId, 'Admin', CreatedAt
                    FROM ProjectManagementEntities p
                    WHERE CreatedByUserId IS NOT NULL
                    AND NOT EXISTS (
                        SELECT 1 FROM ProjectMembers pm 
                        WHERE pm.ProjectId = p.Id AND pm.UserId = p.CreatedByUserId
                    );";
                using var migrateCmd = new NpgsqlCommand(migrateCreatorsQuery, connection);
                await migrateCmd.ExecuteNonQueryAsync();
            }
            catch (Exception)
            {
                // Ignore if error during migration
            }
        }

        private static DateTime ParseDate(object value)
        {
            if (value is DateOnly dateOnly)
            {
                return dateOnly.ToDateTime(TimeOnly.MinValue);
            }
            return Convert.ToDateTime(value, CultureInfo.InvariantCulture).Date;
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
                StartDate = ParseDate(reader["StartDate"]),
                EndDate = reader["EndDate"] is DBNull ? null : ParseDate(reader["EndDate"]),
                Goals = reader["Goals"] is DBNull ? null : reader["Goals"].ToString(),
                MembersCount = Convert.ToInt32(reader["MembersCount"], CultureInfo.InvariantCulture),
                RaisedAmount = reader["RaisedAmount"] is DBNull ? null : Convert.ToDecimal(reader["RaisedAmount"], CultureInfo.InvariantCulture),
                GoalAmount = reader["GoalAmount"] is DBNull ? null : Convert.ToDecimal(reader["GoalAmount"], CultureInfo.InvariantCulture),
                PadletEvidence = reader["PadletEvidence"] is DBNull ? null : reader["PadletEvidence"].ToString(),
                CreatedByUserId = reader["CreatedByUserId"] is DBNull ? null : Convert.ToInt64(reader["CreatedByUserId"], CultureInfo.InvariantCulture)
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
                using var connection = new NpgsqlConnection(_connectionString);
                await connection.OpenAsync();

                const string query = @"
                    INSERT INTO DashboardActivities (Actor, ActionText, TargetText, OccurredAt)
                    VALUES (@Actor, @ActionText, @TargetText, CURRENT_TIMESTAMP AT TIME ZONE 'UTC');";

                using var command = new NpgsqlCommand(query, connection);
                // Currently using a placeholder "A user" until RBAC is fully implemented
                command.Parameters.AddWithValue("@Actor", "A user");
                command.Parameters.AddWithValue("@ActionText", actionText);
                command.Parameters.AddWithValue("@TargetText", targetText);

                await command.ExecuteNonQueryAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to log activity: {ex.Message}");
            }
        }

        public async Task InviteUserAsync(long projectId, long inviterUserId, InviteMemberRequest request)
        {
            await EnsureTableAsync();

            using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();

            const string checkProjectQuery = "SELECT COUNT(1) FROM ProjectManagementEntities WHERE Id = @ProjectId;";
            using var checkProjectCmd = new NpgsqlCommand(checkProjectQuery, connection);
            checkProjectCmd.Parameters.AddWithValue("@ProjectId", projectId);
            if (Convert.ToInt32(await checkProjectCmd.ExecuteScalarAsync()) == 0)
            {
                throw new ArgumentException("Associated project not found.");
            }

            const string checkAdminQuery = "SELECT Role FROM ProjectMembers WHERE ProjectId = @ProjectId AND UserId = @UserId LIMIT 1;";
            using var checkAdminCmd = new NpgsqlCommand(checkAdminQuery, connection);
            checkAdminCmd.Parameters.AddWithValue("@ProjectId", projectId);
            checkAdminCmd.Parameters.AddWithValue("@UserId", inviterUserId);
            var inviterRole = await checkAdminCmd.ExecuteScalarAsync();
            if (inviterRole == null || inviterRole.ToString() != "Admin")
            {
                throw new UnauthorizedAccessException("Only Admins can invite new members to the project.");
            }

            // Upsert the member (if they exist, update role; if not, insert)
            const string insertMemberQuery = @"
                INSERT INTO ProjectMembers (ProjectId, UserId, Role, JoinedAt)
                VALUES (@ProjectId, @UserId, @Role, CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
                ON CONFLICT (ProjectId, UserId)
                DO UPDATE SET Role = EXCLUDED.Role;";

            using var insertCmd = new NpgsqlCommand(insertMemberQuery, connection);
            insertCmd.Parameters.AddWithValue("@ProjectId", projectId);
            insertCmd.Parameters.AddWithValue("@UserId", request.UserId);
            insertCmd.Parameters.AddWithValue("@Role", request.Role);
            await insertCmd.ExecuteNonQueryAsync();

            const string updateMembersCountQuery = @"
                UPDATE ProjectManagementEntities 
                SET MembersCount = (SELECT COUNT(*) FROM ProjectMembers WHERE ProjectId = @ProjectId) 
                WHERE Id = @ProjectId;";

            using var updateCountCmd = new NpgsqlCommand(updateMembersCountQuery, connection);
            updateCountCmd.Parameters.AddWithValue("@ProjectId", projectId);
            await updateCountCmd.ExecuteNonQueryAsync();
        }

        public async Task<IReadOnlyList<ProjectMemberResponse>> GetProjectMembersAsync(long projectId)
        {
            await EnsureTableAsync();

            var members = new List<ProjectMemberResponse>();
            using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();

            const string query = @"
                SELECT pm.Id, pm.ProjectId, pm.UserId, pm.Role, pm.JoinedAt,
                       u.Username, u.Email, u.ProfileImageUrl
                FROM ProjectMembers pm
                JOIN Users u ON pm.UserId = u.Id
                WHERE pm.ProjectId = @ProjectId
                ORDER BY pm.JoinedAt ASC;";

            using var command = new NpgsqlCommand(query, connection);
            command.Parameters.AddWithValue("@ProjectId", projectId);

            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                members.Add(new ProjectMemberResponse
                {
                    Id = Convert.ToInt64(reader["Id"], CultureInfo.InvariantCulture),
                    ProjectId = Convert.ToInt64(reader["ProjectId"], CultureInfo.InvariantCulture),
                    UserId = Convert.ToInt64(reader["UserId"], CultureInfo.InvariantCulture),
                    Role = reader["Role"].ToString() ?? "Participant",
                    JoinedAt = Convert.ToDateTime(reader["JoinedAt"], CultureInfo.InvariantCulture),
                    Username = reader["Username"].ToString() ?? string.Empty,
                    Email = reader["Email"].ToString() ?? string.Empty,
                    ProfileImageUrl = reader["ProfileImageUrl"] == DBNull.Value ? null : reader["ProfileImageUrl"].ToString()
                });
            }

            return members;
        }
    }
}
