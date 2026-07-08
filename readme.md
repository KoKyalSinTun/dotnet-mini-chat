# Mini Chat App

A simple real-time chat application built with ASP.NET Core, SignalR, React, TypeScript, Vite, and PostgreSQL. Users can join a shared chat room, send messages, see who is online, see typing indicators, and react to messages.

## Features

- Real-time messaging with SignalR
- User join flow with a display name
- Online users list
- Typing indicators for active participants
- Message reactions such as 👍, ❤️, and 😂
- Persistent message and reaction storage in PostgreSQL

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, Framer Motion
- Backend: ASP.NET Core, SignalR, Entity Framework Core
- Database: PostgreSQL

## Project Structure

- [ChatApp.Api](ChatApp.Api) - ASP.NET Core API and SignalR hub
- [chatapp-frontend](chatapp-frontend) - React frontend application

## Prerequisites

Make sure you have the following installed:

- .NET SDK 10+
- Node.js and npm
- PostgreSQL

## Getting Started

### 1. Set up the database

Create a PostgreSQL database named `ChatApp` and make sure the connection string in [ChatApp.Api/appsettings.json](ChatApp.Api/appsettings.json) points to your local database.

Example connection string:

```json
"ConnectionStrings": {
  "Default": "Host=localhost;Port=5432;Database=ChatApp;Username=postgres;Password=admin"
}
```

### 2. Run the backend

Open a terminal in [ChatApp.Api](ChatApp.Api) and run:

```bash
dotnet restore
dotnet watch run
```

The API will start on `http://localhost:5249` by default.

### 3. Run the frontend

Open a second terminal in [chatapp-frontend](chatapp-frontend) and run:

```bash
npm install
npm run dev
```

The frontend will start on `http://localhost:5173`.

## Usage

1. Open the frontend in your browser.
2. Enter a username and join the chat.
3. Start sending messages and reacting to them.

## Notes

- The frontend uses the API URL from `VITE_API_URL` if it is set; otherwise it defaults to `http://localhost:5249`.
- Messages and reactions are stored in the database, so they will be available after refreshes and reconnects.
