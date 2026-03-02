namespace coordina.DashboardManagement.Models
{
    public class DashboardOverviewResponse
    {
        public int ActiveProjects { get; set; }
        public int UpcomingEvents { get; set; }
        public int PendingTasks { get; set; }
        public decimal DonationsRaised { get; set; }
        public List<ActivityItem> RecentActivity { get; set; } = new();
        public List<UpcomingItem> UpcomingSchedule { get; set; } = new();
        public List<WeeklyTaskPoint> WeeklyTasks { get; set; } = new();
        public List<ProjectEventItem> ProjectsEvents { get; set; } = new();
    }

    public class ActivityItem
    {
        public string Actor { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string Target { get; set; } = string.Empty;
        public DateTime OccurredAt { get; set; }
    }

    public class UpcomingItem
    {
        public DateTime EventDate { get; set; }
        public string Title { get; set; } = string.Empty;
        public string TimeRange { get; set; } = string.Empty;
    }

    public class WeeklyTaskPoint
    {
        public string Day { get; set; } = string.Empty;
        public int Value { get; set; }
    }

    public class ProjectEventItem
    {
        public long Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string ItemType { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int MembersCount { get; set; }
        public DateTime EventDate { get; set; }
        public decimal? RaisedAmount { get; set; }
        public decimal? GoalAmount { get; set; }
    }
}
