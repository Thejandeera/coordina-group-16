using coordina.TestManagement.Services;
using Microsoft.AspNetCore.Mvc;
using coordina.TestManagement.Interface;

namespace coordina.TestManagement.Controllers
{
    // Defines the route as api/tests
    [Route("api/[controller]")]
    [ApiController]
    public class TestsController : ControllerBase
    {
        private readonly ITestService _testService;

        // Inject the service interface through the constructor.
        public TestsController(ITestService testService)
        {
            _testService = testService;
        }

        // GET: api/tests
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            // Call the service to get the data.
            var tests = await _testService.GetAllTestsAsync();

            // Return the data with a 200 OK status.
            return Ok(tests);
        }
    }
}