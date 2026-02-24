export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  profilePictureUrl?: string;
  about?: string;
  phoneNumber?: string;
  isOnline: boolean;
  lastSeen: string;
  role: string;
  createdAt: string;
}

export interface AuthResponse {
  userId: number;
  username: string;
  email: string;
  fullName: string;
  profilePictureUrl?: string;
  role: string;
  token: string;
}

export interface LoginDto {
  emailOrUsername: string;
  password: string;
}

export interface RegisterDto {
  username: string;
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
}

export interface Message {
  id: number;
  senderId: number;
  senderName: string;
  senderProfilePic?: string;
  receiverId?: number;
  groupId?: number;
  channelId?: number;
  content: string;
  messageType: string;
  mediaUrl?: string;
  mediaThumbnailUrl?: string;
  fileName?: string;
  fileSize?: number;
  isRead: boolean;
  isDelivered: boolean;
  isDeleted: boolean;
  isForwarded: boolean;
  isStarred: boolean;
  replyToMessageId?: number;
  replyToMessage?: Message;
  sentAt: string;
  readAt?: string;
}

export interface ChatListItem {
  type: string;
  id: number;
  name: string;
  pictureUrl?: string;
  lastMessageContent?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isOnline: boolean;
  about?: string;
  isPinned: boolean;
  isMuted: boolean;
}

export interface Group {
  id: number;
  name: string;
  description?: string;
  groupPictureUrl?: string;
  createdById: number;
  createdByName: string;
  createdAt: string;
  members: GroupMember[];
  lastMessage?: Message;
  unreadCount: number;
  isMember?: boolean;
}

export interface GroupMember {
  userId: number;
  username: string;
  fullName: string;
  profilePictureUrl?: string;
  role: string;
  isOnline: boolean;
}

export interface Channel {
  id: number;
  name: string;
  description?: string;
  channelPictureUrl?: string;
  ownerId: number;
  ownerName: string;
  isPublic: boolean;
  subscriberCount: number;
  isSubscribed: boolean;
  createdAt: string;
}

export interface Story {
  id: number;
  userId: number;
  username: string;
  profilePictureUrl?: string;
  contentType: string;
  mediaUrl?: string;
  textContent?: string;
  backgroundColor?: string;
  textColor?: string;
  caption?: string;
  createdAt: string;
  expiresAt: string;
  viewCount: number;
  isViewedByMe: boolean;
}

export interface UserStories {
  userId: number;
  username: string;
  fullName: string;
  profilePictureUrl?: string;
  stories: Story[];
  hasUnviewed: boolean;
}

export interface Contact {
  id: number;
  contactUserId: number;
  username: string;
  fullName: string;
  profilePictureUrl?: string;
  nickname?: string;
  about?: string;
  isOnline: boolean;
  lastSeen: string;
  isBlocked: boolean;
  isFavorite: boolean;
}

export interface CallLog {
  id: number;
  callerId: number;
  callerName: string;
  callerPic?: string;
  receiverId: number;
  receiverName: string;
  receiverPic?: string;
  callType: string;
  status: string;
  startedAt: string;
  endedAt?: string;
  durationSeconds: number;
}

export interface AdminDashboard {
  totalUsers: number;
  onlineUsers: number;
  totalMessages: number;
  totalGroups: number;
  totalChannels: number;
  totalStories: number;
  totalCalls: number;
  newUsersToday: number;
  messagesToday: number;
  recentUsers: User[];
}
