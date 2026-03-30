using System.ComponentModel.DataAnnotations;

namespace ChatApp.Api.Models;

public class Message
{
    [Key]   
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string User { get; set; } = "";
    public string Text { get; set; } = "";
    public DateTime CreateAt { get; set; } = DateTime.UtcNow;
}