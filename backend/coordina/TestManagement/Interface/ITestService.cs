using coordina.TestManagement.Entities;

namespace coordina.TestManagement.Interface
{
    public interface ITestService
    {
        // Define a method signature to get all test records asynchronously.
        Task<List<TestEntity>> GetAllTestsAsync();
    }
}