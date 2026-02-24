import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatListItem, Message } from '../../models/models';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-container">
      <!-- Chat header -->
      <div class="chat-header">
        <div class="chat-user-info">
          <div class="avatar">
            <img
              *ngIf="chatInfo?.pictureUrl"
              [src]="chatInfo!.pictureUrl"
              class="avatar"
            />
            <span *ngIf="!chatInfo?.pictureUrl">{{
              chatInfo?.name?.charAt(0)
            }}</span>
          </div>
          <div class="user-details">
            <span class="user-name">{{ chatInfo?.name }}</span>
            <span class="user-status" *ngIf="typingUser">typing...</span>
            <span class="user-status" *ngIf="!typingUser && chatInfo?.isOnline"
              >online</span
            >
            <span
              class="user-status"
              *ngIf="!typingUser && !chatInfo?.isOnline"
              >{{ chatInfo?.about || 'offline' }}</span
            >
          </div>
        </div>
        <div class="chat-actions">
          <button
            class="icon-btn"
            (click)="
              callInitiated.emit({
                receiverId: chatInfo!.id,
                callType: 'video',
              })
            "
            title="Video call"
          >
            <i class="fas fa-video"></i>
          </button>
          <button
            class="icon-btn"
            (click)="
              callInitiated.emit({
                receiverId: chatInfo!.id,
                callType: 'voice',
              })
            "
            title="Voice call"
          >
            <i class="fas fa-phone"></i>
          </button>
          <button
            class="icon-btn"
            (click)="showSearch = !showSearch"
            title="Search"
          >
            <i class="fas fa-search"></i>
          </button>
          <button class="icon-btn" (click)="showInfo = !showInfo" title="Info">
            <i class="fas fa-ellipsis-v"></i>
          </button>
        </div>
      </div>

      <!-- Search in chat -->
      <div class="chat-search" *ngIf="showSearch">
        <input
          type="text"
          [(ngModel)]="searchInChat"
          placeholder="Search in conversation"
          (ngModelChange)="filterMessages()"
        />
        <button
          class="icon-btn"
          (click)="showSearch = false; searchInChat = ''"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Messages area -->
      <div class="messages-area" #messagesContainer>
        <div class="messages-wrapper">
          <div *ngFor="let msg of displayMessages; let i = index">
            <!-- Date separator -->
            <div
              class="date-separator"
              *ngIf="i === 0 || isDifferentDay(displayMessages[i - 1], msg)"
            >
              <span>{{ msg.sentAt | date: 'mediumDate' }}</span>
            </div>

            <div
              class="message"
              [class.own]="msg.senderId === currentUserId"
              [class.deleted]="msg.isDeleted"
            >
              <!-- Reply indicator -->
              <div class="reply-preview" *ngIf="msg.replyToMessage">
                <span class="reply-name">{{
                  msg.replyToMessage.senderId === currentUserId
                    ? 'You'
                    : msg.senderName
                }}</span>
                <span class="reply-text">{{ msg.replyToMessage.content }}</span>
              </div>

              <!-- Forwarded label -->
              <div class="forwarded" *ngIf="msg.isForwarded">
                <i class="fas fa-share"></i> Forwarded
              </div>

              <!-- Sender name for groups -->
              <div
                class="msg-sender"
                *ngIf="
                  chatInfo?.type === 'group' && msg.senderId !== currentUserId
                "
              >
                {{ msg.senderName }}
              </div>

              <!-- Media content -->
              <div class="media-content" *ngIf="msg.mediaUrl && !msg.isDeleted">
                <img
                  *ngIf="msg.messageType === 'image'"
                  [src]="msg.mediaUrl"
                  class="media-img"
                  (click)="openMedia(msg.mediaUrl!)"
                />
                <video
                  *ngIf="msg.messageType === 'video'"
                  [src]="msg.mediaUrl"
                  controls
                  class="media-video"
                ></video>
                <audio
                  *ngIf="msg.messageType === 'audio'"
                  [src]="msg.mediaUrl"
                  controls
                  class="media-audio"
                ></audio>
                <div
                  *ngIf="msg.messageType === 'document'"
                  class="doc-preview"
                  (click)="openMedia(msg.mediaUrl!)"
                >
                  <i class="fas fa-file"></i>
                  <span>{{ msg.fileName || 'Document' }}</span>
                  <span class="file-size" *ngIf="msg.fileSize">{{
                    formatSize(msg.fileSize)
                  }}</span>
                </div>
              </div>

              <!-- Text content -->
              <div
                class="msg-text"
                *ngIf="msg.content && msg.messageType === 'text'"
              >
                {{ msg.content }}
              </div>
              <div class="msg-text deleted-text" *ngIf="msg.isDeleted">
                <i class="fas fa-ban"></i> {{ msg.content }}
              </div>

              <!-- Message footer -->
              <div class="msg-footer">
                <span class="msg-time">{{
                  msg.sentAt | date: 'shortTime'
                }}</span>
                <span
                  class="msg-status"
                  *ngIf="msg.senderId === currentUserId && !msg.isDeleted"
                >
                  <i
                    *ngIf="msg.isRead"
                    class="fas fa-check-double"
                    style="color: var(--secondary);"
                  ></i>
                  <i
                    *ngIf="!msg.isRead && msg.isDelivered"
                    class="fas fa-check-double"
                  ></i>
                  <i
                    *ngIf="!msg.isRead && !msg.isDelivered"
                    class="fas fa-check"
                  ></i>
                </span>
                <i class="fas fa-star starred-icon" *ngIf="msg.isStarred"></i>
              </div>

              <!-- Message context menu -->
              <div class="msg-actions" *ngIf="!msg.isDeleted">
                <button (click)="replyTo(msg)" title="Reply">
                  <i class="fas fa-reply"></i>
                </button>
                <button (click)="messageStarred.emit(msg.id)" title="Star">
                  <i class="fas fa-star"></i>
                </button>
                <button
                  *ngIf="msg.senderId === currentUserId"
                  (click)="messageDeleted.emit(msg.id)"
                  title="Delete"
                >
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Reply bar -->
      <div class="reply-bar" *ngIf="replyingTo">
        <div class="reply-info">
          <span class="reply-to-name">{{
            replyingTo.senderId === currentUserId
              ? 'You'
              : replyingTo.senderName
          }}</span>
          <span class="reply-to-text">{{ replyingTo.content }}</span>
        </div>
        <button class="icon-btn" (click)="replyingTo = null">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Input area -->
      <div class="input-area">
        <button class="icon-btn" (click)="showEmoji = !showEmoji">
          <i class="fas fa-smile"></i>
        </button>
        <button class="icon-btn" (click)="fileInput.click()">
          <i class="fas fa-paperclip"></i>
        </button>
        <input
          #fileInput
          type="file"
          style="display:none"
          (change)="onFileSelected($event)"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
        />
        <input
          type="text"
          [(ngModel)]="messageText"
          (keyup.enter)="sendMessage()"
          (input)="onTyping()"
          placeholder="Type a message"
          class="message-input"
        />
        <button
          class="send-btn"
          (click)="sendMessage()"
          [disabled]="!messageText.trim()"
        >
          <i class="fas fa-paper-plane"></i>
        </button>
      </div>

      <!-- Media preview modal -->
      <div
        class="modal-overlay"
        *ngIf="previewMedia"
        (click)="previewMedia = null"
      >
        <img [src]="previewMedia" class="preview-img" />
      </div>
    </div>
  `,
  styles: [
    `
      .chat-container {
        display: flex;
        flex-direction: column;
        height: 100vh;
        background: var(--bg-chat);
      }
      .chat-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 16px;
        background: var(--bg-sidebar);
        border-bottom: 1px solid var(--border-color);
      }
      .chat-user-info {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .user-details {
        display: flex;
        flex-direction: column;
        .user-name {
          font-size: 16px;
          font-weight: 600;
        }
        .user-status {
          font-size: 13px;
          color: var(--text-secondary);
        }
      }
      .chat-actions {
        display: flex;
        gap: 4px;
      }
      .icon-btn {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: none;
        background: transparent;
        color: var(--text-secondary);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        &:hover {
          background: var(--hover);
        }
      }
      .chat-search {
        display: flex;
        padding: 8px 12px;
        background: var(--bg-sidebar);
        gap: 8px;
        input {
          flex: 1;
          padding: 8px 12px;
          background: var(--bg-input);
          border: none;
          border-radius: 8px;
          color: var(--text-primary);
          outline: none;
          font-size: 14px;
        }
      }
      .messages-area {
        flex: 1;
        overflow-y: auto;
        padding: 12px 60px;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%230B141A'  width='200' height='200'/%3E%3Cg opacity='0.03'%3E%3Ccircle cx='50' cy='50' r='3' fill='%23ffffff'/%3E%3Ccircle cx='150' cy='100' r='3' fill='%23ffffff'/%3E%3Ccircle cx='100' cy='150' r='3' fill='%23ffffff'/%3E%3C/g%3E%3C/svg%3E");
      }
      .date-separator {
        text-align: center;
        margin: 16px 0;
        span {
          background: var(--bg-input);
          padding: 4px 12px;
          border-radius: 8px;
          font-size: 12px;
          color: var(--text-secondary);
        }
      }
      .message {
        max-width: 65%;
        padding: 8px 12px;
        margin-bottom: 4px;
        border-radius: 8px;
        position: relative;
        background: var(--bg-message-in);
        clear: both;
        float: left;
        &.own {
          background: var(--bg-message-out);
          float: right;
        }
        &.deleted {
          opacity: 0.6;
        }
        &:hover .msg-actions {
          display: flex;
        }
      }
      .messages-wrapper {
        overflow: hidden;
      }
      .msg-sender {
        font-size: 12px;
        font-weight: 600;
        color: var(--primary-light);
        margin-bottom: 2px;
      }
      .reply-preview {
        padding: 6px 10px;
        background: rgba(0, 0, 0, 0.15);
        border-left: 3px solid var(--primary);
        border-radius: 4px;
        margin-bottom: 4px;
        .reply-name {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: var(--primary-light);
        }
        .reply-text {
          font-size: 13px;
          color: var(--text-secondary);
        }
      }
      .forwarded {
        font-size: 11px;
        color: var(--text-secondary);
        font-style: italic;
        margin-bottom: 2px;
      }
      .media-content {
        margin-bottom: 4px;
        .media-img {
          max-width: 300px;
          max-height: 300px;
          border-radius: 6px;
          cursor: pointer;
        }
        .media-video {
          max-width: 300px;
          border-radius: 6px;
        }
        .media-audio {
          width: 250px;
        }
        .doc-preview {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px;
          background: rgba(0, 0, 0, 0.1);
          border-radius: 6px;
          cursor: pointer;
          i {
            font-size: 24px;
            color: var(--text-secondary);
          }
          .file-size {
            font-size: 12px;
            color: var(--text-secondary);
          }
        }
      }
      .msg-text {
        font-size: 14px;
        line-height: 1.4;
        word-wrap: break-word;
      }
      .deleted-text {
        font-style: italic;
        color: var(--text-secondary);
      }
      .msg-footer {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 4px;
        margin-top: 2px;
        .msg-time {
          font-size: 11px;
          color: var(--text-secondary);
        }
        .msg-status {
          font-size: 14px;
          color: var(--text-secondary);
        }
        .starred-icon {
          font-size: 10px;
          color: var(--warning);
        }
      }
      .msg-actions {
        display: none;
        position: absolute;
        top: 4px;
        right: 4px;
        background: var(--bg-sidebar);
        border-radius: 6px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        button {
          padding: 6px 10px;
          border: none;
          background: none;
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 12px;
          &:hover {
            background: var(--hover);
            color: var(--text-primary);
          }
        }
      }
      .reply-bar {
        display: flex;
        align-items: center;
        padding: 8px 16px;
        background: var(--bg-sidebar);
        border-top: 1px solid var(--border-color);
        .reply-info {
          flex: 1;
          padding: 6px 10px;
          background: var(--bg-input);
          border-left: 3px solid var(--primary);
          border-radius: 4px;
          .reply-to-name {
            display: block;
            font-size: 12px;
            font-weight: 600;
            color: var(--primary);
          }
          .reply-to-text {
            font-size: 13px;
            color: var(--text-secondary);
          }
        }
      }
      .input-area {
        display: flex;
        align-items: center;
        padding: 10px 12px;
        background: var(--bg-sidebar);
        gap: 4px;
      }
      .message-input {
        flex: 1;
        padding: 12px 16px;
        background: var(--bg-input);
        border: none;
        border-radius: 8px;
        color: var(--text-primary);
        font-size: 14px;
        outline: none;
        &::placeholder {
          color: var(--text-secondary);
        }
      }
      .send-btn {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        border: none;
        background: var(--primary);
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        transition: background 0.2s;
        &:hover {
          background: var(--primary-dark);
        }
        &:disabled {
          opacity: 0.5;
        }
      }
      .preview-img {
        max-width: 90%;
        max-height: 90%;
        object-fit: contain;
        border-radius: 8px;
      }
    `,
  ],
})
export class ChatComponent implements AfterViewChecked {
  @Input() chatInfo: ChatListItem | null = null;
  @Input() messages: Message[] = [];
  @Input() currentUserId = 0;
  @Input() typingUser: number | null = null;

  @Output() messageSent = new EventEmitter<any>();
  @Output() mediaUploaded = new EventEmitter<File>();
  @Output() callInitiated = new EventEmitter<any>();
  @Output() messageDeleted = new EventEmitter<number>();
  @Output() messageStarred = new EventEmitter<number>();

  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  messageText = '';
  showSearch = false;
  showInfo = false;
  showEmoji = false;
  searchInChat = '';
  replyingTo: Message | null = null;
  previewMedia: string | null = null;
  displayMessages: Message[] = [];
  private shouldScroll = true;

  ngOnChanges(): void {
    this.displayMessages = this.messages;
    this.shouldScroll = true;
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  sendMessage(): void {
    if (!this.messageText.trim()) return;
    const dto: any = {
      content: this.messageText.trim(),
      messageType: 'text',
      replyToMessageId: this.replyingTo?.id || null,
    };
    this.messageSent.emit(dto);
    this.messageText = '';
    this.replyingTo = null;
    this.shouldScroll = true;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.mediaUploaded.emit(file);
    }
  }

  replyTo(msg: Message): void {
    this.replyingTo = msg;
  }

  openMedia(url: string): void {
    this.previewMedia = url;
  }

  onTyping(): void {
    // Typing indicator would be handled via SignalR
  }

  isDifferentDay(prev: Message, curr: Message): boolean {
    if (!prev) return true;
    return (
      new Date(prev.sentAt).toDateString() !==
      new Date(curr.sentAt).toDateString()
    );
  }

  filterMessages(): void {
    if (!this.searchInChat) {
      this.displayMessages = this.messages;
    } else {
      const q = this.searchInChat.toLowerCase();
      this.displayMessages = this.messages.filter((m) =>
        m.content.toLowerCase().includes(q),
      );
    }
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop =
          this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (err) {}
  }
}
