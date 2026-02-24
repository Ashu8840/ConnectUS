import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { SignalrService } from '../../services/signalr.service';
import { UserService } from '../../services/user.service';
import { ContactService } from '../../services/contact.service';
import { GroupService } from '../../services/group.service';
import { ChannelService } from '../../services/channel.service';
import { StoryService } from '../../services/story.service';
import { CallService } from '../../services/call.service';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ChatComponent } from '../chat/chat.component';
import { StoryComponent } from '../story/story.component';
import { ChannelComponent } from '../channel/channel.component';
import { CallComponent } from '../call/call.component';
import { ProfileComponent } from '../profile/profile.component';
import { SettingsComponent } from '../settings/settings.component';
import {
  ChatListItem,
  Message,
  User,
  Contact,
  UserStories,
  CallLog,
  Channel,
  Group,
} from '../../models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent,
    ChatComponent,
    StoryComponent,
    ChannelComponent,
    CallComponent,
    ProfileComponent,
    SettingsComponent,
  ],
  template: `
    <div class="app-layout">
      <!-- Sidebar -->
      <app-sidebar
        [conversations]="conversations"
        [contacts]="contacts"
        [stories]="stories"
        [channels]="channels"
        [callHistory]="callHistory"
        [activeTab]="activeTab"
        [selectedChatId]="selectedChatId"
        [currentUser]="currentUser"
        (tabChanged)="onTabChanged($event)"
        (chatSelected)="onChatSelected($event)"
        (contactAdded)="onContactAdded($event)"
        (groupCreated)="onGroupCreated($event)"
        (channelCreated)="onChannelCreated($event)"
        (storyCreated)="onStoryCreated($event)"
        (callInitiated)="onCallInitiated($event)"
        (profileClicked)="showProfile = true"
        (settingsClicked)="showSettings = true"
        (adminClicked)="goToAdmin()"
        (logoutClicked)="logout()"
        (searchChanged)="onSearch($event)"
      ></app-sidebar>

      <!-- Main content area -->
      <div class="main-area">
        <ng-container *ngIf="activeTab === 'chats' || activeTab === 'contacts'">
          <app-chat
            *ngIf="selectedChat; else emptyState"
            [chatInfo]="selectedChat"
            [messages]="messages"
            [currentUserId]="authService.getUserId()"
            [typingUser]="typingUser"
            (messageSent)="onMessageSent($event)"
            (mediaUploaded)="onMediaUpload($event)"
            (callInitiated)="onCallInitiated($event)"
            (messageDeleted)="onMessageDeleted($event)"
            (messageStarred)="onMessageStarred($event)"
          ></app-chat>
        </ng-container>

        <ng-container *ngIf="activeTab === 'stories'">
          <app-story
            [stories]="stories"
            [currentUser]="currentUser"
            (closed)="activeTab = 'chats'"
            (storyPosted)="loadStories()"
          ></app-story>
        </ng-container>

        <!-- Active call overlay -->
        <div class="active-call-overlay" *ngIf="activeCall">
          <div class="call-header">
            <div class="call-avatar">
              <img *ngIf="activeCall.picUrl" [src]="activeCall.picUrl" />
              <span *ngIf="!activeCall.picUrl">{{
                activeCall.name?.charAt(0)
              }}</span>
            </div>
            <div class="call-info">
              <span class="call-name">{{ activeCall.name }}</span>
              <span class="call-status">{{ callStatus }}</span>
            </div>
          </div>
          <div class="call-video-area" *ngIf="activeCall.type === 'video'">
            <video
              #remoteVideo
              autoplay
              playsinline
              class="remote-video"
            ></video>
            <video
              #localVideo
              autoplay
              muted
              playsinline
              class="local-video"
            ></video>
          </div>
          <div class="call-controls">
            <button
              class="ctrl-btn"
              (click)="toggleMute()"
              [class.active]="isMuted"
            >
              <i
                class="fas"
                [class.fa-microphone]="!isMuted"
                [class.fa-microphone-slash]="isMuted"
              ></i>
            </button>
            <button
              class="ctrl-btn"
              *ngIf="activeCall.type === 'video'"
              (click)="toggleVideo()"
              [class.active]="isVideoOff"
            >
              <i
                class="fas"
                [class.fa-video]="!isVideoOff"
                [class.fa-video-slash]="isVideoOff"
              ></i>
            </button>
            <button class="ctrl-btn end" (click)="endActiveCall()">
              <i class="fas fa-phone-slash"></i>
            </button>
          </div>
        </div>

        <ng-container *ngIf="activeTab === 'channels'">
          <app-channel
            [channel]="selectedChannel"
            [messages]="channelMessages"
            [currentUserId]="authService.getUserId()"
            (postSent)="onChannelMessageSent($event)"
            (subscribed)="onChannelSubscribed($event)"
            (unsubscribed)="onChannelUnsubscribed($event)"
            (channelSelected)="onPublicChannelSelected($event)"
          ></app-channel>
        </ng-container>

        <ng-container *ngIf="activeTab === 'calls'">
          <app-call
            [callHistory]="callHistory"
            [currentUserId]="authService.getUserId()"
            (callInitiated)="onCallInitiated($event)"
          ></app-call>
        </ng-container>

        <ng-template #emptyState>
          <div class="empty-state">
            <div class="empty-icon">
              <i class="fas fa-comments"></i>
            </div>
            <h2>ConnectUS</h2>
            <p>
              Send and receive messages, make calls, share stories and more.
            </p>
            <p class="hint">Select a conversation to start chatting</p>
          </div>
        </ng-template>
      </div>

      <!-- Incoming call modal -->
      <div
        class="modal-overlay"
        *ngIf="incomingCall"
        (click)="rejectIncomingCall()"
      >
        <div class="call-modal" (click)="$event.stopPropagation()">
          <div class="caller-info">
            <div class="avatar avatar-xl">
              <img
                *ngIf="incomingCall.callerPic"
                [src]="incomingCall.callerPic"
                class="avatar avatar-xl"
              />
              <span *ngIf="!incomingCall.callerPic">{{
                incomingCall.callerName?.charAt(0)
              }}</span>
            </div>
            <h3>{{ incomingCall.callerName }}</h3>
            <p>Incoming {{ incomingCall.callType }} call...</p>
          </div>
          <div class="call-actions">
            <button
              class="btn btn-danger call-btn"
              (click)="rejectIncomingCall()"
            >
              <i class="fas fa-phone-slash"></i>
            </button>
            <button
              class="btn btn-success call-btn"
              (click)="acceptIncomingCall()"
            >
              <i class="fas fa-phone"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Profile panel -->
      <app-profile
        *ngIf="showProfile"
        (closed)="showProfile = false"
      ></app-profile>

      <!-- Settings panel -->
      <app-settings
        *ngIf="showSettings"
        (closed)="showSettings = false"
      ></app-settings>
    </div>
  `,
  styles: [
    `
      .app-layout {
        display: flex;
        height: 100vh;
        background: var(--bg-dark);
      }
      .main-area {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .active-call-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 5000;
        background: #1a1a2e;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      .call-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 30px;
      }
      .call-avatar {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: var(--primary);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
        color: white;
        font-weight: 700;
        overflow: hidden;
        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }
      .call-info {
        text-align: left;
        .call-name {
          display: block;
          font-size: 22px;
          font-weight: 700;
          color: white;
        }
        .call-status {
          font-size: 14px;
          color: #aaa;
        }
      }
      .call-video-area {
        position: relative;
        width: 100%;
        max-width: 640px;
        margin-bottom: 24px;
      }
      .remote-video {
        width: 100%;
        border-radius: 12px;
        background: #000;
        min-height: 300px;
      }
      .local-video {
        position: absolute;
        bottom: 10px;
        right: 10px;
        width: 120px;
        border-radius: 8px;
      }
      .call-controls {
        display: flex;
        gap: 20px;
      }
      .ctrl-btn {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        border: none;
        background: rgba(255, 255, 255, 0.15);
        color: white;
        cursor: pointer;
        font-size: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
        &:hover {
          background: rgba(255, 255, 255, 0.25);
        }
        &.active {
          background: rgba(255, 255, 255, 0.3);
        }
        &.end {
          background: #f44336;
          &:hover {
            background: #d32f2f;
          }
        }
      }
      .empty-state {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: var(--text-secondary);
        background: var(--bg-chat);
        border-bottom: 6px solid var(--primary);
        .empty-icon {
          width: 100px;
          height: 100px;
          background: var(--bg-sidebar);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          i {
            font-size: 40px;
            color: var(--text-secondary);
          }
        }
        h2 {
          font-size: 28px;
          color: var(--text-primary);
          margin-bottom: 12px;
        }
        p {
          font-size: 14px;
          margin-bottom: 4px;
        }
        .hint {
          margin-top: 16px;
          font-size: 13px;
        }
      }
      .call-modal {
        background: var(--bg-sidebar);
        border-radius: 16px;
        padding: 40px;
        text-align: center;
        .caller-info {
          margin-bottom: 32px;
          h3 {
            margin-top: 16px;
            font-size: 20px;
          }
          p {
            color: var(--text-secondary);
            margin-top: 4px;
          }
        }
        .call-actions {
          display: flex;
          justify-content: center;
          gap: 32px;
        }
        .call-btn {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          i {
            font-size: 22px;
          }
        }
      }
    `,
  ],
})
export class DashboardComponent implements OnInit, OnDestroy {
  activeTab = 'chats';
  conversations: ChatListItem[] = [];
  contacts: Contact[] = [];
  stories: UserStories[] = [];
  channels: Channel[] = [];
  callHistory: CallLog[] = [];
  messages: Message[] = [];
  channelMessages: Message[] = [];
  selectedChat: ChatListItem | null = null;
  selectedChatId: number | null = null;
  selectedChannel: Channel | null = null;
  currentUser: any;
  showProfile = false;
  showSettings = false;
  typingUser: number | null = null;
  incomingCall: any = null;
  searchQuery = '';

  // WebRTC
  activeCall: any = null;
  callStatus = 'Connecting...';
  isMuted = false;
  isVideoOff = false;
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;

  constructor(
    public authService: AuthService,
    private chatService: ChatService,
    private signalr: SignalrService,
    private userService: UserService,
    private contactService: ContactService,
    private groupService: GroupService,
    private channelService: ChannelService,
    private storyService: StoryService,
    private callService: CallService,
    private router: Router,
  ) {
    this.currentUser = this.authService.getCurrentUser();
  }

  ngOnInit(): void {
    this.signalr.startConnection();
    this.loadConversations();
    this.loadContacts();
    this.loadStories();
    this.loadChannels();
    this.loadCallHistory();

    // SignalR event handlers
    this.signalr.messageReceived.subscribe((msg) => {
      if (this.selectedChat && msg.senderId === this.selectedChat.id) {
        this.messages.push(msg);
        this.signalr.markAsRead(msg.senderId);
      }
      this.loadConversations();
    });

    this.signalr.groupMessageReceived.subscribe((msg) => {
      if (
        this.selectedChat &&
        this.selectedChat.type === 'group' &&
        msg.groupId === this.selectedChat.id
      ) {
        this.messages.push(msg);
      }
      this.loadConversations();
    });

    this.signalr.channelMessageReceived.subscribe((msg) => {
      if (this.selectedChannel && msg.channelId === this.selectedChannel.id) {
        this.channelMessages.push(msg);
      }
    });

    this.signalr.userTyping.subscribe((userId) => {
      this.typingUser = userId;
      setTimeout(() => {
        if (this.typingUser === userId) this.typingUser = null;
      }, 3000);
    });

    this.signalr.userStoppedTyping.subscribe(() => (this.typingUser = null));

    this.signalr.messageDeleted.subscribe((msgId) => {
      const idx = this.messages.findIndex((m) => m.id === msgId);
      if (idx >= 0) {
        this.messages[idx].isDeleted = true;
        this.messages[idx].content = 'This message was deleted';
      }
    });

    this.signalr.userOnline.subscribe((userId) => {
      this.updateOnlineStatus(userId, true);
    });

    this.signalr.userOffline.subscribe(({ userId }) => {
      this.updateOnlineStatus(userId, false);
    });

    this.signalr.incomingCall.subscribe((data) => {
      this.incomingCall = data;
    });

    this.signalr.callAccepted.subscribe(async (callerUserId: number) => {
      this.callStatus = 'Connected';
      if (this.peerConnection) {
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        this.signalr.sendOffer(callerUserId, JSON.stringify(offer));
      }
    });

    this.signalr.callRejected.subscribe(() => {
      this.endActiveCall();
      this.callStatus = 'Call Rejected';
    });

    this.signalr.callEnded.subscribe(() => {
      this.endActiveCall();
    });

    this.signalr.receiveOffer.subscribe(async ({ userId, offer }) => {
      if (!this.peerConnection) this.createPeerConnection(userId);
      await this.peerConnection!.setRemoteDescription(
        new RTCSessionDescription(JSON.parse(offer)),
      );
      const answer = await this.peerConnection!.createAnswer();
      await this.peerConnection!.setLocalDescription(answer);
      this.signalr.sendAnswer(userId, JSON.stringify(answer));
    });

    this.signalr.receiveAnswer.subscribe(async ({ answer }) => {
      if (this.peerConnection) {
        await this.peerConnection.setRemoteDescription(
          new RTCSessionDescription(JSON.parse(answer)),
        );
      }
    });

    this.signalr.receiveIceCandidate.subscribe(async ({ candidate }) => {
      if (this.peerConnection && candidate) {
        await this.peerConnection.addIceCandidate(
          new RTCIceCandidate(JSON.parse(candidate)),
        );
      }
    });
  }

  ngOnDestroy(): void {
    this.signalr.stopConnection();
  }

  loadConversations(): void {
    this.chatService
      .getConversations()
      .subscribe((c) => (this.conversations = c));
  }

  loadContacts(): void {
    this.contactService.getContacts().subscribe((c) => (this.contacts = c));
  }

  loadStories(): void {
    this.storyService.getStories().subscribe((s) => (this.stories = s));
  }

  loadChannels(): void {
    this.channelService.getMyChannels().subscribe((c) => (this.channels = c));
  }

  loadCallHistory(): void {
    this.callService.getCallHistory().subscribe((c) => (this.callHistory = c));
  }

  onTabChanged(tab: string): void {
    this.activeTab = tab;
    this.selectedChat = null;
    this.selectedChannel = null;
  }

  onChatSelected(chat: ChatListItem): void {
    this.selectedChat = chat;
    this.selectedChatId = chat.id;
    this.messages = [];

    if (chat.type === 'direct') {
      this.chatService
        .getMessages(chat.id)
        .subscribe((msgs) => (this.messages = msgs));
      this.signalr.markAsRead(chat.id);
    } else if (chat.type === 'group') {
      this.chatService
        .getGroupMessages(chat.id)
        .subscribe((msgs) => (this.messages = msgs));
    }

    // Reset unread
    const conv = this.conversations.find(
      (c) => c.id === chat.id && c.type === chat.type,
    );
    if (conv) conv.unreadCount = 0;
  }

  onMessageSent(dto: any): void {
    if (this.selectedChat?.type === 'direct') {
      dto.receiverId = this.selectedChat.id;
    } else if (this.selectedChat?.type === 'group') {
      dto.groupId = this.selectedChat.id;
    }

    this.chatService.sendMessage(dto).subscribe((msg) => {
      this.messages.push(msg);
      this.loadConversations();
    });
  }

  onMediaUpload(file: File): void {
    this.chatService.uploadMedia(file).subscribe((res) => {
      const dto: any = {
        content: res.fileName || 'Media',
        messageType: res.contentType?.startsWith('image')
          ? 'image'
          : res.contentType?.startsWith('video')
            ? 'video'
            : 'document',
        mediaUrl: res.url,
        fileName: res.fileName,
        fileSize: res.fileSize,
      };
      this.onMessageSent(dto);
    });
  }

  onMessageDeleted(messageId: number): void {
    this.chatService.deleteMessage(messageId).subscribe(() => {
      const idx = this.messages.findIndex((m) => m.id === messageId);
      if (idx >= 0) {
        this.messages[idx].isDeleted = true;
        this.messages[idx].content = 'This message was deleted';
      }
    });
  }

  onMessageStarred(messageId: number): void {
    this.chatService.toggleStar(messageId).subscribe((res) => {
      const msg = this.messages.find((m) => m.id === messageId);
      if (msg) msg.isStarred = res.isStarred;
    });
  }

  onContactAdded(dto: any): void {
    this.contactService.addContact(dto).subscribe(() => this.loadContacts());
  }

  onGroupCreated(dto: any): void {
    this.groupService.createGroup(dto).subscribe(() => {
      this.loadConversations();
    });
  }

  onChannelCreated(dto: any): void {
    this.channelService.createChannel(dto).subscribe(() => this.loadChannels());
  }

  onStoryCreated(dto: any): void {
    this.storyService.createStory(dto).subscribe(() => this.loadStories());
  }

  onStoryViewed(storyId: number): void {
    this.storyService.viewStory(storyId).subscribe();
  }

  onChannelMessageSent(dto: any): void {
    if (this.selectedChannel) {
      dto.channelId = this.selectedChannel.id;
      this.chatService.sendMessage(dto).subscribe((msg) => {
        this.channelMessages.push(msg);
      });
    }
  }

  onChannelSubscribed(channelId: number): void {
    this.channelService
      .subscribe(channelId)
      .subscribe(() => this.loadChannels());
  }

  onChannelUnsubscribed(channelId: number): void {
    this.channelService
      .unsubscribe(channelId)
      .subscribe(() => this.loadChannels());
  }

  onPublicChannelSelected(channel: Channel): void {
    this.selectedChannel = channel;
    this.channelMessages = [];
    this.channelService
      .getChannelMessages(channel.id)
      .subscribe((msgs: Message[]) => {
        this.channelMessages = msgs;
      });
  }

  async onCallInitiated(dto: {
    receiverId: number;
    callType: string;
    receiverName?: string;
    receiverPic?: string;
  }): Promise<void> {
    try {
      await this.setupLocalStream(dto.callType);
      this.createPeerConnection(dto.receiverId);
      this.activeCall = {
        targetId: dto.receiverId,
        name: dto.receiverName || 'Unknown',
        picUrl: dto.receiverPic,
        type: dto.callType,
      };
      this.callStatus = 'Calling...';
      this.callService
        .initiateCall({ receiverId: dto.receiverId, callType: dto.callType })
        .subscribe();
      this.signalr.callUser(dto.receiverId, dto.callType);
    } catch (e) {
      console.error('Call setup failed', e);
    }
  }

  async acceptIncomingCall(): Promise<void> {
    if (this.incomingCall) {
      try {
        await this.setupLocalStream(this.incomingCall.callType);
        this.createPeerConnection(this.incomingCall.callerId);
        this.activeCall = {
          targetId: this.incomingCall.callerId,
          name: this.incomingCall.callerName,
          picUrl: this.incomingCall.callerPic,
          type: this.incomingCall.callType,
        };
        this.callStatus = 'Connected';
        this.signalr.acceptCall(this.incomingCall.callerId);
        this.incomingCall = null;
      } catch (e) {
        console.error('Accept call failed', e);
      }
    }
  }

  rejectIncomingCall(): void {
    if (this.incomingCall) {
      this.signalr.rejectCall(this.incomingCall.callerId);
      this.incomingCall = null;
    }
  }

  endActiveCall(): void {
    if (this.activeCall) {
      this.signalr.endCall(this.activeCall.targetId);
    }
    this.peerConnection?.close();
    this.peerConnection = null;
    this.localStream?.getTracks().forEach((t) => t.stop());
    this.localStream = null;
    this.activeCall = null;
    this.callStatus = 'Connecting...';
    this.isMuted = false;
    this.isVideoOff = false;
    this.incomingCall = null;
  }

  toggleMute(): void {
    this.isMuted = !this.isMuted;
    this.localStream?.getAudioTracks().forEach((t) => {
      t.enabled = !this.isMuted;
    });
  }

  toggleVideo(): void {
    this.isVideoOff = !this.isVideoOff;
    this.localStream?.getVideoTracks().forEach((t) => {
      t.enabled = !this.isVideoOff;
    });
  }

  private async setupLocalStream(callType: string): Promise<void> {
    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: callType === 'video',
    });
  }

  private createPeerConnection(remoteUserId: number): void {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });
    this.localStream?.getTracks().forEach((track) => {
      this.peerConnection!.addTrack(track, this.localStream!);
    });
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.signalr.sendIceCandidate(
          remoteUserId,
          JSON.stringify(event.candidate.toJSON()),
        );
      }
    };
    this.peerConnection.ontrack = (event) => {
      // Attach remote stream to video element
      const remoteVid = document.querySelector(
        '.remote-video',
      ) as HTMLVideoElement;
      if (remoteVid && event.streams[0]) {
        remoteVid.srcObject = event.streams[0];
      }
    };
    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection?.connectionState === 'connected')
        this.callStatus = 'Connected';
      if (this.peerConnection?.connectionState === 'disconnected')
        this.endActiveCall();
    };
    // Attach local video
    const localVid = document.querySelector('.local-video') as HTMLVideoElement;
    if (localVid && this.localStream) localVid.srcObject = this.localStream;
  }

  onSearch(query: string): void {
    this.searchQuery = query;
  }

  updateOnlineStatus(userId: number, isOnline: boolean): void {
    const conv = this.conversations.find(
      (c) => c.type === 'direct' && c.id === userId,
    );
    if (conv) conv.isOnline = isOnline;
    const contact = this.contacts.find((c) => c.contactUserId === userId);
    if (contact) contact.isOnline = isOnline;
  }

  goToAdmin(): void {
    this.router.navigate(['/admin']);
  }

  logout(): void {
    this.signalr.stopConnection();
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
