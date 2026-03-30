using System.ComponentModel.DataAnnotations;

namespace ChatApp.Api.Models;

public class Reaction
{
    [Key]
    public int Id { get; set; }
    public string MessageId { get; set; } = "";
    public string Username { get; set; } = "";
    public String Emoji { get; set; } = "";
}