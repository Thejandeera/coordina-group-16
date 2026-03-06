using coordina.ProjectManagement.Models;

namespace coordina.ProjectManagement.Interface
{
    public interface IProjectManagementService
    {
        Task<IReadOnlyList<ProjectEntityItemResponse>> GetEntitiesAsync(string? search, string? type);
        Task<IReadOnlyList<ProjectEntityItemResponse>> GetEntitiesByUserIdAsync(long userId, string? search, string? type);
        Task<ProjectEntityItemResponse> CreateEntityAsync(long userId, CreateProjectEntityRequest request);
        Task<ProjectEntityItemResponse> UpdateEntityAsync(long id, UpdateProjectEntityRequest request);
        Task DeleteEntityAsync(long id);
    }
}
