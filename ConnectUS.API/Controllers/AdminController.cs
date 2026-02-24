using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using ConnectUS.API.Data;
using ConnectUS.API.DTOs;

namespace ConnectUS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AdminController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("dashboard")]
        public async Task<ActionResult<AdminDashboardDto>> GetDashboard()
        {
            var today = DateTime.UtcNow.Date;

            var dashboard = new AdminDashboardDto
            {
                TotalUsers = await _context.Users.CountAsync(),
                OnlineUsers = await _context.Users.CountAsync(u => u.IsOnline),
                TotalMessages = await _context.Messages.CountAsync(),
                TotalGroups = await _context.ChatGroups.CountAsync(g => g.IsActive),
                TotalChannels = await _context.Channels.CountAsync(c => c.IsActive),
                TotalStories = await _context.Stories.CountAsync(s => s.IsActive && s.ExpiresAt > DateTime.UtcNow),
                TotalCalls = await _context.CallLogs.CountAsync(),
                NewUsersToday = await _context.Users.CountAsync(u => u.CreatedAt.Date == today),
                MessagesToday = await _context.Messages.CountAsync(m => m.SentAt.Date == today),
                RecentUsers = await _context.Users
                    .OrderByDescending(u => u.CreatedAt)
                    .Take(10)
                    .Select(u => new UserDto
                    {
                        Id = u.Id,
                        Username = u.Username,
                        Email = u.Email,
                        FullName = u.FullName,
                        ProfilePictureUrl = u.ProfilePictureUrl,
                        About = u.About,
                        IsOnline = u.IsOnline,
                        LastSeen = u.LastSeen,
                        Role = u.Role,
                        CreatedAt = u.CreatedAt
                    })
                    .ToListAsync()
            };

            return Ok(dashboard);
        }

        [HttpGet("users")]
        public async Task<ActionResult<List<UserDto>>> GetAllUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? search = null)
        {
            var query = _context.Users.AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(u => u.Username.Contains(search) || u.Email.Contains(search) || u.FullName.Contains(search));

            var users = await query
                .OrderByDescending(u => u.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new UserDto
                {
                    Id = u.Id,
                    Username = u.Username,
                    Email = u.Email,
                    FullName = u.FullName,
                    ProfilePictureUrl = u.ProfilePictureUrl,
                    About = u.About,
                    PhoneNumber = u.PhoneNumber,
                    IsOnline = u.IsOnline,
                    LastSeen = u.LastSeen,
                    Role = u.Role,
                    CreatedAt = u.CreatedAt
                })
                .ToListAsync();

            return Ok(users);
        }

        [HttpPut("users/{id}")]
        public async Task<ActionResult> UpdateUser(int id, AdminUpdateUserDto dto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            if (dto.Role != null) user.Role = dto.Role;
            await _context.SaveChangesAsync();

            return Ok(new { message = "User updated" });
        }

        [HttpDelete("users/{id}")]
        public async Task<ActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();
            if (user.Role == "Admin") return BadRequest(new { message = "Cannot delete admin user" });

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "User deleted" });
        }

        [HttpGet("messages/stats")]
        public async Task<ActionResult> GetMessageStats()
        {
            var last7Days = DateTime.UtcNow.AddDays(-7);
            var dailyStats = await _context.Messages
                .Where(m => m.SentAt >= last7Days)
                .GroupBy(m => m.SentAt.Date)
                .Select(g => new { Date = g.Key, Count = g.Count() })
                .OrderBy(g => g.Date)
                .ToListAsync();

            return Ok(dailyStats);
        }

        [HttpGet("groups")]
        public async Task<ActionResult> GetAllGroups([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var groups = await _context.ChatGroups
                .Where(g => g.IsActive)
                .Include(g => g.CreatedBy)
                .OrderByDescending(g => g.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(g => new
                {
                    g.Id,
                    g.Name,
                    g.Description,
                    g.GroupPictureUrl,
                    CreatedBy = g.CreatedBy.FullName,
                    g.CreatedAt,
                    MemberCount = g.Members.Count(m => m.IsActive)
                })
                .ToListAsync();

            return Ok(groups);
        }

        [HttpGet("channels")]
        public async Task<ActionResult> GetAllChannels([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var channels = await _context.Channels
                .Where(c => c.IsActive)
                .Include(c => c.Owner)
                .OrderByDescending(c => c.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(c => new
                {
                    c.Id,
                    c.Name,
                    c.Description,
                    Owner = c.Owner.FullName,
                    c.IsPublic,
                    c.CreatedAt,
                    SubscriberCount = c.Subscribers.Count(s => s.IsActive)
                })
                .ToListAsync();

            return Ok(channels);
        }
    }
}
