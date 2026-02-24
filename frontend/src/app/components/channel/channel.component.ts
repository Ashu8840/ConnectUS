import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Channel, Message } from '../../models/models';
import { ChannelService } from '../../services/channel.service';

@Component({
  selector: 'app-channel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Discover tab (when no channel selected) -->
    <div class="discover-page" *ngIf="!channel || showDiscover">
      <div class="discover-header">
        <button
          *ngIf="channel"
          class="icon-btn back"
          (click)="showDiscover = false"
        >
          <i class="fas fa-arrow-left"></i>
        </button>
        <h2>Channels</h2>
      </div>
      <div class="search-bar">
        <i class="fas fa-search"></i>
        <input
          [(ngModel)]="searchQuery"
          placeholder="Search channels..."
          (input)="searchChannels()"
        />
      </div>
      <div class="channels-grid">
        <div
          *ngFor="let ch of publicChannels"
          class="channel-card"
          (click)="selectPublicChannel(ch)"
        >
          <div class="ch-avatar">
            <img *ngIf="ch.channelPictureUrl" [src]="ch.channelPictureUrl" />
            <span *ngIf="!ch.channelPictureUrl">{{ ch.name?.charAt(0) }}</span>
          </div>
          <div class="ch-info">
            <span class="ch-name">{{ ch.name }}</span>
            <span class="ch-desc">{{
              ch.description || 'No description'
            }}</span>
            <span class="ch-subs"
              ><i class="fas fa-users"></i>
              {{ ch.subscriberCount }} subscribers</span
            >
          </div>
          <button
            class="join-btn"
            *ngIf="!ch.isSubscribed"
            (click)="joinChannel(ch); $event.stopPropagation()"
          >
            Follow
          </button>
          <span class="joined-badge" *ngIf="ch.isSubscribed"
            ><i class="fas fa-check"></i> Following</span
          >
        </div>
        <div *ngIf="publicChannels.length === 0" class="no-channels">
          <i class="fas fa-broadcast-tower"></i>
          <p>No channels found</p>
        </div>
      </div>
    </div>

    <!-- Channel view -->
    <div class="channel-container" *ngIf="channel && !showDiscover">
      <!-- Header -->
      <div class="channel-header">
        <div class="channel-info">
          <button class="icon-btn" (click)="showDiscover = true">
            <i class="fas fa-arrow-left"></i>
          </button>
          <div class="avatar">
            <img
              *ngIf="channel.channelPictureUrl"
              [src]="channel.channelPictureUrl"
            />
            <span *ngIf="!channel.channelPictureUrl">{{
              channel.name?.charAt(0)
            }}</span>
          </div>
          <div class="details">
            <span class="channel-name">{{ channel.name }}</span>
            <span class="sub-count"
              >{{ channel.subscriberCount }} followers</span
            >
          </div>
        </div>
        <div class="channel-actions">
          <button class="icon-btn" (click)="showDetails = !showDetails">
            <i class="fas fa-info-circle"></i>
          </button>
          <button
            class="sub-btn"
            *ngIf="!channel.isSubscribed"
            (click)="subscribed.emit(channel.id)"
          >
            Follow
          </button>
          <button
            class="unsub-btn"
            *ngIf="channel.isSubscribed"
            (click)="unsubscribed.emit(channel.id)"
          >
            Unfollow
          </button>
        </div>
      </div>

      <!-- Details panel -->
      <div class="details-panel" *ngIf="showDetails">
        <div class="detail-item">
          <label>Description</label>
          <p>{{ channel.description || 'No description' }}</p>
        </div>
        <div class="detail-item">
          <label>Owner</label>
          <p>{{ channel.ownerName }}</p>
        </div>
        <div class="detail-item">
          <label>Created</label>
          <p>{{ channel.createdAt | date: 'mediumDate' }}</p>
        </div>
      </div>

      <!-- Messages -->
      <div class="channel-messages" #msgContainer>
        <div *ngFor="let msg of messages" class="channel-msg">
          <div class="msg-header">
            <span class="sender-name">{{ channel.name }}</span>
            <span class="msg-time">{{ msg.sentAt | date: 'short' }}</span>
          </div>
          <div *ngIf="msg.mediaUrl" class="media-content">
            <img
              *ngIf="msg.messageType === 'image'"
              [src]="msg.mediaUrl"
              class="media-img"
            />
            <video
              *ngIf="msg.messageType === 'video'"
              [src]="msg.mediaUrl"
              controls
              class="media-video"
            ></video>
            <a
              *ngIf="msg.messageType === 'document'"
              [href]="msg.mediaUrl"
              target="_blank"
              class="doc-link"
            >
              <i class="fas fa-file"></i> {{ msg.fileName || 'Document' }}
            </a>
          </div>
          <div class="msg-content" *ngIf="msg.content">{{ msg.content }}</div>
        </div>
        <div class="empty-channel" *ngIf="messages.length === 0">
          <i class="fas fa-broadcast-tower"></i>
          <p>No broadcasts yet</p>
        </div>
      </div>

      <!-- Post area (owner only) -->
      <div class="post-area" *ngIf="channel.ownerId === currentUserId">
        <button class="icon-btn" (click)="channelFileInput.click()">
          <i class="fas fa-paperclip"></i>
        </button>
        <input
          #channelFileInput
          type="file"
          style="display:none"
          (change)="onFileSelected($event)"
        />
        <input
          type="text"
          [(ngModel)]="postText"
          placeholder="Broadcast a message..."
          (keyup.enter)="sendPost()"
          class="post-input"
        />
        <button
          class="send-btn"
          (click)="sendPost()"
          [disabled]="!postText.trim()"
        >
          <i class="fas fa-paper-plane"></i>
        </button>
      </div>
      <div class="not-owner-bar" *ngIf="channel.ownerId !== currentUserId">
        <i class="fas fa-lock"></i> Only the channel owner can broadcast
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
      /* DISCOVER */
      .discover-page {
        height: 100%;
        display: flex;
        flex-direction: column;
        background: var(--bg-chat);
        overflow: hidden;
      }
      .discover-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 20px 24px 8px;
      }
      .discover-header h2 {
        margin: 0;
        font-size: 22px;
        font-weight: 700;
        color: var(--text-primary);
      }
      .search-bar {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 8px 20px 12px;
        padding: 10px 16px;
        background: var(--bg-input);
        border-radius: 24px;
        i {
          color: var(--text-secondary);
        }
        input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-primary);
          font-size: 14px;
        }
      }
      .channels-grid {
        flex: 1;
        overflow-y: auto;
        padding: 0 12px 16px;
      }
      .channel-card {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 12px 12px;
        border-radius: 12px;
        cursor: pointer;
        margin-bottom: 4px;
        &:hover {
          background: var(--hover);
        }
      }
      .ch-avatar {
        width: 52px;
        height: 52px;
        border-radius: 50%;
        background: var(--primary);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        font-weight: 700;
        color: white;
        overflow: hidden;
        flex-shrink: 0;
        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }
      .ch-info {
        flex: 1;
        min-width: 0;
      }
      .ch-name {
        font-size: 15px;
        font-weight: 600;
        display: block;
        color: var(--text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .ch-desc {
        font-size: 13px;
        color: var(--text-secondary);
        display: block;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .ch-subs {
        font-size: 12px;
        color: var(--text-secondary);
        i {
          margin-right: 4px;
        }
      }
      .join-btn {
        padding: 7px 16px;
        background: var(--primary);
        color: white;
        border: none;
        border-radius: 20px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
        flex-shrink: 0;
        white-space: nowrap;
      }
      .joined-badge {
        font-size: 13px;
        color: var(--primary);
        flex-shrink: 0;
        i {
          margin-right: 4px;
        }
      }
      .no-channels {
        text-align: center;
        padding: 60px 20px;
        color: var(--text-secondary);
        i {
          font-size: 48px;
          margin-bottom: 12px;
          display: block;
        }
      }
      /* CHANNEL VIEW */
      .channel-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: var(--bg-chat);
      }
      .channel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 16px;
        background: var(--bg-sidebar);
        border-bottom: 1px solid var(--border-color);
      }
      .channel-info {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .avatar {
        width: 42px;
        height: 42px;
        border-radius: 50%;
        background: var(--primary);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 600;
        overflow: hidden;
        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }
      .details {
        .channel-name {
          font-weight: 600;
          font-size: 16px;
          display: block;
        }
        .sub-count {
          font-size: 13px;
          color: var(--text-secondary);
        }
      }
      .channel-actions {
        display: flex;
        align-items: center;
        gap: 8px;
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
      .icon-btn.back {
        color: var(--text-primary);
      }
      .sub-btn {
        padding: 8px 20px;
        background: var(--primary);
        color: white;
        border: none;
        border-radius: 20px;
        cursor: pointer;
        font-weight: 500;
      }
      .unsub-btn {
        padding: 8px 20px;
        background: transparent;
        color: var(--text-secondary);
        border: 1px solid var(--border-color);
        border-radius: 20px;
        cursor: pointer;
      }
      .details-panel {
        padding: 16px;
        background: var(--bg-sidebar);
        border-bottom: 1px solid var(--border-color);
        .detail-item {
          margin-bottom: 10px;
          label {
            font-size: 12px;
            color: var(--primary);
            text-transform: uppercase;
            font-weight: 600;
            display: block;
            margin-bottom: 2px;
          }
          p {
            margin: 0;
            font-size: 14px;
          }
        }
      }
      .channel-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px 60px;
      }
      .channel-msg {
        max-width: 80%;
        margin: 0 auto 16px;
        padding: 12px 16px;
        background: var(--bg-message-in);
        border-radius: 8px;
      }
      .msg-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 6px;
        .sender-name {
          font-weight: 600;
          color: var(--primary-light);
          font-size: 14px;
        }
        .msg-time {
          font-size: 12px;
          color: var(--text-secondary);
        }
      }
      .msg-content {
        font-size: 14px;
        line-height: 1.5;
      }
      .media-img,
      .media-video {
        max-width: 100%;
        border-radius: 6px;
      }
      .doc-link {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--primary);
        text-decoration: none;
        padding: 8px;
        background: var(--bg-input);
        border-radius: 4px;
        font-size: 14px;
      }
      .empty-channel {
        text-align: center;
        padding: 60px 20px;
        color: var(--text-secondary);
        i {
          font-size: 48px;
          margin-bottom: 16px;
          display: block;
        }
      }
      .post-area {
        display: flex;
        align-items: center;
        padding: 10px 12px;
        background: var(--bg-sidebar);
        gap: 4px;
      }
      .post-input {
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
        &:disabled {
          opacity: 0.5;
        }
      }
      .not-owner-bar {
        padding: 12px 16px;
        background: var(--bg-sidebar);
        text-align: center;
        color: var(--text-secondary);
        font-size: 13px;
        border-top: 1px solid var(--border-color);
        i {
          margin-right: 6px;
        }
      }
    `,
  ],
})
export class ChannelComponent implements OnInit {
  @Input() channel: Channel | null = null;
  @Input() messages: Message[] = [];
  @Input() currentUserId = 0;
  @Output() subscribed = new EventEmitter<number>();
  @Output() unsubscribed = new EventEmitter<number>();
  @Output() postSent = new EventEmitter<any>();
  @Output() mediaPosted = new EventEmitter<File>();
  @Output() channelSelected = new EventEmitter<Channel>();

  showDetails = false;
  showDiscover = false;
  postText = '';
  searchQuery = '';
  publicChannels: Channel[] = [];

  constructor(private channelService: ChannelService) {}

  ngOnInit(): void {
    this.loadPublicChannels();
    if (!this.channel) this.showDiscover = true;
  }

  loadPublicChannels(): void {
    this.channelService
      .getPublicChannels(this.searchQuery)
      .subscribe((ch) => (this.publicChannels = ch));
  }

  searchChannels(): void {
    this.channelService
      .getPublicChannels(this.searchQuery)
      .subscribe((ch) => (this.publicChannels = ch));
  }

  selectPublicChannel(ch: Channel): void {
    this.channelSelected.emit(ch);
    this.showDiscover = false;
  }

  joinChannel(ch: Channel): void {
    this.channelService.subscribe(ch.id).subscribe(() => {
      ch.isSubscribed = true;
      ch.subscriberCount++;
      this.subscribed.emit(ch.id);
    });
  }

  sendPost(): void {
    if (!this.postText.trim()) return;
    this.postSent.emit({ content: this.postText.trim(), messageType: 'text' });
    this.postText = '';
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) this.mediaPosted.emit(file);
  }
}
