using Microsoft.EntityFrameworkCore;
using ConnectUS.API.Models;

namespace ConnectUS.API.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        public DbSet<User> Users => Set<User>();
        public DbSet<Message> Messages => Set<Message>();
        public DbSet<ChatGroup> ChatGroups => Set<ChatGroup>();
        public DbSet<GroupMember> GroupMembers => Set<GroupMember>();
        public DbSet<Contact> Contacts => Set<Contact>();
        public DbSet<Story> Stories => Set<Story>();
        public DbSet<StoryView> StoryViews => Set<StoryView>();
        public DbSet<Channel> Channels => Set<Channel>();
        public DbSet<ChannelSubscriber> ChannelSubscribers => Set<ChannelSubscriber>();
        public DbSet<CallLog> CallLogs => Set<CallLog>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasIndex(u => u.Email).IsUnique();
                entity.HasIndex(u => u.Username).IsUnique();
            });

            // Message relationships
            modelBuilder.Entity<Message>(entity =>
            {
                entity.HasOne(m => m.Sender)
                    .WithMany(u => u.SentMessages)
                    .HasForeignKey(m => m.SenderId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(m => m.Receiver)
                    .WithMany(u => u.ReceivedMessages)
                    .HasForeignKey(m => m.ReceiverId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(m => m.Group)
                    .WithMany(g => g.Messages)
                    .HasForeignKey(m => m.GroupId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(m => m.Channel)
                    .WithMany(c => c.Messages)
                    .HasForeignKey(m => m.ChannelId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(m => m.ReplyToMessage)
                    .WithMany()
                    .HasForeignKey(m => m.ReplyToMessageId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // ChatGroup
            modelBuilder.Entity<ChatGroup>(entity =>
            {
                entity.HasOne(g => g.CreatedBy)
                    .WithMany(u => u.OwnedGroups)
                    .HasForeignKey(g => g.CreatedById)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // GroupMember
            modelBuilder.Entity<GroupMember>(entity =>
            {
                entity.HasIndex(gm => new { gm.GroupId, gm.UserId }).IsUnique();

                entity.HasOne(gm => gm.Group)
                    .WithMany(g => g.Members)
                    .HasForeignKey(gm => gm.GroupId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(gm => gm.User)
                    .WithMany(u => u.GroupMemberships)
                    .HasForeignKey(gm => gm.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Contact
            modelBuilder.Entity<Contact>(entity =>
            {
                entity.HasIndex(c => new { c.UserId, c.ContactUserId }).IsUnique();

                entity.HasOne(c => c.User)
                    .WithMany(u => u.Contacts)
                    .HasForeignKey(c => c.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(c => c.ContactUser)
                    .WithMany()
                    .HasForeignKey(c => c.ContactUserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Story
            modelBuilder.Entity<Story>(entity =>
            {
                entity.HasOne(s => s.User)
                    .WithMany(u => u.Stories)
                    .HasForeignKey(s => s.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // StoryView
            modelBuilder.Entity<StoryView>(entity =>
            {
                entity.HasIndex(sv => new { sv.StoryId, sv.ViewerId }).IsUnique();

                entity.HasOne(sv => sv.Story)
                    .WithMany(s => s.Views)
                    .HasForeignKey(sv => sv.StoryId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Channel
            modelBuilder.Entity<Channel>(entity =>
            {
                entity.HasOne(c => c.Owner)
                    .WithMany(u => u.OwnedChannels)
                    .HasForeignKey(c => c.OwnerId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // ChannelSubscriber
            modelBuilder.Entity<ChannelSubscriber>(entity =>
            {
                entity.HasIndex(cs => new { cs.ChannelId, cs.UserId }).IsUnique();

                entity.HasOne(cs => cs.Channel)
                    .WithMany(c => c.Subscribers)
                    .HasForeignKey(cs => cs.ChannelId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(cs => cs.User)
                    .WithMany(u => u.ChannelSubscriptions)
                    .HasForeignKey(cs => cs.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // CallLog
            modelBuilder.Entity<CallLog>(entity =>
            {
                entity.HasOne(cl => cl.Caller)
                    .WithMany(u => u.InitiatedCalls)
                    .HasForeignKey(cl => cl.CallerId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(cl => cl.Receiver)
                    .WithMany(u => u.ReceivedCalls)
                    .HasForeignKey(cl => cl.ReceiverId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Seed admin user
            modelBuilder.Entity<User>().HasData(new User
            {
                Id = 1,
                Username = "admin",
                Email = "admin@connectus.com",
                PasswordHash = "$2a$11$KOe6HNKYNLmrkiAWCAVIL.r6jNqX0lW7FY7TlqniK6Mw8e1y9eZqi", // Admin@123
                FullName = "System Admin",
                Role = "Admin",
                About = "ConnectUS Administrator",
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            });
        }
    }
}
