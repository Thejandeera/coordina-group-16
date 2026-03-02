using coordina.ProjectManagement.Models;

namespace coordina.ProjectManagement.Interface
{
    public interface IProjectManagementService
    {
        Task<IReadOnlyList<ProjectEntityItemResponse>> GetEntitiesAsync(string? search, string? type);
        Task<ProjectEntityItemResponse> CreateEntityAsync(CreateProjectEntityRequest request);
        Task<ProjectEntityItemResponse> UpdateEntityAsync(long id, UpdateProjectEntityRequest request);
        Task DeleteEntityAsync(long id);
    }
}
