import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CallLog } from '../../models/models';

@Component({
  selector: 'app-call',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Call history view (when not in active call) -->
    <div class="call-view" *ngIf="!activeCall">
      <div class="call-header">
        <h3>Calls</h3>
      </div>
      <div class="call-history">
        <div *ngFor="let call of callHistory" class="call-item">
          <div class="avatar">
            <img
              *ngIf="currentUserId === call.callerId && call.receiverPic"
              [src]="call.receiverPic"
              style="width:100%;height:100%;object-fit:cover;border-radius:50%"
            />
            <img
              *ngIf="currentUserId !== call.callerId && call.callerPic"
              [src]="call.callerPic"
              style="width:100%;height:100%;object-fit:cover;border-radius:50%"
            />
            <span
              *ngIf="
                !(currentUserId === call.callerId
                  ? call.receiverPic
                  : call.callerPic)
              "
            >
              {{
                (currentUserId === call.callerId
                  ? call.receiverName
                  : call.callerName
                )?.charAt(0)
              }}
            </span>
          </div>
          <div class="call-details">
            <span class="caller-name">{{
              currentUserId === call.callerId
                ? call.receiverName
                : call.callerName
            }}</span>
            <div class="call-meta">
              <i
                class="fas"
                [ngClass]="{
                  'fa-phone-alt text-success': call.status === 'answered',
                  'fa-phone-slash text-danger':
                    call.status === 'missed' || call.status === 'rejected',
                  'fa-arrow-up text-success':
                    call.status === 'answered' &&
                    call.callerId === currentUserId,
                  'fa-arrow-down text-success':
                    call.status === 'answered' &&
                    call.callerId !== currentUserId,
                }"
              ></i>
              <span class="call-time">{{
                call.startedAt | date: 'short'
              }}</span>
              <span class="call-duration" *ngIf="call.durationSeconds">
                · {{ formatDuration(call.durationSeconds) }}</span
              >
            </div>
          </div>
          <div class="call-action-btns">
            <button
              class="icon-btn"
              (click)="initiateCall(call, 'voice')"
              title="Voice call"
            >
              <i class="fas fa-phone"></i>
            </button>
            <button
              class="icon-btn"
              (click)="initiateCall(call, 'video')"
              title="Video call"
            >
              <i class="fas fa-video"></i>
            </button>
          </div>
        </div>
        <div class="empty-calls" *ngIf="callHistory.length === 0">
          <i class="fas fa-phone-alt"></i>
          <p>No recent calls</p>
        </div>
      </div>
    </div>

    <!-- Active call UI -->
    <div class="active-call-overlay" *ngIf="activeCall">
      <div class="call-screen">
        <!-- Remote video -->
        <video
          #remoteVideo
          class="remote-video"
          autoplay
          playsinline
          [class.hidden]="!remoteStreamActive"
        ></video>

        <div class="call-info-overlay" *ngIf="!remoteStreamActive">
          <div class="caller-avatar lg">
            <span>{{ activeCall.callerName?.charAt(0) || '?' }}</span>
          </div>
          <h2>{{ activeCall.callerName || 'Calling...' }}</h2>
          <p class="call-status-text">{{ callStatusText }}</p>
        </div>

        <!-- Local video (picture-in-picture) -->
        <video
          #localVideo
          class="local-video"
          autoplay
          playsinline
          muted
          *ngIf="activeCall.callType === 'video'"
        ></video>

        <!-- Call controls -->
        <div class="call-controls">
          <button
            class="control-btn"
            [class.active]="isMuted"
            (click)="toggleMute()"
          >
            <i
              class="fas"
              [ngClass]="isMuted ? 'fa-microphone-slash' : 'fa-microphone'"
            ></i>
          </button>
          <button
            class="control-btn"
            *ngIf="activeCall.callType === 'video'"
            [class.active]="isCameraOff"
            (click)="toggleCamera()"
          >
            <i
              class="fas"
              [ngClass]="isCameraOff ? 'fa-video-slash' : 'fa-video'"
            ></i>
          </button>
          <button class="control-btn end-call" (click)="endActiveCall()">
            <i class="fas fa-phone-slash"></i>
          </button>
          <button
            class="control-btn"
            [class.active]="isSpeakerOn"
            (click)="isSpeakerOn = !isSpeakerOn"
          >
            <i class="fas fa-volume-up"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Incoming call -->
    <div class="incoming-call-overlay" *ngIf="incomingCall">
      <div class="incoming-call-card">
        <div class="caller-avatar lg">
          <span>{{ incomingCall.callerName?.charAt(0) || '?' }}</span>
        </div>
        <h2>{{ incomingCall.callerName }}</h2>
        <p>Incoming {{ incomingCall.callType }} call</p>
        <div class="incoming-actions">
          <button class="reject-btn" (click)="rejectIncoming()">
            <i class="fas fa-phone-slash"></i>
          </button>
          <button class="accept-btn" (click)="acceptIncoming()">
            <i class="fas fa-phone"></i>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .call-view {
        height: 100vh;
        display: flex;
        flex-direction: column;
        background: var(--bg-chat);
      }
      .call-header {
        padding: 16px 20px;
        background: var(--bg-sidebar);
        border-bottom: 1px solid var(--border-color);
        h3 {
          margin: 0;
          font-size: 18px;
        }
      }
      .call-history {
        flex: 1;
        overflow-y: auto;
      }
      .call-item {
        display: flex;
        align-items: center;
        padding: 12px 20px;
        gap: 14px;
        cursor: pointer;
        &:hover {
          background: var(--hover);
        }
      }
      .avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: var(--primary);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 600;
        font-size: 18px;
      }
      .caller-avatar.lg {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        background: var(--primary);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 40px;
        font-weight: 600;
        margin-bottom: 16px;
      }
      .call-details {
        flex: 1;
        .caller-name {
          font-weight: 500;
          font-size: 15px;
          display: block;
        }
        .call-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--text-secondary);
          margin-top: 2px;
          i {
            font-size: 12px;
          }
        }
      }
      .text-success {
        color: #4caf50 !important;
      }
      .text-danger {
        color: #f44336 !important;
      }
      .call-action-btns {
        display: flex;
        gap: 4px;
      }
      .icon-btn {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: none;
        background: transparent;
        color: var(--primary);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        &:hover {
          background: var(--hover);
        }
      }
      .empty-calls {
        text-align: center;
        padding: 60px 20px;
        color: var(--text-secondary);
        i {
          font-size: 48px;
          margin-bottom: 16px;
        }
      }

      /* Active call */
      .active-call-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 2000;
        background: #1a1a2e;
      }
      .call-screen {
        width: 100%;
        height: 100%;
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      .remote-video {
        width: 100%;
        height: 100%;
        object-fit: cover;
        &.hidden {
          display: none;
        }
      }
      .call-info-overlay {
        display: flex;
        flex-direction: column;
        align-items: center;
        color: white;
        h2 {
          margin: 8px 0 4px;
        }
        .call-status-text {
          color: #aaa;
          font-size: 14px;
        }
      }
      .local-video {
        position: absolute;
        top: 20px;
        right: 20px;
        width: 160px;
        height: 120px;
        border-radius: 12px;
        object-fit: cover;
        border: 2px solid rgba(255, 255, 255, 0.3);
      }
      .call-controls {
        position: absolute;
        bottom: 40px;
        display: flex;
        gap: 20px;
      }
      .control-btn {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        border: none;
        background: rgba(255, 255, 255, 0.15);
        color: white;
        cursor: pointer;
        font-size: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
        &:hover {
          background: rgba(255, 255, 255, 0.25);
        }
        &.active {
          background: rgba(255, 255, 255, 0.3);
        }
        &.end-call {
          background: #f44336;
          &:hover {
            background: #d32f2f;
          }
        }
      }

      /* Incoming call */
      .incoming-call-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 3000;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .incoming-call-card {
        text-align: center;
        color: white;
        h2 {
          margin: 0 0 4px;
        }
        p {
          color: #aaa;
          margin: 0 0 30px;
        }
      }
      .incoming-actions {
        display: flex;
        gap: 40px;
        justify-content: center;
      }
      .reject-btn,
      .accept-btn {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .reject-btn {
        background: #f44336;
      }
      .accept-btn {
        background: #4caf50;
      }
    `,
  ],
})
export class CallComponent {
  @Input() callHistory: CallLog[] = [];
  @Input() currentUserId = 0;
  @Input() activeCall: any = null;
  @Input() incomingCall: any = null;
  @Input() remoteStreamActive = false;
  @Input() callStatusText = 'Calling...';

  @Output() callInitiated = new EventEmitter<any>();
  @Output() callEnded = new EventEmitter<void>();
  @Output() callAccepted = new EventEmitter<any>();
  @Output() callRejected = new EventEmitter<any>();

  isMuted = false;
  isCameraOff = false;
  isSpeakerOn = true;

  initiateCall(call: CallLog, type: string): void {
    const isOutgoing = call.callerId === this.currentUserId;
    this.callInitiated.emit({
      receiverId: isOutgoing ? call.receiverId : call.callerId,
      receiverName: isOutgoing ? call.receiverName : call.callerName,
      receiverPic: isOutgoing ? call.receiverPic : call.callerPic,
      callType: type,
    });
  }

  endActiveCall(): void {
    this.callEnded.emit();
  }

  acceptIncoming(): void {
    this.callAccepted.emit(this.incomingCall);
  }

  rejectIncoming(): void {
    this.callRejected.emit(this.incomingCall);
  }

  toggleMute(): void {
    this.isMuted = !this.isMuted;
  }

  toggleCamera(): void {
    this.isCameraOff = !this.isCameraOff;
  }

  formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
