import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="profile-panel">
      <div class="profile-header">
        <button class="icon-btn" (click)="closed.emit()">
          <i class="fas fa-arrow-left"></i>
        </button>
        <h3>Profile</h3>
      </div>

      <div class="profile-content">
        <!-- Profile picture -->
        <div class="profile-pic-section">
          <div class="profile-pic" (click)="picInput.click()">
            <img *ngIf="profilePicture" [src]="profilePicture" />
            <span *ngIf="!profilePicture" class="pic-placeholder">
              <i class="fas fa-user"></i>
            </span>
            <div class="pic-overlay">
              <i class="fas fa-camera"></i>
            </div>
          </div>
          <input
            #picInput
            type="file"
            style="display:none"
            accept="image/*"
            (change)="onPicSelected($event)"
          />
        </div>

        <!-- Editable fields -->
        <div class="profile-field">
          <label><i class="fas fa-user"></i> Full Name</label>
          <div class="field-edit" *ngIf="!editing.fullName">
            <span>{{ fullName }}</span>
            <button class="edit-btn" (click)="editing.fullName = true">
              <i class="fas fa-pen"></i>
            </button>
          </div>
          <div class="field-input" *ngIf="editing.fullName">
            <input [(ngModel)]="fullName" maxlength="50" />
            <button
              class="save-btn"
              (click)="saveProfile(); editing.fullName = false"
            >
              <i class="fas fa-check"></i>
            </button>
          </div>
        </div>

        <div class="profile-field">
          <label><i class="fas fa-info-circle"></i> About</label>
          <div class="field-edit" *ngIf="!editing.about">
            <span>{{ about || 'Hey there! I am using ConnectUS' }}</span>
            <button class="edit-btn" (click)="editing.about = true">
              <i class="fas fa-pen"></i>
            </button>
          </div>
          <div class="field-input" *ngIf="editing.about">
            <input [(ngModel)]="about" maxlength="140" />
            <button
              class="save-btn"
              (click)="saveProfile(); editing.about = false"
            >
              <i class="fas fa-check"></i>
            </button>
          </div>
        </div>

        <div class="profile-field">
          <label><i class="fas fa-phone"></i> Phone</label>
          <div class="field-edit" *ngIf="!editing.phone">
            <span>{{ phone || 'Not set' }}</span>
            <button class="edit-btn" (click)="editing.phone = true">
              <i class="fas fa-pen"></i>
            </button>
          </div>
          <div class="field-input" *ngIf="editing.phone">
            <input [(ngModel)]="phone" maxlength="15" />
            <button
              class="save-btn"
              (click)="saveProfile(); editing.phone = false"
            >
              <i class="fas fa-check"></i>
            </button>
          </div>
        </div>

        <div class="profile-field">
          <label><i class="fas fa-envelope"></i> Email</label>
          <div class="field-edit">
            <span>{{ email }}</span>
          </div>
        </div>

        <div class="profile-field">
          <label><i class="fas fa-at"></i> Username</label>
          <div class="field-edit">
            <span>{{ username }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .profile-panel {
        height: 100vh;
        background: var(--bg-primary);
        display: flex;
        flex-direction: column;
      }
      .profile-header {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px 20px;
        background: var(--bg-sidebar);
        border-bottom: 1px solid var(--border-color);
        h3 {
          margin: 0;
          font-size: 18px;
        }
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
      .profile-content {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
      }
      .profile-pic-section {
        display: flex;
        justify-content: center;
        margin-bottom: 30px;
      }
      .profile-pic {
        width: 200px;
        height: 200px;
        border-radius: 50%;
        overflow: hidden;
        position: relative;
        cursor: pointer;
        background: var(--bg-input);
        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .pic-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 64px;
          color: var(--text-secondary);
        }
        .pic-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(0, 0, 0, 0.5);
          padding: 12px;
          text-align: center;
          color: white;
          opacity: 0;
          transition: opacity 0.2s;
        }
        &:hover .pic-overlay {
          opacity: 1;
        }
      }
      .profile-field {
        padding: 16px 0;
        border-bottom: 1px solid var(--border-color);
        label {
          font-size: 13px;
          color: var(--primary);
          font-weight: 500;
          display: block;
          margin-bottom: 6px;
          i {
            margin-right: 6px;
          }
        }
      }
      .field-edit {
        display: flex;
        align-items: center;
        justify-content: space-between;
        span {
          font-size: 15px;
        }
      }
      .edit-btn {
        border: none;
        background: transparent;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 6px;
        &:hover {
          color: var(--primary);
        }
      }
      .field-input {
        display: flex;
        gap: 8px;
        input {
          flex: 1;
          padding: 8px 0;
          background: transparent;
          border: none;
          border-bottom: 2px solid var(--primary);
          color: var(--text-primary);
          font-size: 15px;
          outline: none;
        }
      }
      .save-btn {
        border: none;
        background: transparent;
        color: var(--primary);
        cursor: pointer;
        font-size: 18px;
        &:hover {
          color: var(--primary-light);
        }
      }
    `,
  ],
})
export class ProfileComponent implements OnInit {
  @Input() userId = 0;
  @Output() closed = new EventEmitter<void>();
  @Output() profileUpdated = new EventEmitter<void>();

  fullName = '';
  about = '';
  phone = '';
  email = '';
  username = '';
  profilePicture = '';
  editing: any = { fullName: false, about: false, phone: false };

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.userService.getProfile().subscribe((user) => {
      this.fullName = user.fullName;
      this.about = user.about || '';
      this.phone = user.phoneNumber || '';
      this.email = user.email;
      this.username = user.username;
      this.profilePicture = user.profilePictureUrl || '';
    });
  }

  saveProfile(): void {
    this.userService
      .updateProfile({
        fullName: this.fullName,
        about: this.about,
        phoneNumber: this.phone,
      })
      .subscribe(() => {
        this.profileUpdated.emit();
      });
  }

  onPicSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.userService.uploadProfilePicture(file).subscribe((res) => {
        this.profilePicture = res.url;
        this.profileUpdated.emit();
      });
    }
  }
}
