export interface ServerMessage {
    id: string
    user: string
    text: string
    createdAt: string
}

export interface Message {
  id: string;
  user: string;
  text: string;
  time: string;
  reactions: { [emoji: string]: string[] }
}

export type ServerReaction = {
  messageId: string;
  emoji: string;
  username: string;
};
