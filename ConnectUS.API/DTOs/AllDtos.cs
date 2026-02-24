using System.ComponentModel.DataAnnotations;

namespace ConnectUS.API.DTOs
{
    // Auth DTOs
    public class RegisterDto
    {
        [Required, MaxLength(50)]
        public string Username { get; set; } = string.Empty;

        [Required, EmailAddress, MaxLength(100)]
        public string Email { get; set; } = string.Empty;

        [Required, MinLength(6)]
        public string Password { get; set; } = string.Empty;

        [Required, MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        public string? PhoneNumber { get; set; }
    }

    public class LoginDto
    {
        [Required]
        public string EmailOrUsername { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;
    }

    public class AuthResponseDto
    {
        public int UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? ProfilePictureUrl { get; set; }
        public string Role { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty;
    }

    public class UpdateProfileDto
    {
        public string? FullName { get; set; }
        public string? About { get; set; }
        public string? PhoneNumber { get; set; }
    }

    // User DTOs
    public class UserDto
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? ProfilePictureUrl { get; set; }
        public string? About { get; set; }
        public string? PhoneNumber { get; set; }
        public bool IsOnline { get; set; }
        public DateTime LastSeen { get; set; }
        public string Role { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    // Message DTOs
    public class SendMessageDto
    {
        public int? ReceiverId { get; set; }
        public int? GroupId { get; set; }
        public int? ChannelId { get; set; }

        [Required]
        public string Content { get; set; } = string.Empty;

        public string MessageType { get; set; } = "text";
        public string? MediaUrl { get; set; }
        public string? FileName { get; set; }
        public long? FileSize { get; set; }
        public int? ReplyToMessageId { get; set; }
        public bool IsForwarded { get; set; } = false;
    }

    public class MessageDto
    {
        public int Id { get; set; }
        public int SenderId { get; set; }
        public string SenderName { get; set; } = string.Empty;
        public string? SenderProfilePic { get; set; }
        public int? ReceiverId { get; set; }
        public int? GroupId { get; set; }
        public int? ChannelId { get; set; }
        public string Content { get; set; } = string.Empty;
        public string MessageType { get; set; } = string.Empty;
        public string? MediaUrl { get; set; }
        public string? MediaThumbnailUrl { get; set; }
        public string? FileName { get; set; }
        public long? FileSize { get; set; }
        public bool IsRead { get; set; }
        public bool IsDelivered { get; set; }
        public bool IsDeleted { get; set; }
        public bool IsForwarded { get; set; }
        public bool IsStarred { get; set; }
        public int? ReplyToMessageId { get; set; }
        public MessageDto? ReplyToMessage { get; set; }
        public DateTime SentAt { get; set; }
        public DateTime? ReadAt { get; set; }
    }

    // Group DTOs
    public class ChangePasswordDto
    {
        [Required]
        public string CurrentPassword { get; set; } = string.Empty;

        [Required, MinLength(6)]
        public string NewPassword { get; set; } = string.Empty;
    }

    public class CreateGroupDto
    {
        [Required, MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }
        public List<int> MemberIds { get; set; } = new();
    }

    public class GroupDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? GroupPictureUrl { get; set; }
        public int CreatedById { get; set; }
        public string CreatedByName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public List<GroupMemberDto> Members { get; set; } = new();
        public MessageDto? LastMessage { get; set; }
        public int UnreadCount { get; set; }
        public bool IsMember { get; set; }
    }

    public class GroupMemberDto
    {
        public int UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? ProfilePictureUrl { get; set; }
        public string Role { get; set; } = string.Empty;
        public bool IsOnline { get; set; }
    }

    // Channel DTOs
    public class CreateChannelDto
    {
        [Required, MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }
        public bool IsPublic { get; set; } = true;
    }

    public class ChannelDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ChannelPictureUrl { get; set; }
        public int OwnerId { get; set; }
        public string OwnerName { get; set; } = string.Empty;
        public bool IsPublic { get; set; }
        public int SubscriberCount { get; set; }
        public bool IsSubscribed { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    // Story DTOs
    public class CreateStoryDto
    {
        public string ContentType { get; set; } = "image"; // image, video, text
        public string? MediaUrl { get; set; }
        public string? TextContent { get; set; }
        public string? BackgroundColor { get; set; }
        public string? Caption { get; set; }
    }

    public class StoryDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string? ProfilePictureUrl { get; set; }
        public string ContentType { get; set; } = string.Empty;
        public string? MediaUrl { get; set; }
        public string? TextContent { get; set; }
        public string? BackgroundColor { get; set; }
        public string? Caption { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime ExpiresAt { get; set; }
        public int ViewCount { get; set; }
        public bool IsViewedByMe { get; set; }
    }

    public class UserStoriesDto
    {
        public int UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? ProfilePictureUrl { get; set; }
        public List<StoryDto> Stories { get; set; } = new();
        public bool HasUnviewed { get; set; }
    }

    // Contact DTOs
    public class AddContactDto
    {
        [Required]
        public string UsernameOrEmail { get; set; } = string.Empty;

        public string? Nickname { get; set; }
    }

    public class ContactDto
    {
        public int Id { get; set; }
        public int ContactUserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? ProfilePictureUrl { get; set; }
        public string? Nickname { get; set; }
        public string? About { get; set; }
        public bool IsOnline { get; set; }
        public DateTime LastSeen { get; set; }
        public bool IsBlocked { get; set; }
        public bool IsFavorite { get; set; }
    }

    // Call DTOs
    public class InitiateCallDto
    {
        [Required]
        public int ReceiverId { get; set; }

        public string CallType { get; set; } = "voice"; // voice, video
    }

    public class CallLogDto
    {
        public int Id { get; set; }
        public int CallerId { get; set; }
        public string CallerName { get; set; } = string.Empty;
        public string? CallerPic { get; set; }
        public int ReceiverId { get; set; }
        public string ReceiverName { get; set; } = string.Empty;
        public string? ReceiverPic { get; set; }
        public string CallType { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime StartedAt { get; set; }
        public DateTime? EndedAt { get; set; }
        public int DurationSeconds { get; set; }
    }

    // Chat List DTOs
    public class ChatListItemDto
    {
        public string Type { get; set; } = "direct"; // direct, group, channel
        public int Id { get; set; } // UserId for direct, GroupId for group, ChannelId for channel
        public string Name { get; set; } = string.Empty;
        public string? PictureUrl { get; set; }
        public string? LastMessageContent { get; set; }
        public DateTime? LastMessageTime { get; set; }
        public int UnreadCount { get; set; }
        public bool IsOnline { get; set; }
        public string? About { get; set; }
        public bool IsPinned { get; set; }
        public bool IsMuted { get; set; }
    }

    // Admin DTOs
    public class AdminDashboardDto
    {
        public int TotalUsers { get; set; }
        public int OnlineUsers { get; set; }
        public int TotalMessages { get; set; }
        public int TotalGroups { get; set; }
        public int TotalChannels { get; set; }
        public int TotalStories { get; set; }
        public int TotalCalls { get; set; }
        public int NewUsersToday { get; set; }
        public int MessagesToday { get; set; }
        public List<UserDto> RecentUsers { get; set; } = new();
    }

    public class AdminUpdateUserDto
    {
        public string? Role { get; set; }
        public bool? IsActive { get; set; }
    }

    // WebRTC Signaling DTOs
    public class WebRtcSignalDto
    {
        public int TargetUserId { get; set; }
        public string Type { get; set; } = string.Empty; // offer, answer, ice-candidate
        public string Data { get; set; } = string.Empty;
    }
}
