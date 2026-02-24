import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
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
          <p>Create your account to get started</p>
        </div>
        <form (ngSubmit)="register()">
          <div class="input-group">
            <label>Full Name</label>
            <input
              type="text"
              [(ngModel)]="form.fullName"
              name="fullName"
              placeholder="Enter your full name"
              required
            />
          </div>
          <div class="input-group">
            <label>Username</label>
            <input
              type="text"
              [(ngModel)]="form.username"
              name="username"
              placeholder="Choose a username"
              required
            />
          </div>
          <div class="input-group">
            <label>Email</label>
            <input
              type="email"
              [(ngModel)]="form.email"
              name="email"
              placeholder="Enter your email"
              required
            />
          </div>
          <div class="input-group">
            <label>Phone Number</label>
            <input
              type="tel"
              [(ngModel)]="form.phoneNumber"
              name="phone"
              placeholder="Enter phone number"
            />
          </div>
          <div class="input-group">
            <label>Password</label>
            <input
              [type]="showPassword ? 'text' : 'password'"
              [(ngModel)]="form.password"
              name="password"
              placeholder="Create a password (min 6 chars)"
              required
              minlength="6"
            />
          </div>
          <div class="error" *ngIf="error">{{ error }}</div>
          <button
            type="submit"
            class="btn btn-primary btn-full"
            [disabled]="loading"
          >
            {{ loading ? 'Creating account...' : 'Create Account' }}
          </button>
        </form>
        <div class="auth-footer">
          <p>Already have an account? <a routerLink="/login">Sign In</a></p>
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
        max-height: 90vh;
        overflow-y: auto;
      }
      .auth-header {
        text-align: center;
        margin-bottom: 24px;
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
          margin-bottom: 8px;
        }
        p {
          color: var(--text-secondary);
          font-size: 14px;
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
    `,
  ],
})
export class RegisterComponent {
  form = {
    fullName: '',
    username: '',
    email: '',
    password: '',
    phoneNumber: '',
  };
  showPassword = false;
  loading = false;
  error = '';

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  register(): void {
    this.loading = true;
    this.error = '';
    this.authService.register(this.form).subscribe({
      next: () => this.router.navigate(['/chat']),
      error: (err) => {
        this.error = err.error?.message || 'Registration failed';
        this.loading = false;
      },
    });
  }
}
