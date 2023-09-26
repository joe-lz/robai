export interface ChatMessage {
  role: "user" | "assistant" | "web";
  content: string;
}
