using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ConnectUS.API.Models
{
    public class Story
    {
        [Key]
        public int Id { get; set; }

        public int UserId { get; set; }
        public string ContentType { get; set; } = "image"; // image, video, text
        public string? MediaUrl { get; set; }
        public string? TextContent { get; set; }
        public string? BackgroundColor { get; set; }
        public string? Caption { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddHours(24);
        public bool IsActive { get; set; } = true;

        [ForeignKey("UserId")]
        public User User { get; set; } = null!;

        public ICollection<StoryView> Views { get; set; } = new List<StoryView>();
    }

    public class StoryView
    {
        [Key]
        public int Id { get; set; }

        public int StoryId { get; set; }
        public int ViewerId { get; set; }
        public DateTime ViewedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("StoryId")]
        public Story Story { get; set; } = null!;

        [ForeignKey("ViewerId")]
        public User Viewer { get; set; } = null!;
    }
}
