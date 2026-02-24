using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ConnectUS.API.Models
{
    public class Contact
    {
        [Key]
        public int Id { get; set; }

        public int UserId { get; set; }
        public int ContactUserId { get; set; }
        public string? Nickname { get; set; }
        public bool IsBlocked { get; set; } = false;
        public bool IsFavorite { get; set; } = false;
        public DateTime AddedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("UserId")]
        public User User { get; set; } = null!;

        [ForeignKey("ContactUserId")]
        public User ContactUser { get; set; } = null!;
    }
}
