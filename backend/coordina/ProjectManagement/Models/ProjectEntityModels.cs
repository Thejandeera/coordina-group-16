using System.ComponentModel.DataAnnotations;

namespace coordina.ProjectManagement.Models
{
    public class ProjectEntityItemResponse
    {
        public long Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? Goals { get; set; }
        public int MembersCount { get; set; }
        public decimal? RaisedAmount { get; set; }
        public decimal? GoalAmount { get; set; }
        public string? PadletEvidence { get; set; }
    }

    public class CreateProjectEntityRequest
    {
        [Required]
        [MaxLength(160)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(40)]
        public string Type { get; set; } = string.Empty;

        [Required]
        [MaxLength(2000)]
        public string Description { get; set; } = string.Empty;

        [Required]
        public DateTime StartDate { get; set; }

        public DateTime? EndDate { get; set; }

        [MaxLength(255)]
        public string? Goals { get; set; }

        public decimal? RaisedAmount { get; set; }
        public decimal? GoalAmount { get; set; }
        public int? MembersCount { get; set; }
        
        [MaxLength(500)]
        public string? PadletEvidence { get; set; }
    }

    public class UpdateProjectEntityRequest
    {
        [Required]
        [MaxLength(160)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(40)]
        public string Type { get; set; } = string.Empty;

        [Required]
        [MaxLength(2000)]
        public string Description { get; set; } = string.Empty;

        [Required]
        public DateTime StartDate { get; set; }

        public DateTime? EndDate { get; set; }

        [MaxLength(255)]
        public string? Goals { get; set; }

        public decimal? RaisedAmount { get; set; }
        public decimal? GoalAmount { get; set; }
        public int? MembersCount { get; set; }
        
        [MaxLength(500)]
        public string? PadletEvidence { get; set; }
    }
}
