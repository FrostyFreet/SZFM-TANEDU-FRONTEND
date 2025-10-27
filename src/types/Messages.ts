export type Message = {
  id: number;
  message: string;
  senderId: number;
  senderFullName: string;
  receiverId: number;
  receiverFullName: string;
  receiverEmail: string
  senderEmail: string
  createdAt: string;
};

export type Conversation = {
  otherUserId: number;
  otherUserName: string;
  otherUserEmail: string;
  messages: Message[];
  unreadCount: number;
};