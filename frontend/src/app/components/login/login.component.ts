import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-bg">
        <div class="bg-pattern"></div>
      </div>
      <div class="auth-card">
        <div class="auth-header">
          <div class="logo">
            <i class="fas fa-comments"></i>
          </div>
          <h1>ConnectUS</h1>
          <p>Sign in to continue to your account</p>
        </div>
        <form (ngSubmit)="login()">
          <div class="input-group">
            <label>Email or Username</label>
            <input
              type="text"
              [(ngModel)]="credentials.emailOrUsername"
              name="email"
              placeholder="Enter your email or username"
              required
            />
          </div>
          <div class="input-group">
            <label>Password</label>
            <input
              [type]="showPassword ? 'text' : 'password'"
              [(ngModel)]="credentials.password"
              name="password"
              placeholder="Enter your password"
              required
            />
            <button
              type="button"
              class="toggle-pw"
              (click)="showPassword = !showPassword"
            >
              <i [class]="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
            </button>
          </div>
          <div class="error" *ngIf="error">{{ error }}</div>
          <button
            type="submit"
            class="btn btn-primary btn-full"
            [disabled]="loading"
          >
            <span *ngIf="loading" class="spinner"></span>
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>
        <div class="auth-footer">
          <p>Don't have an account? <a routerLink="/register">Sign Up</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .auth-container {
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
      }
      .auth-bg {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 220px;
        background: linear-gradient(
          135deg,
          var(--primary-dark),
          var(--primary)
        );
      }
      .bg-pattern {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        opacity: 0.1;
        background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/svg%3E");
      }
      .auth-card {
        background: var(--bg-sidebar);
        border-radius: 12px;
        padding: 40px;
        width: 420px;
        z-index: 1;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      }
      .auth-header {
        text-align: center;
        margin-bottom: 32px;
        .logo {
          width: 64px;
          height: 64px;
          background: var(--primary);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          i {
            font-size: 28px;
            color: white;
          }
        }
        h1 {
          font-size: 24px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 8px;
        }
        p {
          color: var(--text-secondary);
          font-size: 14px;
        }
      }
      .input-group {
        position: relative;
        .toggle-pw {
          position: absolute;
          right: 12px;
          top: 38px;
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
        }
      }
      .btn-full {
        width: 100%;
        justify-content: center;
        padding: 14px;
        font-size: 15px;
      }
      .error {
        color: var(--danger);
        font-size: 13px;
        margin-bottom: 12px;
        text-align: center;
      }
      .auth-footer {
        text-align: center;
        margin-top: 20px;
        p {
          color: var(--text-secondary);
          font-size: 14px;
        }
        a {
          color: var(--primary);
          text-decoration: none;
          font-weight: 500;
        }
      }
      .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid transparent;
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class LoginComponent {
  credentials = { emailOrUsername: '', password: '' };
  showPassword = false;
  loading = false;
  error = '';

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {
    if (authService.isLoggedIn()) {
      router.navigate(['/chat']);
    }
  }

  login(): void {
    this.loading = true;
    this.error = '';
    this.authService.login(this.credentials).subscribe({
      next: () => {
        this.router.navigate(['/chat']);
      },
      error: (err) => {
        this.error = err.error?.message || 'Invalid credentials';
        this.loading = false;
      },
    });
  }
}
