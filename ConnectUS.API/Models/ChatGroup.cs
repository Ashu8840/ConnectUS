using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ConnectUS.API.Models
{
    public class ChatGroup
    {
        [Key]
        public int Id { get; set; }

        [Required, MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }
        public string? GroupPictureUrl { get; set; }
        public int CreatedById { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool IsActive { get; set; } = true;

        [ForeignKey("CreatedById")]
        public User CreatedBy { get; set; } = null!;

        public ICollection<GroupMember> Members { get; set; } = new List<GroupMember>();
        public ICollection<Message> Messages { get; set; } = new List<Message>();
    }

    public class GroupMember
    {
        [Key]
        public int Id { get; set; }

        public int GroupId { get; set; }
        public int UserId { get; set; }
        public string Role { get; set; } = "Member"; // Admin, Member
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
        public bool IsActive { get; set; } = true;

        [ForeignKey("GroupId")]
        public ChatGroup Group { get; set; } = null!;

        [ForeignKey("UserId")]
        public User User { get; set; } = null!;
    }
}
