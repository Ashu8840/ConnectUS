import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoryService } from '../../services/story.service';
import { UserStories, Story } from '../../models/models';

@Component({
  selector: 'app-story',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- ===================== CREATE STORY OVERLAY ===================== -->
    <div class="creator-overlay" *ngIf="showCreator">
      <div class="creator-header">
        <button class="icon-btn" (click)="closeCreator()">
          <i class="fas fa-times"></i>
        </button>
        <h3>Create Status</h3>
      </div>
      <div class="creator-tabs">
        <button
          [class.active]="creatorMode === 'text'"
          (click)="creatorMode = 'text'"
        >
          <i class="fas fa-font"></i> Text
        </button>
        <button
          [class.active]="creatorMode === 'photo'"
          (click)="creatorMode = 'photo'"
        >
          <i class="fas fa-image"></i> Photo
        </button>
      </div>
      <!-- Text story creator -->
      <div
        *ngIf="creatorMode === 'text'"
        class="text-creator"
        [style.background]="textBg"
        [style.color]="textColor"
      >
        <div class="text-overlay-input">
          <textarea
            [(ngModel)]="storyText"
            placeholder="Type a status..."
            [style.color]="textColor"
            maxlength="700"
          ></textarea>
        </div>
        <div class="text-controls">
          <div class="color-row">
            <label>Background</label>
            <div class="color-swatches">
              <div
                *ngFor="let c of bgColors"
                class="swatch"
                [style.background]="c"
                [class.selected]="textBg === c"
                (click)="textBg = c"
              ></div>
              <input type="color" [(ngModel)]="textBg" title="Custom bg" />
            </div>
          </div>
          <div class="color-row">
            <label>Text Color</label>
            <div class="color-swatches">
              <div
                *ngFor="let c of textColors"
                class="swatch"
                [style.background]="c"
                [class.selected]="textColor === c"
                (click)="textColor = c"
              ></div>
              <input type="color" [(ngModel)]="textColor" title="Custom text" />
            </div>
          </div>
        </div>
        <button
          class="post-btn"
          [disabled]="!storyText.trim()"
          (click)="postTextStory()"
        >
          <i class="fas fa-paper-plane"></i> Post Status
        </button>
      </div>
      <!-- Photo story creator -->
      <div *ngIf="creatorMode === 'photo'" class="photo-creator">
        <div
          class="photo-drop"
          *ngIf="!photoPreview"
          (click)="photoInput.click()"
        >
          <i class="fas fa-camera"></i>
          <p>Click to select photo or video</p>
        </div>
        <div *ngIf="photoPreview" class="photo-preview-box">
          <img [src]="photoPreview" />
          <button class="change-btn" (click)="photoInput.click()">
            Change
          </button>
        </div>
        <input
          #photoInput
          type="file"
          accept="image/*,video/*"
          style="display:none"
          (change)="onPhotoSelected($event)"
        />
        <input
          type="text"
          [(ngModel)]="photoCaption"
          placeholder="Add a caption..."
          class="caption-input"
        />
        <button
          class="post-btn"
          [disabled]="!selectedFile"
          (click)="postPhotoStory()"
        >
          <i class="fas fa-paper-plane"></i> Post Status
        </button>
      </div>
    </div>

    <!-- ===================== STORY VIEWER OVERLAY ===================== -->
    <div class="viewer-overlay" *ngIf="showViewer && viewerStories.length > 0">
      <div class="progress-row">
        <div *ngFor="let s of viewerStories; let i = index" class="prog-track">
          <div
            class="prog-fill"
            [class.done]="i < viewerIdx"
            [class.active]="i === viewerIdx"
          ></div>
        </div>
      </div>
      <div class="viewer-hdr">
        <button class="icon-btn" (click)="closeViewer()">
          <i class="fas fa-arrow-left"></i>
        </button>
        <div class="vhdr-user">
          <div class="avatar">
            <img
              *ngIf="viewerUser?.profilePictureUrl"
              [src]="viewerUser!.profilePictureUrl"
            />
            <span *ngIf="!viewerUser?.profilePictureUrl">{{
              viewerUser?.fullName?.charAt(0)
            }}</span>
          </div>
          <div>
            <span class="vhdr-name">{{
              viewerUser?.fullName || 'Unknown'
            }}</span>
            <span class="vhdr-time">{{
              currentViewStory?.createdAt | date: 'shortTime'
            }}</span>
          </div>
        </div>
        <button
          *ngIf="isOwnStory"
          class="icon-btn danger"
          (click)="deleteViewing()"
        >
          <i class="fas fa-trash"></i>
        </button>
      </div>
      <div class="tap-left" (click)="prevViewerStory()"></div>
      <div class="tap-right" (click)="nextViewerStory()"></div>
      <div class="viewer-content">
        <img
          *ngIf="
            currentViewStory?.mediaUrl &&
            currentViewStory?.contentType === 'image'
          "
          [src]="currentViewStory!.mediaUrl"
          class="v-media"
        />
        <video
          *ngIf="
            currentViewStory?.mediaUrl &&
            currentViewStory?.contentType === 'video'
          "
          [src]="currentViewStory!.mediaUrl"
          autoplay
          muted
          (ended)="nextViewerStory()"
          class="v-media"
        ></video>
        <div
          *ngIf="currentViewStory?.contentType === 'text'"
          class="v-text-story"
          [style.background]="currentViewStory!.backgroundColor || '#128C7E'"
          [style.color]="currentViewStory!.textColor || '#fff'"
        >
          {{ currentViewStory!.textContent }}
        </div>
        <div *ngIf="currentViewStory?.caption" class="v-caption">
          {{ currentViewStory!.caption }}
        </div>
      </div>
      <div class="viewer-footer" *ngIf="isOwnStory">
        <button class="views-btn" (click)="showViewersList = !showViewersList">
          <i class="fas fa-eye"></i>
          {{ currentViewStory?.viewCount || 0 }} views
        </button>
      </div>
      <div class="viewer-footer reply-footer" *ngIf="!isOwnStory">
        <input
          type="text"
          [(ngModel)]="replyText"
          placeholder="Reply to status..."
          (keyup.enter)="sendReply()"
        />
        <button (click)="sendReply()">
          <i class="fas fa-paper-plane"></i>
        </button>
      </div>
      <div class="viewers-panel" *ngIf="showViewersList && isOwnStory">
        <div class="viewers-hdr">
          <span>Viewed by {{ storyViews.length }}</span>
          <button class="icon-btn" (click)="showViewersList = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div *ngFor="let v of storyViews" class="viewer-item">
          <div class="avatar sm">
            <img *ngIf="v.viewerPic" [src]="v.viewerPic" />
            <span *ngIf="!v.viewerPic">{{ v.viewerName?.charAt(0) }}</span>
          </div>
          <div>
            <span class="vname">{{ v.viewerName }}</span>
            <span class="vtime">{{ v.viewedAt | date: 'short' }}</span>
          </div>
        </div>
        <div *ngIf="storyViews.length === 0" class="no-views">No views yet</div>
      </div>
    </div>

    <!-- ===================== STATUS LIST (main area) =================== -->
    <div class="status-page">
      <div class="sp-header">Updates</div>
      <div class="my-status-section">
        <div class="my-status-card" (click)="onMyStatusClick()">
          <div class="ms-avatar" [class.has-story]="myStories.length > 0">
            <img
              *ngIf="currentUser?.profilePictureUrl"
              [src]="currentUser!.profilePictureUrl"
            />
            <span *ngIf="!currentUser?.profilePictureUrl">{{
              currentUser?.fullName?.charAt(0) || 'Me'
            }}</span>
            <div class="ms-add" *ngIf="myStories.length === 0">
              <i class="fas fa-plus"></i>
            </div>
          </div>
          <div class="ms-info">
            <span class="ms-name">My Status</span>
            <span class="ms-sub" *ngIf="myStories.length === 0"
              >Add to my status</span
            >
            <span class="ms-sub" *ngIf="myStories.length > 0">
              {{ myStories.length }} update{{
                myStories.length > 1 ? 's' : ''
              }}
              &middot; {{ myStories[0].createdAt | date: 'shortTime' }}
            </span>
          </div>
          <button
            class="add-story-btn"
            (click)="openCreator(); $event.stopPropagation()"
          >
            <i class="fas fa-camera"></i>
          </button>
        </div>
      </div>
      <div *ngIf="contactStories.length > 0">
        <div class="sp-section-header">Recent updates</div>
        <div
          *ngFor="let us of contactStories"
          class="status-item"
          (click)="openViewer(us)"
        >
          <div class="si-avatar" [class.unviewed]="us.hasUnviewed">
            <img *ngIf="us.profilePictureUrl" [src]="us.profilePictureUrl" />
            <span *ngIf="!us.profilePictureUrl">{{
              us.fullName?.charAt(0)
            }}</span>
          </div>
          <div class="si-info">
            <span class="si-name">{{ us.fullName }}</span>
            <span class="si-time">{{
              us.stories[0]?.createdAt | date: 'shortTime'
            }}</span>
          </div>
        </div>
      </div>
      <div *ngIf="contactStories.length === 0" class="no-updates">
        <i class="fas fa-circle-notch"></i>
        <p>No recent updates from contacts</p>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
        position: relative;
      }
      .status-page {
        height: 100%;
        overflow-y: auto;
        background: var(--bg-chat);
      }
      .sp-header {
        padding: 20px 24px 8px;
        font-size: 20px;
        font-weight: 700;
        color: var(--text-primary);
      }
      .sp-section-header {
        padding: 8px 24px 4px;
        font-size: 13px;
        font-weight: 600;
        color: var(--primary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .my-status-section {
        padding: 8px 0;
        border-bottom: 1px solid var(--border-color);
      }
      .my-status-card {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 12px 24px;
        cursor: pointer;
      }
      .my-status-card:hover {
        background: var(--hover);
      }
      .ms-avatar {
        width: 54px;
        height: 54px;
        border-radius: 50%;
        background: var(--primary);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 20px;
        font-weight: 700;
        overflow: hidden;
        position: relative;
        flex-shrink: 0;
        border: 2px solid transparent;
      }
      .ms-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .ms-avatar.has-story {
        border: 3px solid var(--primary);
      }
      .ms-add {
        position: absolute;
        bottom: -2px;
        right: -2px;
        width: 20px;
        height: 20px;
        background: var(--primary);
        border-radius: 50%;
        border: 2px solid var(--bg-sidebar);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .ms-add i {
        font-size: 9px;
        color: white;
      }
      .ms-info {
        flex: 1;
      }
      .ms-name {
        font-size: 15px;
        font-weight: 600;
        display: block;
        color: var(--text-primary);
      }
      .ms-sub {
        font-size: 13px;
        color: var(--text-secondary);
      }
      .add-story-btn {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: none;
        background: var(--hover);
        color: var(--primary);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
      }
      .add-story-btn:hover {
        background: var(--primary);
        color: white;
      }
      .status-item {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 11px 24px;
        cursor: pointer;
      }
      .status-item:hover {
        background: var(--hover);
      }
      .si-avatar {
        width: 54px;
        height: 54px;
        border-radius: 50%;
        background: var(--bg-input);
        overflow: hidden;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        color: white;
        font-weight: 700;
        border: 3px solid var(--border-color);
      }
      .si-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .si-avatar.unviewed {
        border-color: var(--primary);
      }
      .si-name {
        font-size: 15px;
        font-weight: 500;
        display: block;
        color: var(--text-primary);
      }
      .si-time {
        font-size: 12px;
        color: var(--text-secondary);
      }
      .no-updates {
        text-align: center;
        padding: 60px 20px;
        color: var(--text-secondary);
      }
      .no-updates i {
        font-size: 48px;
        margin-bottom: 12px;
        display: block;
      }
      /* CREATOR */
      .creator-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 2000;
        background: #111;
        display: flex;
        flex-direction: column;
      }
      .creator-header {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px 20px;
        background: rgba(0, 0, 0, 0.5);
      }
      .creator-header h3 {
        margin: 0;
        color: white;
        font-size: 18px;
      }
      .creator-tabs {
        display: flex;
        background: rgba(0, 0, 0, 0.5);
      }
      .creator-tabs button {
        flex: 1;
        padding: 14px;
        border: none;
        background: transparent;
        color: #aaa;
        font-size: 14px;
        cursor: pointer;
        border-bottom: 3px solid transparent;
      }
      .creator-tabs button.active {
        color: white;
        border-bottom-color: var(--primary);
      }
      .text-creator {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        position: relative;
        min-height: 0;
      }
      .text-overlay-input {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        padding: 40px;
      }
      .text-overlay-input textarea {
        background: transparent;
        border: none;
        outline: none;
        resize: none;
        font-size: 28px;
        font-weight: 500;
        text-align: center;
        width: 100%;
        max-width: 480px;
        min-height: 200px;
        line-height: 1.3;
      }
      .text-overlay-input textarea::placeholder {
        color: rgba(255, 255, 255, 0.5);
      }
      .text-controls {
        width: 100%;
        padding: 0 20px 8px;
        background: rgba(0, 0, 0, 0.6);
      }
      .color-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 0;
      }
      .color-row label {
        font-size: 12px;
        color: #aaa;
        min-width: 80px;
      }
      .color-swatches {
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
      }
      .swatch {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        cursor: pointer;
        border: 2px solid transparent;
        transition: 0.2s;
      }
      .swatch.selected {
        border-color: white;
        transform: scale(1.2);
      }
      .post-btn {
        margin: 12px 20px;
        padding: 14px 24px;
        background: var(--primary);
        color: white;
        border: none;
        border-radius: 25px;
        cursor: pointer;
        font-size: 15px;
        font-weight: 600;
        width: calc(100% - 40px);
      }
      .post-btn:disabled {
        opacity: 0.5;
      }
      .photo-creator {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 16px;
        padding: 20px;
      }
      .photo-drop {
        width: 100%;
        max-width: 360px;
        height: 300px;
        border: 2px dashed rgba(255, 255, 255, 0.3);
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: #aaa;
      }
      .photo-drop i {
        font-size: 48px;
        margin-bottom: 12px;
      }
      .photo-preview-box {
        position: relative;
      }
      .photo-preview-box img {
        max-width: 360px;
        max-height: 300px;
        border-radius: 12px;
      }
      .change-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        padding: 4px 10px;
        background: rgba(0, 0, 0, 0.6);
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
      }
      .caption-input {
        width: 100%;
        max-width: 360px;
        padding: 12px 16px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        color: white;
        font-size: 14px;
        outline: none;
      }
      /* VIEWER */
      .viewer-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 3000;
        background: #000;
        display: flex;
        flex-direction: column;
      }
      .progress-row {
        display: flex;
        gap: 3px;
        padding: 12px 16px 4px;
        z-index: 2;
      }
      .prog-track {
        flex: 1;
        height: 3px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 2px;
        overflow: hidden;
      }
      .prog-fill {
        height: 100%;
        background: white;
        width: 0%;
      }
      .prog-fill.done {
        width: 100%;
      }
      .prog-fill.active {
        animation: progAnim 5s linear forwards;
      }
      @keyframes progAnim {
        from {
          width: 0%;
        }
        to {
          width: 100%;
        }
      }
      .viewer-hdr {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 16px;
        background: linear-gradient(to bottom, rgba(0, 0, 0, 0.7), transparent);
        z-index: 2;
      }
      .vhdr-user {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .vhdr-name {
        color: white;
        font-weight: 600;
        display: block;
        font-size: 15px;
      }
      .vhdr-time {
        color: #bbb;
        font-size: 12px;
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
        font-weight: 700;
        font-size: 16px;
        overflow: hidden;
        flex-shrink: 0;
      }
      .avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .avatar.sm {
        width: 36px;
        height: 36px;
        font-size: 13px;
      }
      .icon-btn {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: none;
        background: transparent;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
      }
      .icon-btn:hover {
        background: rgba(255, 255, 255, 0.15);
      }
      .icon-btn.danger:hover {
        background: rgba(244, 67, 54, 0.3);
        color: #f44336;
      }
      .tap-left,
      .tap-right {
        position: absolute;
        top: 80px;
        bottom: 80px;
        width: 35%;
        z-index: 1;
        cursor: pointer;
      }
      .tap-left {
        left: 0;
      }
      .tap-right {
        right: 0;
      }
      .viewer-content {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
      }
      .v-media {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }
      .v-text-story {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
        font-weight: 600;
        padding: 40px;
        text-align: center;
        line-height: 1.4;
        word-wrap: break-word;
      }
      .v-caption {
        position: absolute;
        bottom: 60px;
        left: 0;
        right: 0;
        text-align: center;
        padding: 16px 24px;
        background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
        color: white;
        font-size: 16px;
      }
      .viewer-footer {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        gap: 10px;
        background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
      }
      .views-btn {
        background: rgba(255, 255, 255, 0.1);
        border: none;
        color: white;
        padding: 8px 20px;
        border-radius: 20px;
        cursor: pointer;
        font-size: 14px;
      }
      .reply-footer input {
        flex: 1;
        padding: 12px 16px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.25);
        border-radius: 24px;
        color: white;
        outline: none;
        font-size: 14px;
      }
      .reply-footer button {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        border: none;
        background: var(--primary);
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
      }
      .viewers-panel {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        max-height: 50%;
        background: var(--bg-sidebar);
        border-radius: 16px 16px 0 0;
        overflow-y: auto;
        z-index: 5;
      }
      .viewers-hdr {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        border-bottom: 1px solid var(--border-color);
      }
      .viewer-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 16px;
      }
      .vname {
        display: block;
        font-size: 14px;
        color: var(--text-primary);
      }
      .vtime {
        font-size: 12px;
        color: var(--text-secondary);
      }
      .no-views {
        text-align: center;
        padding: 20px;
        color: var(--text-secondary);
      }
    `,
  ],
})
export class StoryComponent implements OnInit, OnDestroy {
  @Input() stories: UserStories[] = [];
  @Input() currentUser: any = null;
  @Output() closed = new EventEmitter<void>();
  @Output() storyPosted = new EventEmitter<void>();

  // Creator state
  showCreator = false;
  creatorMode: 'text' | 'photo' = 'text';
  storyText = '';
  textBg = '#128C7E';
  textColor = '#ffffff';
  selectedFile: File | null = null;
  photoPreview: string | null = null;
  photoCaption = '';

  // Viewer state
  showViewer = false;
  viewerStories: Story[] = [];
  viewerUser: UserStories | null = null;
  viewerIdx = 0;
  showViewersList = false;
  storyViews: any[] = [];
  replyText = '';
  private viewerTimer: any;

  bgColors = [
    '#128C7E',
    '#25D366',
    '#34B7F1',
    '#1DA1F2',
    '#E91E63',
    '#9C27B0',
    '#FF5722',
    '#607D8B',
    '#000000',
    '#FAFAFA',
  ];
  textColors = [
    '#ffffff',
    '#000000',
    '#FFD700',
    '#FF6B6B',
    '#4CAF50',
    '#2196F3',
  ];

  get myStories(): Story[] {
    return (
      this.stories.find((s) => s.userId === this.currentUser?.id)?.stories || []
    );
  }
  get contactStories(): UserStories[] {
    return this.stories.filter((s) => s.userId !== this.currentUser?.id);
  }
  get currentViewStory(): Story | null {
    return this.viewerStories[this.viewerIdx] || null;
  }
  get isOwnStory(): boolean {
    return this.viewerUser?.userId === this.currentUser?.id;
  }

  constructor(
    private storyService: StoryService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {}
  ngOnDestroy(): void {
    clearTimeout(this.viewerTimer);
  }

  onMyStatusClick(): void {
    const mine = this.stories.find((s) => s.userId === this.currentUser?.id);
    if (mine && mine.stories.length > 0) {
      this.openViewer(mine);
    } else {
      this.openCreator();
    }
  }

  openCreator(): void {
    this.showCreator = true;
    this.storyText = '';
    this.photoPreview = null;
    this.selectedFile = null;
    this.photoCaption = '';
  }
  closeCreator(): void {
    this.showCreator = false;
  }

  onPhotoSelected(event: any): void {
    const file = event.target.files[0] as File;
    if (!file) return;
    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.photoPreview = e.target.result;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  postTextStory(): void {
    if (!this.storyText.trim()) return;
    const dto = {
      contentType: 'text',
      textContent: this.storyText.trim(),
      backgroundColor: this.textBg,
      textColor: this.textColor,
    };
    this.storyService.createStory(dto).subscribe(() => {
      this.closeCreator();
      this.storyPosted.emit();
    });
  }

  postPhotoStory(): void {
    if (!this.selectedFile) return;
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append(
      'contentType',
      this.selectedFile.type.startsWith('video') ? 'video' : 'image',
    );
    if (this.photoCaption) formData.append('caption', this.photoCaption);
    this.storyService.createStoryWithMedia(formData).subscribe(() => {
      this.closeCreator();
      this.storyPosted.emit();
    });
  }

  openViewer(userStory: UserStories): void {
    this.viewerUser = userStory;
    this.viewerStories = userStory.stories;
    this.viewerIdx = 0;
    this.showViewer = true;
    this.showViewersList = false;
    this.storyViews = [];
    this.startViewerTimer();
    this.markViewed();
  }

  closeViewer(): void {
    clearTimeout(this.viewerTimer);
    this.showViewer = false;
    this.viewerStories = [];
    this.viewerIdx = 0;
  }

  nextViewerStory(): void {
    clearTimeout(this.viewerTimer);
    if (this.viewerIdx < this.viewerStories.length - 1) {
      this.viewerIdx++;
      this.markViewed();
      this.startViewerTimer();
    } else {
      this.closeViewer();
    }
  }

  prevViewerStory(): void {
    clearTimeout(this.viewerTimer);
    if (this.viewerIdx > 0) {
      this.viewerIdx--;
      this.startViewerTimer();
    }
  }

  deleteViewing(): void {
    const s = this.currentViewStory;
    if (!s) return;
    this.storyService.deleteStory(s.id).subscribe(() => {
      this.viewerStories = this.viewerStories.filter((x) => x.id !== s.id);
      if (this.viewerStories.length === 0) {
        this.closeViewer();
        this.storyPosted.emit();
        return;
      }
      if (this.viewerIdx >= this.viewerStories.length)
        this.viewerIdx = this.viewerStories.length - 1;
      this.storyPosted.emit();
    });
  }

  sendReply(): void {
    this.replyText = '';
  }

  private startViewerTimer(): void {
    clearTimeout(this.viewerTimer);
    const dur =
      (this.currentViewStory?.contentType === 'video' ? 15 : 5) * 1000;
    this.viewerTimer = setTimeout(() => this.nextViewerStory(), dur);
  }

  private markViewed(): void {
    const s = this.currentViewStory;
    if (!s) return;
    if (!this.isOwnStory) {
      this.storyService.viewStory(s.id).subscribe();
    } else {
      this.storyService.getStoryViews(s.id).subscribe((views: any[]) => {
        this.storyViews = views;
      });
    }
  }
}
