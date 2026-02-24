using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ConnectUS.API.Data;
using ConnectUS.API.DTOs;
using ConnectUS.API.Models;

namespace ConnectUS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ChannelController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ChannelController(ApplicationDbContext context)
        {
            _context = context;
        }

        private int GetUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        [HttpPost]
        public async Task<ActionResult<ChannelDto>> CreateChannel(CreateChannelDto dto)
        {
            var userId = GetUserId();

            var channel = new Channel
            {
                Name = dto.Name,
                Description = dto.Description,
                OwnerId = userId,
                IsPublic = dto.IsPublic
            };

            _context.Channels.Add(channel);
            await _context.SaveChangesAsync();

            // Owner auto-subscribes
            _context.ChannelSubscribers.Add(new ChannelSubscriber
            {
                ChannelId = channel.Id,
                UserId = userId
            });
            await _context.SaveChangesAsync();

            return Ok(await GetChannelDto(channel.Id, userId));
        }

        [HttpGet]
        public async Task<ActionResult<List<ChannelDto>>> GetPublicChannels([FromQuery] string? search)
        {
            var userId = GetUserId();
            var query = _context.Channels.Where(c => c.IsActive && c.IsPublic);

            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(c => c.Name.Contains(search) || (c.Description != null && c.Description.Contains(search)));

            var channels = await query.ToListAsync();
            var result = new List<ChannelDto>();

            foreach (var ch in channels)
            {
                result.Add(await GetChannelDto(ch.Id, userId));
            }

            return Ok(result);
        }

        [HttpGet("my")]
        public async Task<ActionResult<List<ChannelDto>>> GetMyChannels()
        {
            var userId = GetUserId();

            var channelIds = await _context.ChannelSubscribers
                .Where(cs => cs.UserId == userId && cs.IsActive)
                .Select(cs => cs.ChannelId)
                .ToListAsync();

            var result = new List<ChannelDto>();
            foreach (var chId in channelIds)
            {
                result.Add(await GetChannelDto(chId, userId));
            }

            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ChannelDto>> GetChannel(int id)
        {
            return Ok(await GetChannelDto(id, GetUserId()));
        }

        [HttpPost("{id}/subscribe")]
        public async Task<ActionResult> Subscribe(int id)
        {
            var userId = GetUserId();
            var existing = await _context.ChannelSubscribers
                .FirstOrDefaultAsync(cs => cs.ChannelId == id && cs.UserId == userId);

            if (existing != null)
            {
                existing.IsActive = true;
            }
            else
            {
                _context.ChannelSubscribers.Add(new ChannelSubscriber
                {
                    ChannelId = id,
                    UserId = userId
                });
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Subscribed" });
        }

        [HttpPost("{id}/unsubscribe")]
        public async Task<ActionResult> Unsubscribe(int id)
        {
            var userId = GetUserId();
            var sub = await _context.ChannelSubscribers
                .FirstOrDefaultAsync(cs => cs.ChannelId == id && cs.UserId == userId);

            if (sub != null)
            {
                sub.IsActive = false;
                await _context.SaveChangesAsync();
            }

            return Ok(new { message = "Unsubscribed" });
        }

        [HttpGet("{id}/messages")]
        public async Task<ActionResult<List<MessageDto>>> GetChannelMessages(int id, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            var messages = await _context.Messages
                .Where(m => m.ChannelId == id && !m.IsDeleted)
                .Include(m => m.Sender)
                .OrderByDescending(m => m.SentAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(messages.Select(m => new MessageDto
            {
                Id = m.Id,
                SenderId = m.SenderId,
                SenderName = m.Sender.FullName,
                SenderProfilePic = m.Sender.ProfilePictureUrl,
                ChannelId = m.ChannelId,
                Content = m.Content,
                MessageType = m.MessageType,
                MediaUrl = m.MediaUrl,
                SentAt = m.SentAt
            }).Reverse().ToList());
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ChannelDto>> UpdateChannel(int id, CreateChannelDto dto)
        {
            var userId = GetUserId();
            var channel = await _context.Channels.FindAsync(id);
            if (channel == null) return NotFound();
            if (channel.OwnerId != userId) return Forbid();

            channel.Name = dto.Name;
            channel.Description = dto.Description;
            channel.IsPublic = dto.IsPublic;
            await _context.SaveChangesAsync();

            return Ok(await GetChannelDto(id, userId));
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteChannel(int id)
        {
            var userId = GetUserId();
            var channel = await _context.Channels.FindAsync(id);
            if (channel == null) return NotFound();
            if (channel.OwnerId != userId) return Forbid();

            channel.IsActive = false;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Channel deleted" });
        }

        private async Task<ChannelDto> GetChannelDto(int channelId, int userId)
        {
            var channel = await _context.Channels
                .Include(c => c.Owner)
                .FirstOrDefaultAsync(c => c.Id == channelId);

            var subscriberCount = await _context.ChannelSubscribers
                .CountAsync(cs => cs.ChannelId == channelId && cs.IsActive);

            var isSubscribed = await _context.ChannelSubscribers
                .AnyAsync(cs => cs.ChannelId == channelId && cs.UserId == userId && cs.IsActive);

            return new ChannelDto
            {
                Id = channel!.Id,
                Name = channel.Name,
                Description = channel.Description,
                ChannelPictureUrl = channel.ChannelPictureUrl,
                OwnerId = channel.OwnerId,
                OwnerName = channel.Owner.FullName,
                IsPublic = channel.IsPublic,
                SubscriberCount = subscriberCount,
                IsSubscribed = isSubscribed,
                CreatedAt = channel.CreatedAt
            };
        }
    }
}
