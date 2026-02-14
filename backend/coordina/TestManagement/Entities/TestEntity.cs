namespace coordina.TestManagement.Entities
{
    // This class maps to a potential 'Tests' table in your MySQL database.
    public class TestEntity
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }
}