using coordina.TaskManagement.Interface;
using coordina.TaskManagement.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace coordina.TaskManagement.Controllers
{
    [Route("api")] /* Handled nested routing in endpoints */
    [ApiController]
    [Authorize]
    public class TaskManagementController : ControllerBase
    {
        private readonly ITaskManagementService _taskService;

        public TaskManagementController(ITaskManagementService taskService)
        {
            _taskService = taskService;
        }

        [HttpGet("projects/{projectId}/tasks")]
        public async Task<IActionResult> GetTasksByProjectId(long projectId)
        {
            try
            {
                var tasks = await _taskService.GetTasksByProjectIdAsync(projectId);
                return Ok(tasks);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("tasks/{id}")]
        public async Task<IActionResult> GetTaskById(long id)
        {
            try
            {
                var task = await _taskService.GetTaskByIdAsync(id);
                return Ok(task);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("tasks")]
        public async Task<IActionResult> CreateTask([FromBody] CreateTaskRequest request)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            try
            {
                var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdString) || !long.TryParse(userIdString, out var userId))
                {
                    return Unauthorized(new { message = "User is not logged in." });
                }

                var username = User.FindFirstValue(ClaimTypes.Name) ?? "U";

                var created = await _taskService.CreateTaskAsync(userId, request, username);
                return CreatedAtAction(nameof(GetTaskById), new { id = created.Id }, created);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while creating the task.", detail = ex.Message });
            }
        }

        [HttpPut("tasks/{id}")]
        public async Task<IActionResult> UpdateTask(long id, [FromBody] UpdateTaskRequest request)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            try
            {
                var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdString) || !long.TryParse(userIdString, out var userId))
                {
                    return Unauthorized(new { message = "User is not logged in." });
                }

                var updated = await _taskService.UpdateTaskAsync(userId, id, request);
                return Ok(updated);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPatch("tasks/{id}/status")]
        public async Task<IActionResult> PatchTaskStatus(long id, [FromBody] string status)
        {
            if (string.IsNullOrWhiteSpace(status))
            {
                return BadRequest(new { message = "Status cannot be empty." });
            }

            try
            {
                var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdString) || !long.TryParse(userIdString, out var userId))
                {
                    return Unauthorized(new { message = "User is not logged in." });
                }

                var updated = await _taskService.PatchTaskStatusAsync(userId, id, status);
                return Ok(updated);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("tasks/{id}")]
        public async Task<IActionResult> DeleteTask(long id)
        {
            try
            {
                var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdString) || !long.TryParse(userIdString, out var userId))
                {
                    return Unauthorized(new { message = "User is not logged in." });
                }

                await _taskService.DeleteTaskAsync(userId, id);
                return NoContent();
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
