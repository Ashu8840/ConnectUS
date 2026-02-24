import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-panel">
      <div class="settings-header">
        <button class="icon-btn" (click)="closed.emit()">
          <i class="fas fa-arrow-left"></i>
        </button>
        <h3>Settings</h3>
      </div>

      <div class="settings-content">
        <!-- Profile quick access -->
        <div class="settings-item" (click)="openProfile.emit()">
          <i class="fas fa-user-circle"></i>
          <div class="item-info">
            <span class="item-title">Profile</span>
            <span class="item-desc">Edit your name, about and picture</span>
          </div>
          <i class="fas fa-chevron-right"></i>
        </div>

        <!-- Notifications -->
        <div class="settings-section">
          <h4>Notifications</h4>
          <div class="settings-toggle">
            <span>Message notifications</span>
            <label class="switch">
              <input
                type="checkbox"
                [(ngModel)]="settings.messageNotifications"
              />
              <span class="slider"></span>
            </label>
          </div>
          <div class="settings-toggle">
            <span>Call notifications</span>
            <label class="switch">
              <input type="checkbox" [(ngModel)]="settings.callNotifications" />
              <span class="slider"></span>
            </label>
          </div>
          <div class="settings-toggle">
            <span>Sound</span>
            <label class="switch">
              <input type="checkbox" [(ngModel)]="settings.sound" />
              <span class="slider"></span>
            </label>
          </div>
        </div>

        <!-- Privacy -->
        <div class="settings-section">
          <h4>Privacy</h4>
          <div class="settings-toggle">
            <span>Show online status</span>
            <label class="switch">
              <input type="checkbox" [(ngModel)]="settings.showOnline" />
              <span class="slider"></span>
            </label>
          </div>
          <div class="settings-toggle">
            <span>Read receipts</span>
            <label class="switch">
              <input type="checkbox" [(ngModel)]="settings.readReceipts" />
              <span class="slider"></span>
            </label>
          </div>
        </div>

        <!-- Appearance -->
        <div class="settings-section">
          <h4>Appearance</h4>
          <div class="settings-select">
            <span>Font size</span>
            <select [(ngModel)]="settings.fontSize">
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
          <div class="settings-select">
            <span>Chat wallpaper</span>
            <select [(ngModel)]="settings.wallpaper">
              <option value="default">Default</option>
              <option value="dark">Dark</option>
              <option value="solid">Solid Color</option>
            </select>
          </div>
        </div>

        <!-- Storage -->
        <div class="settings-section">
          <h4>Storage & Data</h4>
          <div class="settings-toggle">
            <span>Auto-download images</span>
            <label class="switch">
              <input
                type="checkbox"
                [(ngModel)]="settings.autoDownloadImages"
              />
              <span class="slider"></span>
            </label>
          </div>
          <div class="settings-toggle">
            <span>Auto-download videos</span>
            <label class="switch">
              <input
                type="checkbox"
                [(ngModel)]="settings.autoDownloadVideos"
              />
              <span class="slider"></span>
            </label>
          </div>
        </div>

        <!-- Account -->
        <div class="settings-section">
          <h4>Account</h4>
          <!-- Change password -->
          <div
            class="settings-item"
            (click)="showPasswordForm = !showPasswordForm"
          >
            <i class="fas fa-lock"></i>
            <div class="item-info">
              <span class="item-title">Change Password</span>
              <span class="item-desc">Update your account password</span>
            </div>
            <i
              class="fas"
              [class.fa-chevron-down]="showPasswordForm"
              [class.fa-chevron-right]="!showPasswordForm"
            ></i>
          </div>
          <div class="password-form" *ngIf="showPasswordForm">
            <input
              type="password"
              [(ngModel)]="pwdForm.current"
              placeholder="Current password"
            />
            <input
              type="password"
              [(ngModel)]="pwdForm.newPwd"
              placeholder="New password"
            />
            <input
              type="password"
              [(ngModel)]="pwdForm.confirm"
              placeholder="Confirm new password"
            />
            <div class="pwd-error" *ngIf="pwdError">{{ pwdError }}</div>
            <div class="pwd-success" *ngIf="pwdSuccess">{{ pwdSuccess }}</div>
            <button
              class="save-btn"
              (click)="changePassword()"
              [disabled]="changingPwd"
            >
              {{ changingPwd ? 'Updating...' : 'Update Password' }}
            </button>
          </div>
          <!-- Save settings -->
          <div class="settings-item" (click)="saveSettings()">
            <i class="fas fa-save"></i>
            <div class="item-info">
              <span class="item-title">Save Settings</span>
              <span class="item-desc" *ngIf="!savedMsg"
                >Save your current preferences</span
              >
              <span class="item-desc saved-msg" *ngIf="savedMsg">{{
                savedMsg
              }}</span>
            </div>
          </div>
          <div class="settings-item danger" (click)="logout()">
            <i class="fas fa-sign-out-alt"></i>
            <span>Log out</span>
          </div>
        </div>

        <div class="app-info">
          <p>ConnectUS v1.0.0</p>
          <p class="copyright">Made with <i class="fas fa-heart"></i></p>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .settings-panel {
        height: 100vh;
        background: var(--bg-primary);
        display: flex;
        flex-direction: column;
      }
      .settings-header {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px 20px;
        background: var(--bg-sidebar);
        border-bottom: 1px solid var(--border-color);
        h3 {
          margin: 0;
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
      .settings-content {
        flex: 1;
        overflow-y: auto;
      }
      .settings-item {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px 20px;
        cursor: pointer;
        &:hover {
          background: var(--hover);
        }
        i:first-child {
          font-size: 20px;
          color: var(--text-secondary);
          width: 28px;
          text-align: center;
        }
        .item-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          .item-title {
            font-size: 15px;
          }
          .item-desc {
            font-size: 13px;
            color: var(--text-secondary);
          }
          .saved-msg {
            color: var(--primary) !important;
          }
        }
        .fa-chevron-right,
        .fa-chevron-down {
          font-size: 12px;
          color: var(--text-secondary);
        }
        &.danger {
          color: #f44336;
          i,
          span {
            color: #f44336;
          }
        }
      }
      .settings-section {
        padding: 8px 0;
        border-top: 1px solid var(--border-color);
        h4 {
          padding: 8px 20px;
          margin: 0;
          font-size: 14px;
          color: var(--primary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      }
      .settings-toggle {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 20px;
        span {
          font-size: 14px;
        }
      }
      .switch {
        position: relative;
        width: 44px;
        height: 24px;
        input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: #555;
          border-radius: 24px;
          cursor: pointer;
          transition: 0.3s;
          &:before {
            content: '';
            position: absolute;
            height: 18px;
            width: 18px;
            left: 3px;
            bottom: 3px;
            background: white;
            border-radius: 50%;
            transition: 0.3s;
          }
        }
        input:checked + .slider {
          background: var(--primary);
        }
        input:checked + .slider:before {
          transform: translateX(20px);
        }
      }
      .settings-select {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 20px;
        span {
          font-size: 14px;
        }
        select {
          padding: 6px 12px;
          background: var(--bg-input);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          color: var(--text-primary);
          outline: none;
        }
      }
      .password-form {
        padding: 8px 20px 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        input {
          padding: 10px 14px;
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
        .save-btn {
          padding: 10px;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          &:disabled {
            opacity: 0.6;
          }
        }
        .pwd-error {
          color: #f44336;
          font-size: 13px;
        }
        .pwd-success {
          color: #4caf50;
          font-size: 13px;
        }
      }
      .app-info {
        text-align: center;
        padding: 30px 20px;
        color: var(--text-secondary);
        font-size: 13px;
        p {
          margin: 4px 0;
        }
        .copyright i {
          color: #f44336;
          font-size: 11px;
        }
      }
    `,
  ],
})
export class SettingsComponent implements OnInit {
  @Output() closed = new EventEmitter<void>();
  @Output() openProfile = new EventEmitter<void>();

  settings: any = {
    messageNotifications: true,
    callNotifications: true,
    sound: true,
    showOnline: true,
    readReceipts: true,
    fontSize: 'medium',
    wallpaper: 'default',
    autoDownloadImages: true,
    autoDownloadVideos: false,
  };

  showPasswordForm = false;
  pwdForm = { current: '', newPwd: '', confirm: '' };
  pwdError = '';
  pwdSuccess = '';
  changingPwd = false;
  savedMsg = '';

  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  ngOnInit(): void {
    const saved = localStorage.getItem('connectus_settings');
    if (saved) {
      try {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      } catch {}
    }
    this.applySettings();
  }

  saveSettings(): void {
    localStorage.setItem('connectus_settings', JSON.stringify(this.settings));
    this.applySettings();
    this.savedMsg = 'Settings saved!';
    setTimeout(() => (this.savedMsg = ''), 3000);
  }

  applySettings(): void {
    const root = document.documentElement;
    const sizes: any = { small: '13px', medium: '15px', large: '17px' };
    root.style.setProperty(
      '--font-size-base',
      sizes[this.settings.fontSize] || '15px',
    );
  }

  changePassword(): void {
    this.pwdError = '';
    this.pwdSuccess = '';
    if (
      !this.pwdForm.current ||
      !this.pwdForm.newPwd ||
      !this.pwdForm.confirm
    ) {
      this.pwdError = 'All fields are required';
      return;
    }
    if (this.pwdForm.newPwd !== this.pwdForm.confirm) {
      this.pwdError = 'New passwords do not match';
      return;
    }
    if (this.pwdForm.newPwd.length < 6) {
      this.pwdError = 'Password must be at least 6 characters';
      return;
    }
    this.changingPwd = true;
    this.userService
      .changePassword({
        currentPassword: this.pwdForm.current,
        newPassword: this.pwdForm.newPwd,
      })
      .subscribe({
        next: () => {
          this.pwdSuccess = 'Password updated successfully!';
          this.pwdForm = { current: '', newPwd: '', confirm: '' };
          this.changingPwd = false;
        },
        error: (err) => {
          this.pwdError = err?.error?.message || 'Failed to change password';
          this.changingPwd = false;
        },
      });
  }

  logout(): void {
    this.authService.logout();
  }
}
