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
    public class GroupController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<ChatHub> _hubContext;

        public GroupController(ApplicationDbContext context, IHubContext<ChatHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        private int GetUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        [HttpPost]
        public async Task<ActionResult<GroupDto>> CreateGroup(CreateGroupDto dto)
        {
            var userId = GetUserId();

            var group = new ChatGroup
            {
                Name = dto.Name,
                Description = dto.Description,
                CreatedById = userId
            };

            _context.ChatGroups.Add(group);
            await _context.SaveChangesAsync();

            // Add creator as admin
            _context.GroupMembers.Add(new GroupMember
            {
                GroupId = group.Id,
                UserId = userId,
                Role = "Admin"
            });

            // Add members
            foreach (var memberId in dto.MemberIds.Where(id => id != userId))
            {
                _context.GroupMembers.Add(new GroupMember
                {
                    GroupId = group.Id,
                    UserId = memberId
                });
            }

            await _context.SaveChangesAsync();

            return Ok(await GetGroupDto(group.Id, userId));
        }

        [HttpGet]
        public async Task<ActionResult<List<GroupDto>>> GetMyGroups()
        {
            var userId = GetUserId();

            var groupIds = await _context.GroupMembers
                .Where(gm => gm.UserId == userId && gm.IsActive)
                .Select(gm => gm.GroupId)
                .ToListAsync();

            var groups = new List<GroupDto>();
            foreach (var gId in groupIds)
            {
                groups.Add(await GetGroupDto(gId, userId));
            }

            return Ok(groups);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<GroupDto>> GetGroup(int id)
        {
            var userId = GetUserId();
            var isMember = await _context.GroupMembers
                .AnyAsync(gm => gm.GroupId == id && gm.UserId == userId && gm.IsActive);

            if (!isMember) return Forbid();

            return Ok(await GetGroupDto(id, userId));
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<GroupDto>> UpdateGroup(int id, [FromBody] CreateGroupDto dto)
        {
            var userId = GetUserId();
            var group = await _context.ChatGroups.FindAsync(id);
            if (group == null) return NotFound();

            var isAdmin = await _context.GroupMembers
                .AnyAsync(gm => gm.GroupId == id && gm.UserId == userId && gm.Role == "Admin");

            if (!isAdmin) return Forbid();

            group.Name = dto.Name;
            group.Description = dto.Description;
            await _context.SaveChangesAsync();

            return Ok(await GetGroupDto(id, userId));
        }

        [HttpPost("{id}/members")]
        public async Task<ActionResult> AddMember(int id, [FromBody] List<int> memberIds)
        {
            var userId = GetUserId();
            var isAdmin = await _context.GroupMembers
                .AnyAsync(gm => gm.GroupId == id && gm.UserId == userId && gm.Role == "Admin");

            if (!isAdmin) return Forbid();

            foreach (var memberId in memberIds)
            {
                var existing = await _context.GroupMembers
                    .FirstOrDefaultAsync(gm => gm.GroupId == id && gm.UserId == memberId);

                if (existing != null)
                {
                    existing.IsActive = true;
                }
                else
                {
                    _context.GroupMembers.Add(new GroupMember
                    {
                        GroupId = id,
                        UserId = memberId
                    });
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Members added" });
        }

        [HttpDelete("{id}/members/{memberId}")]
        public async Task<ActionResult> RemoveMember(int id, int memberId)
        {
            var userId = GetUserId();
            var isAdmin = await _context.GroupMembers
                .AnyAsync(gm => gm.GroupId == id && gm.UserId == userId && gm.Role == "Admin");

            if (!isAdmin && memberId != userId) return Forbid();

            var member = await _context.GroupMembers
                .FirstOrDefaultAsync(gm => gm.GroupId == id && gm.UserId == memberId);

            if (member == null) return NotFound();

            member.IsActive = false;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Member removed" });
        }

        [HttpPut("{id}/members/{memberId}/role")]
        public async Task<ActionResult> UpdateMemberRole(int id, int memberId, [FromBody] string role)
        {
            var userId = GetUserId();
            var isAdmin = await _context.GroupMembers
                .AnyAsync(gm => gm.GroupId == id && gm.UserId == userId && gm.Role == "Admin");

            if (!isAdmin) return Forbid();

            var member = await _context.GroupMembers
                .FirstOrDefaultAsync(gm => gm.GroupId == id && gm.UserId == memberId);

            if (member == null) return NotFound();

            member.Role = role;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Role updated" });
        }

        [HttpPost("{id}/picture")]
        public async Task<ActionResult> UploadGroupPicture(int id, IFormFile file)
        {
            var userId = GetUserId();
            var isAdmin = await _context.GroupMembers
                .AnyAsync(gm => gm.GroupId == id && gm.UserId == userId && gm.Role == "Admin");

            if (!isAdmin) return Forbid();

            var cloudinary = HttpContext.RequestServices.GetRequiredService<Services.ICloudinaryService>();
            var result = await cloudinary.UploadImageAsync(file);
            if (result.Error != null) return BadRequest(new { message = result.Error.Message });

            var group = await _context.ChatGroups.FindAsync(id);
            if (group == null) return NotFound();

            group.GroupPictureUrl = result.SecureUrl.ToString();
            await _context.SaveChangesAsync();

            return Ok(new { url = group.GroupPictureUrl });
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteGroup(int id)
        {
            var userId = GetUserId();
            var group = await _context.ChatGroups.FindAsync(id);
            if (group == null) return NotFound();
            if (group.CreatedById != userId) return Forbid();

            group.IsActive = false;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Group deleted" });
        }

        [HttpGet("search")]
        public async Task<ActionResult<List<GroupDto>>> SearchGroups([FromQuery] string? query)
        {
            var userId = GetUserId();

            var groups = await _context.ChatGroups
                .Where(g => g.IsActive &&
                    (string.IsNullOrWhiteSpace(query) || g.Name.Contains(query) || (g.Description != null && g.Description.Contains(query))))
                .Take(30)
                .ToListAsync();

            var result = new List<GroupDto>();
            foreach (var g in groups)
            {
                var isMember = await _context.GroupMembers
                    .AnyAsync(gm => gm.GroupId == g.Id && gm.UserId == userId && gm.IsActive);
                result.Add(await GetGroupDto(g.Id, userId, isMember));
            }

            return Ok(result);
        }

        [HttpPost("{id}/join")]
        public async Task<ActionResult> JoinGroup(int id)
        {
            var userId = GetUserId();
            var group = await _context.ChatGroups.FindAsync(id);
            if (group == null || !group.IsActive) return NotFound();

            var existingMember = await _context.GroupMembers
                .FirstOrDefaultAsync(gm => gm.GroupId == id && gm.UserId == userId);

            if (existingMember != null)
            {
                if (existingMember.IsActive) return Ok(new { message = "Already a member" });
                existingMember.IsActive = true;
            }
            else
            {
                _context.GroupMembers.Add(new GroupMember
                {
                    GroupId = id,
                    UserId = userId,
                    Role = "Member"
                });
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Joined group successfully" });
        }

        private async Task<GroupDto> GetGroupDto(int groupId, int userId, bool? isMember = null)
        {
            var group = await _context.ChatGroups
                .Include(g => g.CreatedBy)
                .FirstOrDefaultAsync(g => g.Id == groupId);

            var members = await _context.GroupMembers
                .Where(gm => gm.GroupId == groupId && gm.IsActive)
                .Include(gm => gm.User)
                .ToListAsync();

            var lastMessage = await _context.Messages
                .Where(m => m.GroupId == groupId && !m.IsDeleted)
                .Include(m => m.Sender)
                .OrderByDescending(m => m.SentAt)
                .FirstOrDefaultAsync();

            var unreadCount = await _context.Messages
                .CountAsync(m => m.GroupId == groupId && m.SenderId != userId && !m.IsRead);

            var membershipStatus = isMember ?? await _context.GroupMembers
                .AnyAsync(gm => gm.GroupId == groupId && gm.UserId == userId && gm.IsActive);

            return new GroupDto
            {
                Id = group!.Id,
                Name = group.Name,
                Description = group.Description,
                GroupPictureUrl = group.GroupPictureUrl,
                CreatedById = group.CreatedById,
                CreatedByName = group.CreatedBy.FullName,
                CreatedAt = group.CreatedAt,
                IsMember = membershipStatus,
                Members = members.Select(m => new GroupMemberDto
                {
                    UserId = m.UserId,
                    Username = m.User.Username,
                    FullName = m.User.FullName,
                    ProfilePictureUrl = m.User.ProfilePictureUrl,
                    Role = m.Role,
                    IsOnline = m.User.IsOnline
                }).ToList(),
                LastMessage = lastMessage != null ? new MessageDto
                {
                    Id = lastMessage.Id,
                    SenderId = lastMessage.SenderId,
                    SenderName = lastMessage.Sender.FullName,
                    Content = lastMessage.Content,
                    SentAt = lastMessage.SentAt,
                    MessageType = lastMessage.MessageType
                } : null,
                UnreadCount = unreadCount
            };
        }
    }
}
