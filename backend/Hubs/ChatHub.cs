using Microsoft.AspNetCore.SignalR;

namespace ChatApp.Api.Hubs;

public class ChatHub : Hub
{
    // Track connected users: ConnectionId -> Username
    private static readonly Dictionary<string, string> ConnectedUsers = new();

    public async Task SendMessage(string user, string message)
    {
        var messageId = Guid.NewGuid().ToString();
        await Clients.All.SendAsync("ReceiveMessage",messageId, user, message);
    }

    public override async Task OnConnectedAsync()
    {
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
        await Clients.All.SendAsync("ReceiveReaction", messageId, emoji, username, add);
    }
}