using Microsoft.AspNetCore.SignalR;
using ChatApp.Api.Data;
using ChatApp.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ChatApp.Api.Hubs;

public class ChatHub : Hub
{
    private readonly AppDbContext _db;
    private readonly ILogger<ChatHub> _logger;

    public ChatHub(AppDbContext db, ILogger<ChatHub> logger)
    {
        _db = db;
        _logger = logger;
    }

    // Track connected users: ConnectionId -> Username
    private static readonly Dictionary<string, string> ConnectedUsers = new();

    public async Task SendMessage(string user, string message)
    {
        var msg = new Message
        {
            User =  user,
            Text = message
        };

        _db.Messages.Add(msg);
        await _db.SaveChangesAsync();

        await Clients.All.SendAsync(
            "ReceiveMessage",
            msg.Id, 
            msg.User, 
            msg.Text,
            msg.CreateAt
        );
    }

    public override async Task OnConnectedAsync()
    {
        var messages = await _db.Messages
            .OrderBy( m => m.CreateAt )
            .Take(50)
            .Select(m => new 
            {
                m.Id,
                m.User,
                m.Text,
                m.CreateAt
            })
            .ToListAsync();
        var reactions = await _db.Reactions.ToListAsync();
        
        await Clients.Caller.SendAsync("LoadMessages", messages, reactions);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (ConnectedUsers.TryGetValue(Context.ConnectionId, out var username))
        {
            ConnectedUsers.Remove(Context.ConnectionId);
            await Clients.All.SendAsync("UpdateUsers", ConnectedUsers.Values);
        }
        await base.OnDisconnectedAsync(exception);
    }

    public async Task RegisterUser(string username)
    {
        ConnectedUsers[Context.ConnectionId] = username;
        await Clients.All.SendAsync("UpdateUsers", ConnectedUsers.Values);
    }

    public async Task SendTyping(string username, bool isTyping)
    {
        await Clients.Others.SendAsync("UserTyping", username, isTyping);
    }

    public async Task AddReaction(string messageId, string emoji, string username, bool add)
    {
        if (add)
        {
            var reaction = new Reaction
            {
                MessageId = messageId,
                Emoji = emoji,
                Username = username
            };
            _db.Reactions.Add(reaction);
        }
        else
        {
            var reaction = _db.Reactions
                .FirstOrDefault( r =>
                    r.MessageId == messageId &&
                    r.Username == username &&
                    r.Emoji == emoji
                );
            
            if (reaction != null)
                _db.Reactions.Remove(reaction);
        }
        await _db.SaveChangesAsync();

        await Clients.All.SendAsync("ReceiveReaction", messageId, emoji, username, add);
    }
}