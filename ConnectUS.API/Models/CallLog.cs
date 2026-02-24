using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ConnectUS.API.Models
{
    public class CallLog
    {
        [Key]
        public int Id { get; set; }

        public int CallerId { get; set; }
        public int ReceiverId { get; set; }
        public string CallType { get; set; } = "voice"; // voice, video
        public string Status { get; set; } = "initiated"; // initiated, ringing, answered, ended, missed, rejected
        public DateTime StartedAt { get; set; } = DateTime.UtcNow;
        public DateTime? AnsweredAt { get; set; }
        public DateTime? EndedAt { get; set; }
        public int DurationSeconds { get; set; } = 0;

        [ForeignKey("CallerId")]
        public User Caller { get; set; } = null!;

        [ForeignKey("ReceiverId")]
        public User Receiver { get; set; } = null!;
    }
}
