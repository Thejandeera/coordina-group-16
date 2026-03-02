using coordina.ProjectManagement.Interface;
using coordina.ProjectManagement.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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
                var created = await _projectManagementService.CreateEntityAsync(request);
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
    }
}
