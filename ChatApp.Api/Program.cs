using ChatApp.Api.Hubs;
using ChatApp.Api.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// URL binding removed to avoid binding to an unavailable/non-local IP.
// Configure URLs via the ASPNETCORE_URLS environment variable or launchSettings.json (applicationUrl) when needed.

builder.Services.AddControllers();
builder.Services.AddSignalR();

builder.Services.AddDbContext<AppDbContext>( option => 
    option.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

// ✅ CORS policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
    {
        // In development allow the Vite dev server origins used in this environment.
        if (builder.Environment.IsDevelopment())
        {
            policy.SetIsOriginAllowed(_ => true)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        }
        else
        {
            policy.WithOrigins("http://10.154.213.146/:5174")
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        }
    });
});

var app = builder.Build();  

app.UseCors("CorsPolicy");

app.MapControllers();
app.MapHub<ChatHub>("/chathub");

app.Run();