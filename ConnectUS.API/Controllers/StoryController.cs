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
    public class StoryController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public StoryController(ApplicationDbContext context)
        {
            _context = context;
        }

        private int GetUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        [HttpPost]
        public async Task<ActionResult<StoryDto>> CreateStory(CreateStoryDto dto)
        {
            var userId = GetUserId();

            var story = new Story
            {
                UserId = userId,
                ContentType = dto.ContentType,
                MediaUrl = dto.MediaUrl,
                TextContent = dto.TextContent,
                BackgroundColor = dto.BackgroundColor,
                Caption = dto.Caption,
                ExpiresAt = DateTime.UtcNow.AddHours(24)
            };

            _context.Stories.Add(story);
            await _context.SaveChangesAsync();

            return Ok(await MapToStoryDto(story, userId));
        }

        [HttpGet]
        public async Task<ActionResult<List<UserStoriesDto>>> GetStories()
        {
            var userId = GetUserId();

            // Get stories from contacts and self (active, not expired)
            var contactIds = await _context.Contacts
                .Where(c => c.UserId == userId && !c.IsBlocked)
                .Select(c => c.ContactUserId)
                .ToListAsync();

            contactIds.Add(userId); // Include own stories

            var stories = await _context.Stories
                .Where(s => contactIds.Contains(s.UserId) && s.IsActive && s.ExpiresAt > DateTime.UtcNow)
                .Include(s => s.User)
                .Include(s => s.Views)
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();

            var grouped = stories
                .GroupBy(s => s.UserId)
                .Select(g => new UserStoriesDto
                {
                    UserId = g.Key,
                    Username = g.First().User.Username,
                    FullName = g.First().User.FullName,
                    ProfilePictureUrl = g.First().User.ProfilePictureUrl,
                    Stories = g.Select(s => new StoryDto
                    {
                        Id = s.Id,
                        UserId = s.UserId,
                        Username = s.User.Username,
                        ProfilePictureUrl = s.User.ProfilePictureUrl,
                        ContentType = s.ContentType,
                        MediaUrl = s.MediaUrl,
                        TextContent = s.TextContent,
                        BackgroundColor = s.BackgroundColor,
                        Caption = s.Caption,
                        CreatedAt = s.CreatedAt,
                        ExpiresAt = s.ExpiresAt,
                        ViewCount = s.Views.Count,
                        IsViewedByMe = s.Views.Any(v => v.ViewerId == userId)
                    }).ToList(),
                    HasUnviewed = g.Any(s => !s.Views.Any(v => v.ViewerId == userId))
                })
                .OrderByDescending(us => us.UserId == userId) // My stories first
                .ThenByDescending(us => us.HasUnviewed)
                .ToList();

            return Ok(grouped);
        }

        [HttpPost("{id}/view")]
        public async Task<ActionResult> ViewStory(int id)
        {
            var userId = GetUserId();

            var exists = await _context.StoryViews
                .AnyAsync(sv => sv.StoryId == id && sv.ViewerId == userId);

            if (!exists)
            {
                _context.StoryViews.Add(new StoryView
                {
                    StoryId = id,
                    ViewerId = userId
                });
                await _context.SaveChangesAsync();
            }

            return Ok(new { message = "Story viewed" });
        }

        [HttpGet("{id}/views")]
        public async Task<ActionResult> GetStoryViews(int id)
        {
            var userId = GetUserId();
            var story = await _context.Stories.FindAsync(id);
            if (story == null) return NotFound();
            if (story.UserId != userId) return Forbid();

            var views = await _context.StoryViews
                .Where(sv => sv.StoryId == id)
                .Include(sv => sv.Viewer)
                .Select(sv => new
                {
                    sv.ViewerId,
                    ViewerName = sv.Viewer.FullName,
                    ViewerPic = sv.Viewer.ProfilePictureUrl,
                    sv.ViewedAt
                })
                .ToListAsync();

            return Ok(views);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteStory(int id)
        {
            var userId = GetUserId();
            var story = await _context.Stories.FindAsync(id);
            if (story == null) return NotFound();
            if (story.UserId != userId) return Forbid();

            story.IsActive = false;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Story deleted" });
        }

        [HttpGet("my")]
        public async Task<ActionResult<List<StoryDto>>> GetMyStories()
        {
            var userId = GetUserId();
            var stories = await _context.Stories
                .Where(s => s.UserId == userId && s.IsActive && s.ExpiresAt > DateTime.UtcNow)
                .Include(s => s.User)
                .Include(s => s.Views)
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();

            var result = new List<StoryDto>();
            foreach (var s in stories)
            {
                result.Add(await MapToStoryDto(s, userId));
            }

            return Ok(result);
        }

        private async Task<StoryDto> MapToStoryDto(Story s, int userId)
        {
            await _context.Entry(s).Reference(x => x.User).LoadAsync();
            await _context.Entry(s).Collection(x => x.Views).LoadAsync();

            return new StoryDto
            {
                Id = s.Id,
                UserId = s.UserId,
                Username = s.User.Username,
                ProfilePictureUrl = s.User.ProfilePictureUrl,
                ContentType = s.ContentType,
                MediaUrl = s.MediaUrl,
                TextContent = s.TextContent,
                BackgroundColor = s.BackgroundColor,
                Caption = s.Caption,
                CreatedAt = s.CreatedAt,
                ExpiresAt = s.ExpiresAt,
                ViewCount = s.Views.Count,
                IsViewedByMe = s.Views.Any(v => v.ViewerId == userId)
            };
        }
    }
}
