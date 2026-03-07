using System.ComponentModel.DataAnnotations;

namespace coordina.TaskManagement.Models
{
    public class CreateTaskRequest
    {
        [Required]
        public long ProjectId { get; set; }

        [Required]
        [MinLength(1, ErrorMessage = "Name cannot be empty.")]
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        public DateTime? DueDate { get; set; }

        [Required]
        [RegularExpression(@"^(To Do|In Progress|Done)$", ErrorMessage = "Status must be 'To Do', 'In Progress', or 'Done'.")]
        public string Status { get; set; } = "To Do";

        [Range(1, 10, ErrorMessage = "Priority must be between 1 and 10.")]
        public int Priority { get; set; } = 3; // Default medium priority

        public long? ParentTaskId { get; set; }
    }

    public class UpdateTaskRequest
    {
        [Required]
        [MinLength(1, ErrorMessage = "Name cannot be empty.")]
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        public DateTime? DueDate { get; set; }

        [Required]
        [RegularExpression(@"^(To Do|In Progress|Done)$", ErrorMessage = "Status must be 'To Do', 'In Progress', or 'Done'.")]
        public string Status { get; set; } = "To Do";

        [Range(1, 10, ErrorMessage = "Priority must be between 1 and 10.")]
        public int Priority { get; set; } = 3;
    }

    public class TaskResponse
    {
        public long Id { get; set; }
        public long ProjectId { get; set; }
        public long AssigneeId { get; set; } // The ID of the user who created it, based on requirements
        public string AssigneeInitials { get; set; } = string.Empty; // Just for display purpopse
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime? DueDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public int Priority { get; set; }
        public long? ParentTaskId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public List<TaskResponse> Subtasks { get; set; } = new();
    }
}
