import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ChatListItem,
  Contact,
  UserStories,
  Channel,
  CallLog,
  Group,
} from '../../models/models';
import { GroupService } from '../../services/group.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="sidebar">
      <!-- Header -->
      <div class="sidebar-header">
        <div class="header-left">
          <div class="avatar" (click)="profileClicked.emit()">
            <img
              *ngIf="currentUser?.profilePictureUrl"
              [src]="currentUser.profilePictureUrl"
              class="avatar"
            />
            <span *ngIf="!currentUser?.profilePictureUrl">{{
              currentUser?.fullName?.charAt(0) || 'U'
            }}</span>
          </div>
          <h2 class="app-name">ConnectUS</h2>
        </div>
        <div class="header-actions">
          <button
            *ngIf="currentUser?.role === 'Admin'"
            class="icon-btn"
            title="Admin Panel"
            (click)="adminClicked.emit()"
          >
            <i class="fas fa-shield-alt"></i>
          </button>
          <button
            class="icon-btn"
            title="New chat"
            (click)="showNewChat = !showNewChat"
          >
            <i class="fas fa-edit"></i>
          </button>
          <div class="dropdown" *ngIf="showMenu">
            <button
              class="dropdown-item"
              (click)="settingsClicked.emit(); showMenu = false"
            >
              <i class="fas fa-cog"></i> Settings
            </button>
            <button
              class="dropdown-item"
              (click)="logoutClicked.emit(); showMenu = false"
            >
              <i class="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>
          <button class="icon-btn" (click)="showMenu = !showMenu">
            <i class="fas fa-ellipsis-v"></i>
          </button>
        </div>
      </div>

      <!-- Search -->
      <div class="search-bar">
        <i class="fas fa-search"></i>
        <input
          type="text"
          [(ngModel)]="searchQuery"
          (ngModelChange)="searchChanged.emit($event)"
          placeholder="Search or start new chat"
        />
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button
          [class.active]="activeTab === 'chats'"
          (click)="tabChanged.emit('chats')"
        >
          <i class="fas fa-comment-dots"></i> Chats
        </button>
        <button
          [class.active]="activeTab === 'stories'"
          (click)="tabChanged.emit('stories')"
        >
          <i class="fas fa-circle-notch"></i> Status
        </button>
        <button
          [class.active]="activeTab === 'channels'"
          (click)="tabChanged.emit('channels')"
        >
          <i class="fas fa-broadcast-tower"></i> Channels
        </button>
        <button
          [class.active]="activeTab === 'calls'"
          (click)="tabChanged.emit('calls')"
        >
          <i class="fas fa-phone-alt"></i> Calls
        </button>
        <button
          [class.active]="activeTab === 'contacts'"
          (click)="tabChanged.emit('contacts')"
        >
          <i class="fas fa-address-book"></i> Contacts
        </button>
      </div>

      <!-- Chat list -->
      <div class="list-content" *ngIf="activeTab === 'chats'">
        <div
          class="list-item"
          *ngFor="let conv of filteredConversations"
          [class.active]="selectedChatId === conv.id && conv.type !== 'channel'"
          (click)="chatSelected.emit(conv)"
        >
          <div class="item-avatar">
            <img
              *ngIf="conv.pictureUrl"
              [src]="conv.pictureUrl"
              class="avatar"
            />
            <div *ngIf="!conv.pictureUrl" class="avatar">
              <i *ngIf="conv.type === 'group'" class="fas fa-users"></i>
              <span *ngIf="conv.type !== 'group'">{{
                conv.name?.charAt(0)
              }}</span>
            </div>
            <span
              class="online-indicator"
              *ngIf="conv.isOnline && conv.type === 'direct'"
            ></span>
          </div>
          <div class="item-info">
            <div class="item-top">
              <span class="item-name">{{ conv.name }}</span>
              <span class="item-time">{{
                conv.lastMessageTime | date: 'shortTime'
              }}</span>
            </div>
            <div class="item-bottom">
              <span class="item-preview">{{
                conv.lastMessageContent || 'No messages yet'
              }}</span>
              <span class="badge" *ngIf="conv.unreadCount > 0">{{
                conv.unreadCount
              }}</span>
            </div>
          </div>
        </div>
        <div class="empty-list" *ngIf="filteredConversations.length === 0">
          <p>No conversations yet</p>
        </div>
        <!-- Find Groups section -->
        <div class="find-groups-bar">
          <button class="add-btn" (click)="openFindGroups()">
            <i class="fas fa-users"></i> Find Groups
          </button>
        </div>
        <!-- Find Groups Overlay -->
        <div class="find-groups-overlay" *ngIf="showFindGroups">
          <div class="fg-header">
            <button class="icon-btn" (click)="showFindGroups = false">
              <i class="fas fa-arrow-left"></i>
            </button>
            <h3>Find Groups</h3>
          </div>
          <div class="fg-search">
            <i class="fas fa-search"></i>
            <input
              [(ngModel)]="groupSearchQuery"
              placeholder="Search groups..."
              (input)="searchPublicGroups()"
            />
          </div>
          <div class="fg-list">
            <div *ngFor="let g of publicGroups" class="fg-item">
              <div class="fg-avatar">
                <img *ngIf="g.groupPictureUrl" [src]="g.groupPictureUrl" />
                <span *ngIf="!g.groupPictureUrl">{{ g.name?.charAt(0) }}</span>
              </div>
              <div class="fg-info">
                <span class="fg-name">{{ g.name }}</span>
                <span class="fg-desc">{{
                  g.description || g.members.length + ' members'
                }}</span>
              </div>
              <button
                class="join-btn"
                *ngIf="!g.isMember && !groupJoinedIds.has(g.id)"
                (click)="joinSearchGroup(g)"
              >
                Join
              </button>
              <span
                class="joined-tag"
                *ngIf="g.isMember || groupJoinedIds.has(g.id)"
                ><i class="fas fa-check"></i
              ></span>
            </div>
            <div class="empty-list" *ngIf="publicGroups.length === 0">
              <p>
                {{
                  groupSearchQuery
                    ? 'No groups found'
                    : 'Search for groups to join'
                }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Contacts list -->
      <div class="list-content" *ngIf="activeTab === 'contacts'">
        <button class="add-btn" (click)="showAddContact = !showAddContact">
          <i class="fas fa-user-plus"></i> Add Contact
        </button>
        <div class="add-form" *ngIf="showAddContact">
          <input
            type="text"
            [(ngModel)]="newContactUsername"
            placeholder="Username or email"
          />
          <button class="btn btn-primary btn-sm" (click)="addContact()">
            Add
          </button>
        </div>
        <div
          class="list-item"
          *ngFor="let contact of filteredContacts"
          (click)="selectContact(contact)"
        >
          <div class="item-avatar">
            <img
              *ngIf="contact.profilePictureUrl"
              [src]="contact.profilePictureUrl"
              class="avatar"
            />
            <div *ngIf="!contact.profilePictureUrl" class="avatar">
              {{ contact.fullName?.charAt(0) }}
            </div>
            <span class="online-indicator" *ngIf="contact.isOnline"></span>
          </div>
          <div class="item-info">
            <span class="item-name">{{
              contact.nickname || contact.fullName
            }}</span>
            <span class="item-about">{{ contact.about }}</span>
          </div>
        </div>
      </div>

      <!-- Stories list (quick access) -->
      <div class="list-content" *ngIf="activeTab === 'stories'">
        <!-- My Status card -->
        <div class="list-item my-status" (click)="onMyStatusClick()">
          <div class="item-avatar">
            <div class="story-ring" [class.has-story]="myStoriesCount > 0">
              <img
                *ngIf="currentUser?.profilePictureUrl"
                [src]="currentUser.profilePictureUrl"
                class="avatar"
              />
              <div *ngIf="!currentUser?.profilePictureUrl" class="avatar">
                {{ currentUser?.fullName?.charAt(0) || 'M' }}
              </div>
            </div>
            <div class="add-story-plus"><i class="fas fa-plus"></i></div>
          </div>
          <div class="item-info">
            <span class="item-name">My Status</span>
            <span class="item-about">{{
              myStoriesCount > 0
                ? myStoriesCount + ' update' + (myStoriesCount > 1 ? 's' : '')
                : 'Tap to add status update'
            }}</span>
          </div>
        </div>
        <!-- Contact stories -->
        <div *ngIf="otherStories.length > 0" class="section-label">
          Recent updates
        </div>
        <div
          class="list-item"
          *ngFor="let us of otherStories"
          (click)="viewStory(us)"
        >
          <div class="item-avatar">
            <div class="story-ring" [class.unviewed]="us.hasUnviewed">
              <img
                *ngIf="us.profilePictureUrl"
                [src]="us.profilePictureUrl"
                class="avatar"
              />
              <div *ngIf="!us.profilePictureUrl" class="avatar">
                {{ us.fullName?.charAt(0) }}
              </div>
            </div>
          </div>
          <div class="item-info">
            <span class="item-name">{{ us.fullName }}</span>
            <span class="item-about">{{
              us.stories[0]?.createdAt | date: 'shortTime'
            }}</span>
          </div>
        </div>
        <div
          *ngIf="otherStories.length === 0 && myStoriesCount === 0"
          class="empty-list"
        >
          <p>No status updates yet</p>
        </div>
      </div>

      <!-- Channels list -->
      <div class="list-content" *ngIf="activeTab === 'channels'">
        <button
          class="add-btn"
          (click)="showCreateChannel = !showCreateChannel"
        >
          <i class="fas fa-plus-circle"></i> Create Channel
        </button>
        <div class="add-form" *ngIf="showCreateChannel">
          <input
            type="text"
            [(ngModel)]="newChannelName"
            placeholder="Channel name"
          />
          <textarea
            [(ngModel)]="newChannelDesc"
            placeholder="Description"
            rows="2"
          ></textarea>
          <button class="btn btn-primary btn-sm" (click)="createChannel()">
            Create
          </button>
        </div>
        <!-- My channels -->
        <div *ngIf="channels.length > 0" class="section-label">
          Your channels
        </div>
        <div
          class="list-item"
          *ngFor="let ch of channels"
          [class.active]="selectedChannel?.id === ch.id"
          (click)="selectChannel(ch)"
        >
          <div class="item-avatar">
            <img
              *ngIf="ch.channelPictureUrl"
              [src]="ch.channelPictureUrl"
              class="avatar"
            />
            <div *ngIf="!ch.channelPictureUrl" class="avatar channel-avatar">
              {{ ch.name?.charAt(0) }}
            </div>
          </div>
          <div class="item-info">
            <span class="item-name">{{ ch.name }}</span>
            <span class="item-about">{{ ch.subscriberCount }} followers</span>
          </div>
        </div>
        <div *ngIf="channels.length === 0" class="empty-list">
          <p>Follow channels to see them here</p>
        </div>
      </div>

      <!-- Calls list -->
      <div class="list-content" *ngIf="activeTab === 'calls'">
        <div class="list-item" *ngFor="let call of callHistory">
          <div class="item-avatar">
            <ng-container *ngIf="call.callerId === currentUser?.userId">
              <img
                *ngIf="call.receiverPic"
                [src]="call.receiverPic"
                class="avatar"
              />
              <div *ngIf="!call.receiverPic" class="avatar">
                {{ call.receiverName?.charAt(0) }}
              </div>
            </ng-container>
            <ng-container *ngIf="call.callerId !== currentUser?.userId">
              <img
                *ngIf="call.callerPic"
                [src]="call.callerPic"
                class="avatar"
              />
              <div *ngIf="!call.callerPic" class="avatar">
                {{ call.callerName?.charAt(0) }}
              </div>
            </ng-container>
          </div>
          <div class="item-info">
            <span class="item-name">
              {{
                call.callerId === currentUser?.userId
                  ? call.receiverName
                  : call.callerName
              }}
            </span>
            <span class="item-about" [class.missed]="call.status === 'missed'">
              <i
                [class]="
                  call.callType === 'video' ? 'fas fa-video' : 'fas fa-phone'
                "
                style="margin-right:4px"
              ></i>
              <i
                [class]="
                  call.callerId === currentUser?.userId
                    ? 'fas fa-arrow-up'
                    : 'fas fa-arrow-down'
                "
                [style.color]="
                  call.status === 'missed' ? 'var(--danger)' : 'var(--success)'
                "
                style="margin-right:4px; font-size:11px"
              ></i>
              {{ call.startedAt | date: 'short' }}
              <span *ngIf="call.durationSeconds">
                &middot; {{ formatDuration(call.durationSeconds) }}</span
              >
            </span>
          </div>
          <button
            class="icon-btn"
            (click)="callUser(call); $event.stopPropagation()"
          >
            <i
              [class]="
                call.callType === 'video' ? 'fas fa-video' : 'fas fa-phone'
              "
              style="color:var(--primary)"
            ></i>
          </button>
        </div>
        <div *ngIf="callHistory.length === 0" class="empty-list">
          <p>No recent calls</p>
        </div>
      </div>

      <!-- New Group form -->
      <div
        class="modal-overlay"
        *ngIf="showNewChat"
        (click)="showNewChat = false"
      >
        <div class="modal-content" (click)="$event.stopPropagation()">
          <h3>New Group Chat</h3>
          <div class="input-group">
            <label>Group Name</label>
            <input
              type="text"
              [(ngModel)]="newGroupName"
              placeholder="Group name"
            />
          </div>
          <div class="input-group">
            <label>Description</label>
            <textarea
              [(ngModel)]="newGroupDesc"
              placeholder="Group description"
              rows="2"
            ></textarea>
          </div>
          <div class="input-group">
            <label>Select Members</label>
            <div class="member-list">
              <label class="member-item" *ngFor="let c of contacts">
                <input
                  type="checkbox"
                  [checked]="selectedMembers.includes(c.contactUserId)"
                  (change)="toggleMember(c.contactUserId)"
                />
                <span>{{ c.fullName }}</span>
              </label>
            </div>
          </div>
          <button
            class="btn btn-primary"
            (click)="createGroup()"
            [disabled]="!newGroupName"
          >
            Create Group
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .sidebar {
        width: 380px;
        min-width: 380px;
        background: var(--bg-sidebar);
        border-right: 1px solid var(--border-color);
        display: flex;
        flex-direction: column;
        height: 100vh;
      }
      .sidebar-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        background: var(--bg-sidebar);
      }
      .header-left {
        display: flex;
        align-items: center;
        gap: 12px;
        .app-name {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
        }
      }
      .header-actions {
        display: flex;
        gap: 4px;
        position: relative;
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
      .dropdown {
        position: absolute;
        top: 44px;
        right: 0;
        background: var(--bg-sidebar);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        overflow: hidden;
        z-index: 100;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }
      .dropdown-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 20px;
        border: none;
        background: none;
        color: var(--text-primary);
        cursor: pointer;
        font-size: 14px;
        width: 100%;
        &:hover {
          background: var(--hover);
        }
      }
      .search-bar {
        display: flex;
        align-items: center;
        margin: 0 12px 8px;
        background: var(--bg-input);
        border-radius: 8px;
        padding: 0 12px;
        i {
          color: var(--text-secondary);
          font-size: 14px;
        }
        input {
          flex: 1;
          border: none;
          background: none;
          padding: 10px 12px;
          color: var(--text-primary);
          font-size: 14px;
          outline: none;
          &::placeholder {
            color: var(--text-secondary);
          }
        }
      }
      .tabs {
        display: flex;
        border-bottom: 1px solid var(--border-color);
        button {
          flex: 1;
          padding: 12px 4px;
          border: none;
          background: none;
          color: var(--text-secondary);
          font-size: 11px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
          i {
            font-size: 16px;
          }
          &.active {
            color: var(--primary);
            border-bottom-color: var(--primary);
          }
          &:hover {
            background: var(--hover);
          }
        }
      }
      .list-content {
        flex: 1;
        overflow-y: auto;
        position: relative;
      }
      .list-item {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        cursor: pointer;
        gap: 12px;
        transition: background 0.15s;
        &:hover {
          background: var(--hover);
        }
        &.active {
          background: var(--bg-input);
        }
        .item-avatar {
          position: relative;
          flex-shrink: 0;
        }
        .item-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }
        .item-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .item-name {
          font-size: 15px;
          font-weight: 500;
          color: var(--text-primary);
        }
        .item-time {
          font-size: 12px;
          color: var(--text-secondary);
        }
        .item-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 2px;
        }
        .item-preview {
          font-size: 13px;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 220px;
        }
        .item-about {
          font-size: 13px;
          color: var(--text-secondary);
          margin-top: 2px;
        }
      }
      .story-ring {
        width: 52px;
        height: 52px;
        border-radius: 50%;
        padding: 2px;
        border: 2px solid var(--border-color);
        position: relative;
        &.has-story {
          border-color: var(--primary);
        }
        &.unviewed {
          border-color: var(--primary);
        }
      }
      .my-status {
        border-bottom: 1px solid var(--border-color);
      }
      .add-story-plus {
        position: absolute;
        bottom: -2px;
        right: -2px;
        width: 18px;
        height: 18px;
        background: var(--primary);
        border-radius: 50%;
        border: 2px solid var(--bg-sidebar);
        display: flex;
        align-items: center;
        justify-content: center;
        i {
          font-size: 8px;
          color: white;
        }
      }
      .section-label {
        padding: 8px 16px 4px;
        font-size: 12px;
        font-weight: 600;
        color: var(--primary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .channel-avatar {
        background: var(--primary);
        color: white;
        font-weight: 700;
        font-size: 18px;
      }
      .story-avatar.has-story {
        border: 2px solid var(--primary);
        border-radius: 50%;
        padding: 2px;
      }
      .channel-avatar {
        background: var(--primary) !important;
        i {
          font-size: 18px;
        }
      }
      .add-btn {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 16px;
        width: 100%;
        border: none;
        background: none;
        color: var(--primary);
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        &:hover {
          background: var(--hover);
        }
      }
      .add-form {
        padding: 8px 16px 16px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        input,
        textarea {
          width: 100%;
          padding: 10px 12px;
          background: var(--bg-input);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          color: var(--text-primary);
          font-size: 14px;
          outline: none;
          &::placeholder {
            color: var(--text-secondary);
          }
        }
      }
      .btn-sm {
        padding: 8px 16px;
        font-size: 13px;
      }
      .member-list {
        max-height: 200px;
        overflow-y: auto;
        .member-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 0;
          cursor: pointer;
          font-size: 14px;
          color: var(--text-primary);
        }
      }
      .empty-list {
        padding: 40px 20px;
        text-align: center;
        color: var(--text-secondary);
      }
      .missed {
        color: var(--danger) !important;
      }
      .find-groups-bar {
        border-top: 1px solid var(--border-color);
      }
      .find-groups-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: var(--bg-sidebar);
        z-index: 10;
        display: flex;
        flex-direction: column;
        .fg-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border-bottom: 1px solid var(--border-color);
          h3 {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
          }
        }
        .fg-search {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: var(--bg-input);
          margin: 8px;
          border-radius: 8px;
          i {
            color: var(--text-secondary);
          }
          input {
            flex: 1;
            border: none;
            background: none;
            color: var(--text-primary);
            font-size: 14px;
            outline: none;
          }
        }
        .fg-list {
          flex: 1;
          overflow-y: auto;
          .fg-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 16px;
            border-bottom: 1px solid var(--border-color);
            .fg-avatar {
              width: 42px;
              height: 42px;
              border-radius: 50%;
              background: var(--primary);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: 700;
              font-size: 16px;
              overflow: hidden;
              flex-shrink: 0;
              img {
                width: 100%;
                height: 100%;
                object-fit: cover;
              }
            }
            .fg-info {
              flex: 1;
              .fg-name {
                display: block;
                font-size: 14px;
                font-weight: 500;
                color: var(--text-primary);
              }
              .fg-desc {
                display: block;
                font-size: 12px;
                color: var(--text-secondary);
              }
            }
            .join-btn {
              padding: 6px 14px;
              border-radius: 20px;
              border: 1px solid var(--primary);
              background: none;
              color: var(--primary);
              font-size: 13px;
              font-weight: 600;
              cursor: pointer;
              &:hover {
                background: var(--primary);
                color: white;
              }
            }
            .joined-tag {
              color: var(--primary);
              font-size: 16px;
            }
          }
        }
      }
    `,
  ],
})
export class SidebarComponent {
  @Input() conversations: ChatListItem[] = [];
  @Input() contacts: Contact[] = [];
  @Input() stories: UserStories[] = [];
  @Input() channels: Channel[] = [];
  @Input() callHistory: CallLog[] = [];
  @Input() activeTab = 'chats';
  @Input() selectedChatId: number | null = null;
  @Input() currentUser: any;

  @Output() tabChanged = new EventEmitter<string>();
  @Output() chatSelected = new EventEmitter<ChatListItem>();
  @Output() contactAdded = new EventEmitter<any>();
  @Output() groupCreated = new EventEmitter<any>();
  @Output() channelCreated = new EventEmitter<any>();
  @Output() storyCreated = new EventEmitter<any>();
  @Output() callInitiated = new EventEmitter<{
    receiverId: number;
    receiverName: string;
    receiverPic?: string;
    callType: string;
  }>();
  @Output() storyTabClicked = new EventEmitter<void>();
  @Output() profileClicked = new EventEmitter<void>();
  @Output() settingsClicked = new EventEmitter<void>();
  @Output() adminClicked = new EventEmitter<void>();
  @Output() logoutClicked = new EventEmitter<void>();
  @Output() searchChanged = new EventEmitter<string>();

  searchQuery = '';
  showMenu = false;
  showNewChat = false;
  showAddContact = false;
  showCreateStory = false;
  showCreateChannel = false;
  showFindGroups = false;
  groupSearchQuery = '';
  publicGroups: Group[] = [];
  groupJoinedIds = new Set<number>();

  constructor(private groupService: GroupService) {}

  newContactUsername = '';
  newGroupName = '';
  newGroupDesc = '';
  selectedMembers: number[] = [];
  newStoryText = '';
  newStoryBg = '#128C7E';
  newChannelName = '';
  newChannelDesc = '';
  selectedChannel: Channel | null = null;

  get myStoriesCount(): number {
    return (
      this.stories.find((s) => s.userId === this.currentUser?.userId)?.stories
        ?.length || 0
    );
  }

  get otherStories(): UserStories[] {
    return this.stories.filter((s) => s.userId !== this.currentUser?.userId);
  }

  get filteredConversations(): ChatListItem[] {
    if (!this.searchQuery) return this.conversations;
    const q = this.searchQuery.toLowerCase();
    return this.conversations.filter((c) => c.name.toLowerCase().includes(q));
  }

  get filteredContacts(): Contact[] {
    if (!this.searchQuery) return this.contacts;
    const q = this.searchQuery.toLowerCase();
    return this.contacts.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.username.toLowerCase().includes(q),
    );
  }

  onMyStatusClick(): void {
    this.tabChanged.emit('stories');
  }

  viewStory(us: UserStories): void {
    this.tabChanged.emit('stories');
  }

  addContact(): void {
    if (this.newContactUsername.trim()) {
      this.contactAdded.emit({
        usernameOrEmail: this.newContactUsername.trim(),
      });
      this.newContactUsername = '';
      this.showAddContact = false;
    }
  }

  selectContact(contact: Contact): void {
    this.chatSelected.emit({
      type: 'direct',
      id: contact.contactUserId,
      name: contact.nickname || contact.fullName,
      pictureUrl: contact.profilePictureUrl,
      isOnline: contact.isOnline,
      about: contact.about,
      lastMessageContent: undefined,
      lastMessageTime: undefined,
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
    });
  }

  selectChannel(ch: Channel): void {
    this.selectedChannel = ch;
  }

  toggleMember(userId: number): void {
    const idx = this.selectedMembers.indexOf(userId);
    if (idx >= 0) this.selectedMembers.splice(idx, 1);
    else this.selectedMembers.push(userId);
  }

  createGroup(): void {
    if (this.newGroupName.trim()) {
      this.groupCreated.emit({
        name: this.newGroupName.trim(),
        description: this.newGroupDesc,
        memberIds: this.selectedMembers,
      });
      this.newGroupName = '';
      this.newGroupDesc = '';
      this.selectedMembers = [];
      this.showNewChat = false;
    }
  }

  createTextStory(): void {
    if (this.newStoryText.trim()) {
      this.storyCreated.emit({
        contentType: 'text',
        textContent: this.newStoryText.trim(),
        backgroundColor: this.newStoryBg || '#128C7E',
      });
      this.newStoryText = '';
      this.showCreateStory = false;
    }
  }

  createChannel(): void {
    if (this.newChannelName.trim()) {
      this.channelCreated.emit({
        name: this.newChannelName.trim(),
        description: this.newChannelDesc,
        isPublic: true,
      });
      this.newChannelName = '';
      this.newChannelDesc = '';
      this.showCreateChannel = false;
    }
  }

  callUser(call: CallLog): void {
    const isOutgoing = call.callerId === this.currentUser?.userId;
    this.callInitiated.emit({
      receiverId: isOutgoing ? call.receiverId : call.callerId,
      receiverName: isOutgoing ? call.receiverName : call.callerName,
      receiverPic: isOutgoing ? call.receiverPic : call.callerPic,
      callType: call.callType,
    });
  }

  openFindGroups(): void {
    this.showFindGroups = true;
    this.searchPublicGroups();
  }

  searchPublicGroups(): void {
    this.groupService.searchGroups(this.groupSearchQuery).subscribe({
      next: (groups) => {
        this.publicGroups = groups;
      },
      error: () => {
        this.publicGroups = [];
      },
    });
  }

  joinSearchGroup(group: Group): void {
    this.groupService.joinGroup(group.id).subscribe({
      next: () => {
        this.groupJoinedIds.add(group.id);
        group.isMember = true;
      },
    });
  }

  formatDuration(secs: number): string {
    if (!secs) return '';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  }
}
