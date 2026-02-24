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
    public class ContactController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ContactController(ApplicationDbContext context)
        {
            _context = context;
        }

        private int GetUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        [HttpGet]
        public async Task<ActionResult<List<ContactDto>>> GetContacts()
        {
            var userId = GetUserId();

            var contacts = await _context.Contacts
                .Where(c => c.UserId == userId)
                .Include(c => c.ContactUser)
                .OrderBy(c => c.ContactUser.FullName)
                .ToListAsync();

            return Ok(contacts.Select(c => new ContactDto
            {
                Id = c.Id,
                ContactUserId = c.ContactUserId,
                Username = c.ContactUser.Username,
                FullName = c.ContactUser.FullName,
                ProfilePictureUrl = c.ContactUser.ProfilePictureUrl,
                Nickname = c.Nickname,
                About = c.ContactUser.About,
                IsOnline = c.ContactUser.IsOnline,
                LastSeen = c.ContactUser.LastSeen,
                IsBlocked = c.IsBlocked,
                IsFavorite = c.IsFavorite
            }).ToList());
        }

        [HttpPost]
        public async Task<ActionResult<ContactDto>> AddContact(AddContactDto dto)
        {
            var userId = GetUserId();

            var contactUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == dto.UsernameOrEmail || u.Email == dto.UsernameOrEmail);

            if (contactUser == null)
                return NotFound(new { message = "User not found" });

            if (contactUser.Id == userId)
                return BadRequest(new { message = "Cannot add yourself as contact" });

            var exists = await _context.Contacts
                .AnyAsync(c => c.UserId == userId && c.ContactUserId == contactUser.Id);

            if (exists)
                return BadRequest(new { message = "Contact already exists" });

            var contact = new Contact
            {
                UserId = userId,
                ContactUserId = contactUser.Id,
                Nickname = dto.Nickname
            };

            _context.Contacts.Add(contact);
            await _context.SaveChangesAsync();

            return Ok(new ContactDto
            {
                Id = contact.Id,
                ContactUserId = contactUser.Id,
                Username = contactUser.Username,
                FullName = contactUser.FullName,
                ProfilePictureUrl = contactUser.ProfilePictureUrl,
                Nickname = contact.Nickname,
                About = contactUser.About,
                IsOnline = contactUser.IsOnline,
                LastSeen = contactUser.LastSeen,
                IsBlocked = false,
                IsFavorite = false
            });
        }

        [HttpPut("{id}/block")]
        public async Task<ActionResult> ToggleBlock(int id)
        {
            var userId = GetUserId();
            var contact = await _context.Contacts
                .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

            if (contact == null) return NotFound();

            contact.IsBlocked = !contact.IsBlocked;
            await _context.SaveChangesAsync();

            return Ok(new { isBlocked = contact.IsBlocked });
        }

        [HttpPut("{id}/favorite")]
        public async Task<ActionResult> ToggleFavorite(int id)
        {
            var userId = GetUserId();
            var contact = await _context.Contacts
                .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

            if (contact == null) return NotFound();

            contact.IsFavorite = !contact.IsFavorite;
            await _context.SaveChangesAsync();

            return Ok(new { isFavorite = contact.IsFavorite });
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteContact(int id)
        {
            var userId = GetUserId();
            var contact = await _context.Contacts
                .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

            if (contact == null) return NotFound();

            _context.Contacts.Remove(contact);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Contact removed" });
        }
    }
}
