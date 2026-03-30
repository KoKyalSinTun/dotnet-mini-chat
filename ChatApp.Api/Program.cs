using ChatApp.Api.Hubs;
using ChatApp.Api.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.UseUrls("http://10.154.213.147:5249");

builder.Services.AddControllers();
builder.Services.AddSignalR();

builder.Services.AddDbContext<AppDbContext>( option => 
    option.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

// ✅ CORS policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:5174", "http://10.154.213.147:5174") 
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials(); 
    });
});

var app = builder.Build();  

app.UseCors("CorsPolicy");

app.MapControllers();
app.MapHub<ChatHub>("/chathub");

app.Run();