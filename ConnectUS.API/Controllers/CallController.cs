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
    public class CallController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<ChatHub> _hubContext;

        public CallController(ApplicationDbContext context, IHubContext<ChatHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        private int GetUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        [HttpPost("initiate")]
        public async Task<ActionResult<CallLogDto>> InitiateCall(InitiateCallDto dto)
        {
            var userId = GetUserId();

            var callLog = new CallLog
            {
                CallerId = userId,
                ReceiverId = dto.ReceiverId,
                CallType = dto.CallType,
                Status = "ringing"
            };

            _context.CallLogs.Add(callLog);
            await _context.SaveChangesAsync();

            // Notify receiver via SignalR
            var connId = ChatHub.GetConnectionId(dto.ReceiverId);
            if (connId != null)
            {
                var caller = await _context.Users.FindAsync(userId);
                await _hubContext.Clients.Client(connId).SendAsync("IncomingCall", new
                {
                    CallId = callLog.Id,
                    CallerId = userId,
                    CallerName = caller?.FullName,
                    CallerPic = caller?.ProfilePictureUrl,
                    CallType = dto.CallType
                });
            }
            else
            {
                callLog.Status = "missed";
                await _context.SaveChangesAsync();
            }

            return Ok(MapToCallLogDto(callLog));
        }

        [HttpPut("{id}/answer")]
        public async Task<ActionResult> AnswerCall(int id)
        {
            var callLog = await _context.CallLogs.FindAsync(id);
            if (callLog == null) return NotFound();

            callLog.Status = "answered";
            callLog.AnsweredAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Call answered" });
        }

        [HttpPut("{id}/end")]
        public async Task<ActionResult> EndCall(int id)
        {
            var callLog = await _context.CallLogs.FindAsync(id);
            if (callLog == null) return NotFound();

            callLog.Status = "ended";
            callLog.EndedAt = DateTime.UtcNow;
            if (callLog.AnsweredAt.HasValue)
                callLog.DurationSeconds = (int)(callLog.EndedAt.Value - callLog.AnsweredAt.Value).TotalSeconds;

            await _context.SaveChangesAsync();

            return Ok(MapToCallLogDto(callLog));
        }

        [HttpPut("{id}/reject")]
        public async Task<ActionResult> RejectCall(int id)
        {
            var callLog = await _context.CallLogs.FindAsync(id);
            if (callLog == null) return NotFound();

            callLog.Status = "rejected";
            callLog.EndedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Call rejected" });
        }

        [HttpGet("history")]
        public async Task<ActionResult<List<CallLogDto>>> GetCallHistory([FromQuery] int page = 1, [FromQuery] int pageSize = 30)
        {
            var userId = GetUserId();

            var calls = await _context.CallLogs
                .Where(c => c.CallerId == userId || c.ReceiverId == userId)
                .Include(c => c.Caller)
                .Include(c => c.Receiver)
                .OrderByDescending(c => c.StartedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(calls.Select(c => new CallLogDto
            {
                Id = c.Id,
                CallerId = c.CallerId,
                CallerName = c.Caller.FullName,
                CallerPic = c.Caller.ProfilePictureUrl,
                ReceiverId = c.ReceiverId,
                ReceiverName = c.Receiver.FullName,
                ReceiverPic = c.Receiver.ProfilePictureUrl,
                CallType = c.CallType,
                Status = c.Status,
                StartedAt = c.StartedAt,
                EndedAt = c.EndedAt,
                DurationSeconds = c.DurationSeconds
            }).ToList());
        }

        private static CallLogDto MapToCallLogDto(CallLog c) => new()
        {
            Id = c.Id,
            CallerId = c.CallerId,
            ReceiverId = c.ReceiverId,
            CallType = c.CallType,
            Status = c.Status,
            StartedAt = c.StartedAt,
            EndedAt = c.EndedAt,
            DurationSeconds = c.DurationSeconds
        };
    }
}
