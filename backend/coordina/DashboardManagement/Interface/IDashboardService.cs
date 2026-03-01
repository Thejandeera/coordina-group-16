using coordina.DashboardManagement.Models;

namespace coordina.DashboardManagement.Interface
{
    public interface IDashboardService
    {
        Task<DashboardOverviewResponse> GetOverviewAsync();
    }
}
