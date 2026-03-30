using Microsoft.EntityFrameworkCore;
using ChatApp.Api.Models;

namespace ChatApp.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        :base(options) {}
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<Reaction> Reactions => Set<Reaction>();
}