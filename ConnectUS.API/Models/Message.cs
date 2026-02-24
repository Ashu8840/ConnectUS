using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ConnectUS.API.Models
{
    public class Message
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int SenderId { get; set; }

        public int? ReceiverId { get; set; } // null for group messages
        public int? GroupId { get; set; } // null for direct messages
        public int? ChannelId { get; set; } // null for non-channel messages

        [Required]
        public string Content { get; set; } = string.Empty;

        public string MessageType { get; set; } = "text"; // text, image, video, audio, document, location, contact
        public string? MediaUrl { get; set; }
        public string? MediaThumbnailUrl { get; set; }
        public string? FileName { get; set; }
        public long? FileSize { get; set; }

        public bool IsRead { get; set; } = false;
        public bool IsDelivered { get; set; } = false;
        public bool IsDeleted { get; set; } = false;
        public bool IsForwarded { get; set; } = false;
        public bool IsStarred { get; set; } = false;

        public int? ReplyToMessageId { get; set; }

        public DateTime SentAt { get; set; } = DateTime.UtcNow;
        public DateTime? ReadAt { get; set; }
        public DateTime? DeletedAt { get; set; }

        // Navigation properties
        [ForeignKey("SenderId")]
        public User Sender { get; set; } = null!;

        [ForeignKey("ReceiverId")]
        public User? Receiver { get; set; }

        [ForeignKey("GroupId")]
        public ChatGroup? Group { get; set; }

        [ForeignKey("ChannelId")]
        public Channel? Channel { get; set; }

        [ForeignKey("ReplyToMessageId")]
        public Message? ReplyToMessage { get; set; }
    }
}
