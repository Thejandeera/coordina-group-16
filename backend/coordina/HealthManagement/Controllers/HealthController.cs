using Microsoft.AspNetCore.Mvc;

namespace coordina.HealthManagement.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HealthController : ControllerBase
    {
        [HttpGet]
        public IActionResult Get()
        {
            return Ok("hello from backend");
        }
    }
}
