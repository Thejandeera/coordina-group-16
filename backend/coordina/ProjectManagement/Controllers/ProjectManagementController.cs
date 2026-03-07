using coordina.ProjectManagement.Interface;
using coordina.ProjectManagement.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace coordina.ProjectManagement.Controllers
{
    [Route("api/project-management")]
    [ApiController]
    [Authorize]
    public class ProjectManagementController : ControllerBase
    {
        private readonly IProjectManagementService _projectManagementService;

        public ProjectManagementController(IProjectManagementService projectManagementService)
        {
            _projectManagementService = projectManagementService;
        }

        [HttpGet("entities")]
        public async Task<IActionResult> GetEntities([FromQuery] string? search = null, [FromQuery] string? type = null)
        {
            try
            {
                var entities = await _projectManagementService.GetEntitiesAsync(search, type);
                return Ok(entities);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("user/{userId}/entities")]
        public async Task<IActionResult> GetEntitiesByUserId(long userId, [FromQuery] string? search = null, [FromQuery] string? type = null)
        {
            try
            {
                var currentUserIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(currentUserIdString) || !long.TryParse(currentUserIdString, out var currentUserId) || currentUserId != userId)
                {
                    return Forbid();
                }

                var entities = await _projectManagementService.GetEntitiesByUserIdAsync(userId, search, type);
                return Ok(entities);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("entities")]
        public async Task<IActionResult> CreateEntity([FromBody] CreateProjectEntityRequest request)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            if (request.EndDate.HasValue && request.EndDate.Value.Date < request.StartDate.Date)
            {
                return BadRequest(new { message = "End date cannot be before start date." });
            }

            if (string.Equals(request.Type, "Donation Drive", StringComparison.OrdinalIgnoreCase))
            {
                if (!request.GoalAmount.HasValue || request.GoalAmount.Value <= 0)
                {
                    return BadRequest(new { message = "Target amount for Donation Drives must be greater than zero." });
                }
            }

            try
            {
                var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdString) || !long.TryParse(userIdString, out var userId))
                {
                    return Unauthorized(new { message = "User is not logged in." });
                }

                var created = await _projectManagementService.CreateEntityAsync(userId, request);
                return CreatedAtAction(nameof(GetEntities), new { id = created.Id }, created);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("entities/{id}")]
        public async Task<IActionResult> UpdateEntity(long id, [FromBody] UpdateProjectEntityRequest request)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            if (request.EndDate.HasValue && request.EndDate.Value.Date < request.StartDate.Date)
            {
                return BadRequest(new { message = "End date cannot be before start date." });
            }

            if (string.Equals(request.Type, "Donation Drive", StringComparison.OrdinalIgnoreCase))
            {
                if (!request.GoalAmount.HasValue || request.GoalAmount.Value <= 0)
                {
                    return BadRequest(new { message = "Target amount for Donation Drives must be greater than zero." });
                }
            }

            try
            {
                var updated = await _projectManagementService.UpdateEntityAsync(id, request);
                return Ok(updated);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("entities/{id}")]
        public async Task<IActionResult> DeleteEntity(long id)
        {
            try
            {
                await _projectManagementService.DeleteEntityAsync(id);
                return NoContent();
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpPost("{projectId}/members")]
        public async Task<IActionResult> InviteUser(long projectId, [FromBody] InviteMemberRequest request)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            try
            {
                var inviterUserIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(inviterUserIdString) || !long.TryParse(inviterUserIdString, out var inviterUserId))
                {
                    return Unauthorized(new { message = "User is not logged in." });
                }

                await _projectManagementService.InviteUserAsync(projectId, inviterUserId, request);
                return Ok(new { message = "User invited successfully." });
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid();
            }
        }

        [HttpGet("{projectId}/members")]
        [AllowAnonymous] // Ideally, this would only be accessible to project members. For simplicity, keeping it open to anyone with the projectId or enforcing a basic check if needed later. (Or just let the frontend read it easily)
        public async Task<IActionResult> GetProjectMembers(long projectId)
        {
            try
            {
                var members = await _projectManagementService.GetProjectMembersAsync(projectId);
                return Ok(members);
            }
            catch (ArgumentException)
            {
                // Just return empty if table missing/project invalid in a read scenario, or handle normally.
                return NotFound(new { message = "Project not found or invalid." });
            }
        }
    }
}
