using coordina.TaskManagement.Models;

namespace coordina.TaskManagement.Interface
{
    public interface ITaskManagementService
    {
        Task<IReadOnlyList<TaskResponse>> GetTasksByProjectIdAsync(long projectId);
        Task<TaskResponse> GetTaskByIdAsync(long taskId);
        Task<TaskResponse> CreateTaskAsync(long userId, CreateTaskRequest request, string userUsername);
        Task<TaskResponse> UpdateTaskAsync(long userId, long taskId, UpdateTaskRequest request);
        Task<TaskResponse> PatchTaskStatusAsync(long userId, long taskId, string status);
        Task DeleteTaskAsync(long userId, long taskId);
    }
}
