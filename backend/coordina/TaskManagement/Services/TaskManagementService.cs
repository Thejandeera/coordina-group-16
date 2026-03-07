using coordina.TaskManagement.Interface;
using coordina.TaskManagement.Models;
using Npgsql;
using System.Data.Common;
using System.Globalization;
using System.Text;

namespace coordina.TaskManagement.Services
{
    public class TaskManagementService : ITaskManagementService
    {
        private readonly string _connectionString;

        public TaskManagementService(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
        }

        public async Task<TaskResponse> CreateTaskAsync(long userId, CreateTaskRequest request, string userUsername)
        {
            await EnsureTableAsync();

            using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();
            
            // First check if project exists
            const string checkProjectQuery = "SELECT COUNT(*) FROM ProjectManagementEntities WHERE Id = @ProjectId;";
            using var checkProjectCmd = new NpgsqlCommand(checkProjectQuery, connection);
            checkProjectCmd.Parameters.AddWithValue("@ProjectId", request.ProjectId);
            if (Convert.ToInt32(await checkProjectCmd.ExecuteScalarAsync()) == 0)
            {
                 throw new ArgumentException("Associated project not found.");
            }

            // Verify parent task if specified
            if (request.ParentTaskId.HasValue)
            {
                const string checkParentQuery = "SELECT ProjectId FROM TaskEntities WHERE Id = @ParentId;";
                using var checkParentCmd = new NpgsqlCommand(checkParentQuery, connection);
                checkParentCmd.Parameters.AddWithValue("@ParentId", request.ParentTaskId.Value);
                var parentProjectId = await checkParentCmd.ExecuteScalarAsync();
                
                if (parentProjectId == null)
                {
                    throw new ArgumentException("Parent task not found.");
                }

                if (Convert.ToInt64(parentProjectId, CultureInfo.InvariantCulture) != request.ProjectId)
                {
                    throw new ArgumentException("Parent task must belong to the same project.");
                }
            }

            const string insertQuery = @"
                INSERT INTO TaskEntities
                (ProjectId, AssigneeId, AssigneeInitials, Description, DueDate, Status, Priority, ParentTaskId, CreatedAt, UpdatedAt)
                VALUES
                (@ProjectId, @AssigneeId, @AssigneeInitials, @Description, @DueDate, @Status, @Priority, @ParentTaskId, CURRENT_TIMESTAMP AT TIME ZONE 'UTC', CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
                RETURNING Id;";

            string initials = "U";
            if (!string.IsNullOrWhiteSpace(userUsername))
            {
                 initials = userUsername.Substring(0, Math.Min(2, userUsername.Length)).ToUpperInvariant();
            }

            using var insertCommand = new NpgsqlCommand(insertQuery, connection);
            insertCommand.Parameters.AddWithValue("@ProjectId", request.ProjectId);
            insertCommand.Parameters.AddWithValue("@AssigneeId", userId);
            insertCommand.Parameters.AddWithValue("@AssigneeInitials", initials);
            insertCommand.Parameters.AddWithValue("@Description", request.Description.Trim());
            insertCommand.Parameters.AddWithValue("@DueDate", request.DueDate.HasValue ? request.DueDate.Value.Date : DBNull.Value);
            insertCommand.Parameters.AddWithValue("@Status", request.Status);
            insertCommand.Parameters.AddWithValue("@Priority", request.Priority);
            insertCommand.Parameters.AddWithValue("@ParentTaskId", request.ParentTaskId.HasValue ? request.ParentTaskId.Value : DBNull.Value);

            var insertedId = Convert.ToInt64(await insertCommand.ExecuteScalarAsync(), CultureInfo.InvariantCulture);

            return await GetTaskByIdAsync(insertedId);
        }

        public async Task DeleteTaskAsync(long taskId)
        {
             await EnsureTableAsync();

            using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();

            const string deleteQuery = @"
                DELETE FROM TaskEntities
                WHERE Id = @Id OR ParentTaskId = @Id;"; // Also delete subtasks

            using var deleteCommand = new NpgsqlCommand(deleteQuery, connection);
            deleteCommand.Parameters.AddWithValue("@Id", taskId);

            var rowsAffected = await deleteCommand.ExecuteNonQueryAsync();
            if (rowsAffected == 0)
            {
                throw new ArgumentException($"Task not found.");
            }
        }

        public async Task<TaskResponse> GetTaskByIdAsync(long taskId)
        {
            await EnsureTableAsync();
            using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();

            const string fetchQuery = @"
                SELECT Id, ProjectId, AssigneeId, AssigneeInitials, Description, DueDate, Status, Priority, ParentTaskId, CreatedAt, UpdatedAt
                FROM TaskEntities
                WHERE Id = @Id;";

            using var fetchCommand = new NpgsqlCommand(fetchQuery, connection);
            fetchCommand.Parameters.AddWithValue("@Id", taskId);
            using var reader = await fetchCommand.ExecuteReaderAsync();
            if (!await reader.ReadAsync())
            {
                throw new ArgumentException("Task not found.");
            }

            return MapEntity(reader);
        }

        public async Task<IReadOnlyList<TaskResponse>> GetTasksByProjectIdAsync(long projectId)
        {
           await EnsureTableAsync();

            var items = new List<TaskResponse>();
            const string query = @"
                SELECT Id, ProjectId, AssigneeId, AssigneeInitials, Description, DueDate, Status, Priority, ParentTaskId, CreatedAt, UpdatedAt
                FROM TaskEntities
                WHERE ProjectId = @ProjectId
                ORDER BY CreatedAt ASC;";

            using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();
            using var command = new NpgsqlCommand(query, connection);
            command.Parameters.AddWithValue("@ProjectId", projectId);

            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                items.Add(MapEntity(reader));
            }

            // Organize into tree
            var taskDict = items.ToDictionary(t => t.Id);
            var rootTasks = new List<TaskResponse>();

            foreach (var task in items)
            {
                if (task.ParentTaskId.HasValue && taskDict.TryGetValue(task.ParentTaskId.Value, out var parentTask))
                {
                    parentTask.Subtasks.Add(task);
                }
                else
                {
                    rootTasks.Add(task);
                }
            }

            return rootTasks;
        }

        public async Task<TaskResponse> UpdateTaskAsync(long taskId, UpdateTaskRequest request)
        {
            await EnsureTableAsync();

            using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();

            const string updateQuery = @"
                UPDATE TaskEntities
                SET Description = @Description,
                    DueDate = @DueDate,
                    Status = @Status,
                    Priority = @Priority,
                    UpdatedAt = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
                WHERE Id = @Id;";

            using var updateCommand = new NpgsqlCommand(updateQuery, connection);
            updateCommand.Parameters.AddWithValue("@Id", taskId);
            updateCommand.Parameters.AddWithValue("@Description", request.Description.Trim());
            updateCommand.Parameters.AddWithValue("@DueDate", request.DueDate.HasValue ? request.DueDate.Value.Date : DBNull.Value);
            updateCommand.Parameters.AddWithValue("@Status", request.Status);
            updateCommand.Parameters.AddWithValue("@Priority", request.Priority);

            var rowsAffected = await updateCommand.ExecuteNonQueryAsync();
            if (rowsAffected == 0)
            {
                throw new ArgumentException($"Task not found.");
            }

            return await GetTaskByIdAsync(taskId);
        }

        private async Task EnsureTableAsync()
        {
            using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();

            const string query = @"
                CREATE TABLE IF NOT EXISTS TaskEntities (
                    Id BIGSERIAL PRIMARY KEY,
                    ProjectId BIGINT NOT NULL,
                    AssigneeId BIGINT NOT NULL,
                    AssigneeInitials VARCHAR(5) NOT NULL,
                    Description TEXT NOT NULL,
                    DueDate DATE NULL,
                    Status VARCHAR(20) NOT NULL,
                    Priority INT NOT NULL DEFAULT 3,
                    ParentTaskId BIGINT NULL,
                    CreatedAt TIMESTAMP NOT NULL,
                    UpdatedAt TIMESTAMP NOT NULL
                );";

            using var command = new NpgsqlCommand(query, connection);
            await command.ExecuteNonQueryAsync();
        }

        private static TaskResponse MapEntity(DbDataReader reader)
        {
            return new TaskResponse
            {
                Id = Convert.ToInt64(reader["Id"], CultureInfo.InvariantCulture),
                ProjectId = Convert.ToInt64(reader["ProjectId"], CultureInfo.InvariantCulture),
                AssigneeId = Convert.ToInt64(reader["AssigneeId"], CultureInfo.InvariantCulture),
                AssigneeInitials = reader["AssigneeInitials"].ToString() ?? string.Empty,
                Description = reader["Description"].ToString() ?? string.Empty,
                DueDate = reader["DueDate"] is DBNull ? null : ParseDate(reader["DueDate"]),
                Status = reader["Status"].ToString() ?? string.Empty,
                Priority = Convert.ToInt32(reader["Priority"], CultureInfo.InvariantCulture),
                ParentTaskId = reader["ParentTaskId"] is DBNull ? null : Convert.ToInt64(reader["ParentTaskId"], CultureInfo.InvariantCulture),
                CreatedAt = Convert.ToDateTime(reader["CreatedAt"], CultureInfo.InvariantCulture),
                UpdatedAt = Convert.ToDateTime(reader["UpdatedAt"], CultureInfo.InvariantCulture)
            };
        }

        private static DateTime ParseDate(object value)
        {
            if (value is DateOnly dateOnly)
            {
                return dateOnly.ToDateTime(TimeOnly.MinValue);
            }
            return Convert.ToDateTime(value, CultureInfo.InvariantCulture).Date;
        }
    }
}
