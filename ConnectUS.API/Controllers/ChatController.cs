using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ConnectUS.API.Data;
using ConnectUS.API.DTOs;
using ConnectUS.API.Models;
using ConnectUS.API.Hubs;

namespace ConnectUS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ChatController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<ChatHub> _hubContext;

        public ChatController(ApplicationDbContext context, IHubContext<ChatHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        private int GetUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        [HttpGet("conversations")]
        public async Task<ActionResult<List<ChatListItemDto>>> GetConversations()
        {
            var userId = GetUserId();
            var conversations = new List<ChatListItemDto>();

            // Direct messages
            var directMessages = await _context.Messages
                .Where(m => (m.SenderId == userId || m.ReceiverId == userId) && m.GroupId == null && m.ChannelId == null && !m.IsDeleted)
                .Include(m => m.Sender)
                .Include(m => m.Receiver)
                .GroupBy(m => m.SenderId == userId ? m.ReceiverId : m.SenderId)
                .Select(g => new
                {
                    OtherUserId = g.Key,
                    LastMessage = g.OrderByDescending(m => m.SentAt).FirstOrDefault(),
                    UnreadCount = g.Count(m => m.ReceiverId == userId && !m.IsRead)
                })
                .ToListAsync();

            foreach (var dm in directMessages)
            {
                if (dm.OtherUserId == null) continue;
                var otherUser = await _context.Users.FindAsync(dm.OtherUserId);
                if (otherUser == null) continue;

                conversations.Add(new ChatListItemDto
                {
                    Type = "direct",
                    Id = otherUser.Id,
                    Name = otherUser.FullName,
                    PictureUrl = otherUser.ProfilePictureUrl,
                    LastMessageContent = dm.LastMessage?.Content,
                    LastMessageTime = dm.LastMessage?.SentAt,
                    UnreadCount = dm.UnreadCount,
                    IsOnline = otherUser.IsOnline,
                    About = otherUser.About
                });
            }

            // Group conversations
            var groups = await _context.GroupMembers
                .Where(gm => gm.UserId == userId && gm.IsActive)
                .Include(gm => gm.Group)
                .ThenInclude(g => g.Messages.OrderByDescending(m => m.SentAt).Take(1))
                .ToListAsync();

            foreach (var gm in groups)
            {
                var lastMsg = gm.Group.Messages.FirstOrDefault();
                var unread = await _context.Messages
                    .CountAsync(m => m.GroupId == gm.GroupId && m.SenderId != userId && !m.IsRead);

                conversations.Add(new ChatListItemDto
                {
                    Type = "group",
                    Id = gm.GroupId,
                    Name = gm.Group.Name,
                    PictureUrl = gm.Group.GroupPictureUrl,
                    LastMessageContent = lastMsg?.Content,
                    LastMessageTime = lastMsg?.SentAt,
                    UnreadCount = unread
                });
            }

            return Ok(conversations.OrderByDescending(c => c.LastMessageTime).ToList());
        }

        [HttpPost("send")]
        public async Task<ActionResult<MessageDto>> SendMessage(SendMessageDto dto)
        {
            var userId = GetUserId();

            var message = new Message
            {
                SenderId = userId,
                ReceiverId = dto.ReceiverId,
                GroupId = dto.GroupId,
                ChannelId = dto.ChannelId,
                Content = dto.Content,
                MessageType = dto.MessageType,
                MediaUrl = dto.MediaUrl,
                FileName = dto.FileName,
                FileSize = dto.FileSize,
                ReplyToMessageId = dto.ReplyToMessageId,
                IsForwarded = dto.IsForwarded
            };

            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            // Load sender info
            await _context.Entry(message).Reference(m => m.Sender).LoadAsync();

            var messageDto = MapToMessageDto(message);

            // Send via SignalR
            if (dto.ReceiverId.HasValue)
            {
                var connId = ChatHub.GetConnectionId(dto.ReceiverId.Value);
                if (connId != null)
                {
                    await _hubContext.Clients.Client(connId).SendAsync("ReceiveMessage", messageDto);
                    message.IsDelivered = true;
                    await _context.SaveChangesAsync();
                }
            }
            else if (dto.GroupId.HasValue)
            {
                await _hubContext.Clients.Group($"group_{dto.GroupId}").SendAsync("ReceiveGroupMessage", messageDto);
            }
            else if (dto.ChannelId.HasValue)
            {
                await _hubContext.Clients.Group($"channel_{dto.ChannelId}").SendAsync("ReceiveChannelMessage", messageDto);
            }

            return Ok(messageDto);
        }

        [HttpGet("messages/{otherUserId}")]
        public async Task<ActionResult<List<MessageDto>>> GetMessages(int otherUserId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            var userId = GetUserId();

            var messages = await _context.Messages
                .Where(m => ((m.SenderId == userId && m.ReceiverId == otherUserId) ||
                             (m.SenderId == otherUserId && m.ReceiverId == userId)) && !m.IsDeleted)
                .Include(m => m.Sender)
                .Include(m => m.ReplyToMessage)
                .OrderByDescending(m => m.SentAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // Mark as read
            var unreadMessages = messages.Where(m => m.ReceiverId == userId && !m.IsRead).ToList();
            foreach (var msg in unreadMessages)
            {
                msg.IsRead = true;
                msg.ReadAt = DateTime.UtcNow;
            }
            if (unreadMessages.Any())
                await _context.SaveChangesAsync();

            return Ok(messages.Select(MapToMessageDto).Reverse().ToList());
        }

        [HttpGet("group-messages/{groupId}")]
        public async Task<ActionResult<List<MessageDto>>> GetGroupMessages(int groupId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            var userId = GetUserId();

            var isMember = await _context.GroupMembers
                .AnyAsync(gm => gm.GroupId == groupId && gm.UserId == userId && gm.IsActive);

            if (!isMember) return Forbid();

            var messages = await _context.Messages
                .Where(m => m.GroupId == groupId && !m.IsDeleted)
                .Include(m => m.Sender)
                .Include(m => m.ReplyToMessage)
                .OrderByDescending(m => m.SentAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(messages.Select(MapToMessageDto).Reverse().ToList());
        }

        [HttpDelete("message/{messageId}")]
        public async Task<ActionResult> DeleteMessage(int messageId)
        {
            var userId = GetUserId();
            var message = await _context.Messages.FindAsync(messageId);

            if (message == null) return NotFound();
            if (message.SenderId != userId) return Forbid();

            message.IsDeleted = true;
            message.DeletedAt = DateTime.UtcNow;
            message.Content = "This message was deleted";
            await _context.SaveChangesAsync();

            // Notify via SignalR
            if (message.ReceiverId.HasValue)
            {
                var connId = ChatHub.GetConnectionId(message.ReceiverId.Value);
                if (connId != null)
                    await _hubContext.Clients.Client(connId).SendAsync("MessageDeleted", messageId);
            }
            else if (message.GroupId.HasValue)
            {
                await _hubContext.Clients.Group($"group_{message.GroupId}").SendAsync("MessageDeleted", messageId);
            }

            return Ok(new { message = "Message deleted" });
        }

        [HttpPut("message/{messageId}/star")]
        public async Task<ActionResult> ToggleStarMessage(int messageId)
        {
            var userId = GetUserId();
            var message = await _context.Messages.FindAsync(messageId);

            if (message == null) return NotFound();
            if (message.SenderId != userId && message.ReceiverId != userId) return Forbid();

            message.IsStarred = !message.IsStarred;
            await _context.SaveChangesAsync();

            return Ok(new { isStarred = message.IsStarred });
        }

        [HttpGet("starred")]
        public async Task<ActionResult<List<MessageDto>>> GetStarredMessages()
        {
            var userId = GetUserId();
            var messages = await _context.Messages
                .Where(m => (m.SenderId == userId || m.ReceiverId == userId) && m.IsStarred && !m.IsDeleted)
                .Include(m => m.Sender)
                .OrderByDescending(m => m.SentAt)
                .Take(100)
                .ToListAsync();

            return Ok(messages.Select(MapToMessageDto).ToList());
        }

        [HttpPost("upload")]
        public async Task<ActionResult> UploadMedia(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No file uploaded" });

            var contentType = file.ContentType.ToLower();
            string url;

            if (contentType.StartsWith("image/"))
            {
                var svc = HttpContext.RequestServices.GetRequiredService<Services.ICloudinaryService>();
                var result = await svc.UploadImageAsync(file);
                if (result.Error != null) return BadRequest(new { message = result.Error.Message });
                url = result.SecureUrl.ToString();
            }
            else if (contentType.StartsWith("video/"))
            {
                var svc = HttpContext.RequestServices.GetRequiredService<Services.ICloudinaryService>();
                var result = await svc.UploadVideoAsync(file);
                if (result.Error != null) return BadRequest(new { message = result.Error.Message });
                url = result.SecureUrl.ToString();
            }
            else
            {
                var svc = HttpContext.RequestServices.GetRequiredService<Services.ICloudinaryService>();
                var result = await svc.UploadFileAsync(file);
                if (result.Error != null) return BadRequest(new { message = result.Error.Message });
                url = result.SecureUrl.ToString();
            }

            return Ok(new { url, fileName = file.FileName, fileSize = file.Length, contentType });
        }

        private static MessageDto MapToMessageDto(Message m) => new()
        {
            Id = m.Id,
            SenderId = m.SenderId,
            SenderName = m.Sender?.FullName ?? "",
            SenderProfilePic = m.Sender?.ProfilePictureUrl,
            ReceiverId = m.ReceiverId,
            GroupId = m.GroupId,
            ChannelId = m.ChannelId,
            Content = m.Content,
            MessageType = m.MessageType,
            MediaUrl = m.MediaUrl,
            MediaThumbnailUrl = m.MediaThumbnailUrl,
            FileName = m.FileName,
            FileSize = m.FileSize,
            IsRead = m.IsRead,
            IsDelivered = m.IsDelivered,
            IsDeleted = m.IsDeleted,
            IsForwarded = m.IsForwarded,
            IsStarred = m.IsStarred,
            ReplyToMessageId = m.ReplyToMessageId,
            ReplyToMessage = m.ReplyToMessage != null ? new MessageDto
            {
                Id = m.ReplyToMessage.Id,
                Content = m.ReplyToMessage.Content,
                SenderId = m.ReplyToMessage.SenderId,
                MessageType = m.ReplyToMessage.MessageType
            } : null,
            SentAt = m.SentAt,
            ReadAt = m.ReadAt
        };
    }
}
