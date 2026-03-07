using coordina.TaskManagement.Models;

namespace coordina.TaskManagement.Interface
{
    public interface ITaskManagementService
    {
        Task<IReadOnlyList<TaskResponse>> GetTasksByProjectIdAsync(long projectId);
        Task<TaskResponse> GetTaskByIdAsync(long taskId);
        Task<TaskResponse> CreateTaskAsync(long userId, CreateTaskRequest request, string userUsername);
        Task<TaskResponse> UpdateTaskAsync(long taskId, UpdateTaskRequest request);
        Task DeleteTaskAsync(long taskId);
    }
}
