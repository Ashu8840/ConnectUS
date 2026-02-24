using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ConnectUS.API.Data;
using ConnectUS.API.DTOs;
using ConnectUS.API.Services;

namespace ConnectUS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ICloudinaryService _cloudinary;

        public UserController(ApplicationDbContext context, ICloudinaryService cloudinary)
        {
            _context = context;
            _cloudinary = cloudinary;
        }

        private int GetUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        [HttpGet("profile")]
        public async Task<ActionResult<UserDto>> GetProfile()
        {
            var user = await _context.Users.FindAsync(GetUserId());
            if (user == null) return NotFound();

            return Ok(MapToUserDto(user));
        }

        [HttpPut("profile")]
        public async Task<ActionResult<UserDto>> UpdateProfile(UpdateProfileDto dto)
        {
            var user = await _context.Users.FindAsync(GetUserId());
            if (user == null) return NotFound();

            if (dto.FullName != null) user.FullName = dto.FullName;
            if (dto.About != null) user.About = dto.About;
            if (dto.PhoneNumber != null) user.PhoneNumber = dto.PhoneNumber;

            await _context.SaveChangesAsync();
            return Ok(MapToUserDto(user));
        }

        [HttpPost("profile/picture")]
        public async Task<ActionResult> UploadProfilePicture(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No file uploaded" });

            var result = await _cloudinary.UploadImageAsync(file);
            if (result.Error != null)
                return BadRequest(new { message = result.Error.Message });

            var user = await _context.Users.FindAsync(GetUserId());
            if (user == null) return NotFound();

            user.ProfilePictureUrl = result.SecureUrl.ToString();
            await _context.SaveChangesAsync();

            return Ok(new { url = user.ProfilePictureUrl });
        }

        [HttpGet("search")]
        public async Task<ActionResult<List<UserDto>>> SearchUsers([FromQuery] string query)
        {
            if (string.IsNullOrWhiteSpace(query))
                return Ok(new List<UserDto>());

            var userId = GetUserId();
            var users = await _context.Users
                .Where(u => u.Id != userId &&
                    (u.Username.Contains(query) || u.FullName.Contains(query) || u.Email.Contains(query)))
                .Take(20)
                .ToListAsync();

            return Ok(users.Select(MapToUserDto).ToList());
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<UserDto>> GetUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            return Ok(MapToUserDto(user));
        }

        [HttpGet("online")]
        public async Task<ActionResult<List<UserDto>>> GetOnlineUsers()
        {
            var userId = GetUserId();
            var users = await _context.Users
                .Where(u => u.IsOnline && u.Id != userId)
                .ToListAsync();

            return Ok(users.Select(MapToUserDto).ToList());
        }

        [HttpPost("change-password")]
        public async Task<ActionResult> ChangePassword(ChangePasswordDto dto)
        {
            var userId = GetUserId();
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound();

            if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
                return BadRequest(new { message = "Current password is incorrect" });

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Password changed successfully" });
        }

        private static UserDto MapToUserDto(Models.User user) => new()
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            FullName = user.FullName,
            ProfilePictureUrl = user.ProfilePictureUrl,
            About = user.About,
            PhoneNumber = user.PhoneNumber,
            IsOnline = user.IsOnline,
            LastSeen = user.LastSeen,
            Role = user.Role,
            CreatedAt = user.CreatedAt
        };
    }
}
