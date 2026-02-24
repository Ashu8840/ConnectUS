using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using ConnectUS.API.Data;
using Microsoft.EntityFrameworkCore;

namespace ConnectUS.API.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly ApplicationDbContext _context;
        private static readonly Dictionary<int, string> _userConnections = new();

        public ChatHub(ApplicationDbContext context)
        {
            _context = context;
        }

        public override async Task OnConnectedAsync()
        {
            var userId = GetUserId();
            if (userId > 0)
            {
                _userConnections[userId] = Context.ConnectionId;

                var user = await _context.Users.FindAsync(userId);
                if (user != null)
                {
                    user.IsOnline = true;
                    user.LastSeen = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }

                // Notify contacts about online status
                await Clients.Others.SendAsync("UserOnline", userId);

                // Join user's group channels
                var groupIds = await _context.GroupMembers
                    .Where(gm => gm.UserId == userId && gm.IsActive)
                    .Select(gm => gm.GroupId)
                    .ToListAsync();

                foreach (var groupId in groupIds)
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, $"group_{groupId}");
                }

                var channelIds = await _context.ChannelSubscribers
                    .Where(cs => cs.UserId == userId && cs.IsActive)
                    .Select(cs => cs.ChannelId)
                    .ToListAsync();

                foreach (var channelId in channelIds)
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, $"channel_{channelId}");
                }
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = GetUserId();
            if (userId > 0)
            {
                _userConnections.Remove(userId);

                var user = await _context.Users.FindAsync(userId);
                if (user != null)
                {
                    user.IsOnline = false;
                    user.LastSeen = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }

                await Clients.Others.SendAsync("UserOffline", userId, DateTime.UtcNow);
            }

            await base.OnDisconnectedAsync(exception);
        }

        // Typing indicators
        public async Task StartTyping(int receiverId)
        {
            var userId = GetUserId();
            if (_userConnections.TryGetValue(receiverId, out var connectionId))
            {
                await Clients.Client(connectionId).SendAsync("UserTyping", userId);
            }
        }

        public async Task StopTyping(int receiverId)
        {
            var userId = GetUserId();
            if (_userConnections.TryGetValue(receiverId, out var connectionId))
            {
                await Clients.Client(connectionId).SendAsync("UserStoppedTyping", userId);
            }
        }

        public async Task StartTypingGroup(int groupId)
        {
            var userId = GetUserId();
            await Clients.Group($"group_{groupId}").SendAsync("UserTypingGroup", userId, groupId);
        }

        public async Task StopTypingGroup(int groupId)
        {
            var userId = GetUserId();
            await Clients.Group($"group_{groupId}").SendAsync("UserStoppedTypingGroup", userId, groupId);
        }

        // Mark messages as read
        public async Task MarkAsRead(int senderId)
        {
            var userId = GetUserId();
            var messages = await _context.Messages
                .Where(m => m.SenderId == senderId && m.ReceiverId == userId && !m.IsRead)
                .ToListAsync();

            foreach (var msg in messages)
            {
                msg.IsRead = true;
                msg.ReadAt = DateTime.UtcNow;
            }
            await _context.SaveChangesAsync();

            if (_userConnections.TryGetValue(senderId, out var connectionId))
            {
                await Clients.Client(connectionId).SendAsync("MessagesRead", userId);
            }
        }

        // WebRTC Signaling
        public async Task SendOffer(int targetUserId, string offer)
        {
            var userId = GetUserId();
            if (_userConnections.TryGetValue(targetUserId, out var connectionId))
            {
                await Clients.Client(connectionId).SendAsync("ReceiveOffer", userId, offer);
            }
        }

        public async Task SendAnswer(int targetUserId, string answer)
        {
            var userId = GetUserId();
            if (_userConnections.TryGetValue(targetUserId, out var connectionId))
            {
                await Clients.Client(connectionId).SendAsync("ReceiveAnswer", userId, answer);
            }
        }

        public async Task SendIceCandidate(int targetUserId, string candidate)
        {
            var userId = GetUserId();
            if (_userConnections.TryGetValue(targetUserId, out var connectionId))
            {
                await Clients.Client(connectionId).SendAsync("ReceiveIceCandidate", userId, candidate);
            }
        }

        public async Task CallUser(int targetUserId, string callType)
        {
            var userId = GetUserId();
            var caller = await _context.Users.FindAsync(userId);
            if (_userConnections.TryGetValue(targetUserId, out var connectionId) && caller != null)
            {
                await Clients.Client(connectionId).SendAsync("IncomingCall", new
                {
                    CallerId = userId,
                    CallerName = caller.FullName,
                    CallerPic = caller.ProfilePictureUrl,
                    CallType = callType
                });
            }
        }

        public async Task AcceptCall(int callerId)
        {
            var userId = GetUserId();
            if (_userConnections.TryGetValue(callerId, out var connectionId))
            {
                await Clients.Client(connectionId).SendAsync("CallAccepted", userId);
            }
        }

        public async Task RejectCall(int callerId)
        {
            var userId = GetUserId();
            if (_userConnections.TryGetValue(callerId, out var connectionId))
            {
                await Clients.Client(connectionId).SendAsync("CallRejected", userId);
            }
        }

        public async Task EndCall(int otherUserId)
        {
            if (_userConnections.TryGetValue(otherUserId, out var connectionId))
            {
                await Clients.Client(connectionId).SendAsync("CallEnded");
            }
        }

        // Join/Leave groups
        public async Task JoinGroup(int groupId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"group_{groupId}");
        }

        public async Task LeaveGroup(int groupId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"group_{groupId}");
        }

        public async Task JoinChannel(int channelId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"channel_{channelId}");
        }

        public async Task LeaveChannel(int channelId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"channel_{channelId}");
        }

        public static string? GetConnectionId(int userId)
        {
            return _userConnections.TryGetValue(userId, out var connId) ? connId : null;
        }

        public static bool IsUserOnline(int userId)
        {
            return _userConnections.ContainsKey(userId);
        }

        private int GetUserId()
        {
            var claim = Context.User?.FindFirst(ClaimTypes.NameIdentifier);
            return claim != null ? int.Parse(claim.Value) : 0;
        }
    }
}
