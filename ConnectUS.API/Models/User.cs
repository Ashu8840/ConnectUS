using System.ComponentModel.DataAnnotations;

namespace ConnectUS.API.Models
{
    public class User
    {
        [Key]
        public int Id { get; set; }

        [Required, MaxLength(50)]
        public string Username { get; set; } = string.Empty;

        [Required, MaxLength(100)]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        public string? ProfilePictureUrl { get; set; }
        public string? About { get; set; } = "Hey there! I am using ConnectUS";
        public string? PhoneNumber { get; set; }

        public bool IsOnline { get; set; } = false;
        public DateTime LastSeen { get; set; } = DateTime.UtcNow;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string Role { get; set; } = "User"; // User, Admin

        // Navigation properties
        public ICollection<Message> SentMessages { get; set; } = new List<Message>();
        public ICollection<Message> ReceivedMessages { get; set; } = new List<Message>();
        public ICollection<ChatGroup> OwnedGroups { get; set; } = new List<ChatGroup>();
        public ICollection<GroupMember> GroupMemberships { get; set; } = new List<GroupMember>();
        public ICollection<Contact> Contacts { get; set; } = new List<Contact>();
        public ICollection<Story> Stories { get; set; } = new List<Story>();
        public ICollection<Channel> OwnedChannels { get; set; } = new List<Channel>();
        public ICollection<ChannelSubscriber> ChannelSubscriptions { get; set; } = new List<ChannelSubscriber>();
        public ICollection<CallLog> InitiatedCalls { get; set; } = new List<CallLog>();
        public ICollection<CallLog> ReceivedCalls { get; set; } = new List<CallLog>();
    }
}
