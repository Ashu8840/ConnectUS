using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ConnectUS.API.Models
{
    public class Channel
    {
        [Key]
        public int Id { get; set; }

        [Required, MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }
        public string? ChannelPictureUrl { get; set; }
        public int OwnerId { get; set; }
        public bool IsPublic { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool IsActive { get; set; } = true;

        [ForeignKey("OwnerId")]
        public User Owner { get; set; } = null!;

        public ICollection<ChannelSubscriber> Subscribers { get; set; } = new List<ChannelSubscriber>();
        public ICollection<Message> Messages { get; set; } = new List<Message>();
    }

    public class ChannelSubscriber
    {
        [Key]
        public int Id { get; set; }

        public int ChannelId { get; set; }
        public int UserId { get; set; }
        public DateTime SubscribedAt { get; set; } = DateTime.UtcNow;
        public bool IsActive { get; set; } = true;

        [ForeignKey("ChannelId")]
        public Channel Channel { get; set; } = null!;

        [ForeignKey("UserId")]
        public User User { get; set; } = null!;
    }
}
