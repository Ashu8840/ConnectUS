import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="admin-container">
      <!-- Sidebar -->
      <div class="admin-sidebar">
        <div class="admin-brand">
          <i class="fas fa-shield-alt"></i>
          <span>ConnectUS Admin</span>
        </div>
        <nav class="admin-nav">
          <a
            (click)="activeTab = 'dashboard'"
            [class.active]="activeTab === 'dashboard'"
          >
            <i class="fas fa-tachometer-alt"></i> Dashboard
          </a>
          <a
            (click)="activeTab = 'users'"
            [class.active]="activeTab === 'users'"
          >
            <i class="fas fa-users"></i> Users
          </a>
          <a
            (click)="activeTab = 'groups'"
            [class.active]="activeTab === 'groups'"
          >
            <i class="fas fa-layer-group"></i> Groups
          </a>
          <a
            (click)="activeTab = 'channels'"
            [class.active]="activeTab === 'channels'"
          >
            <i class="fas fa-broadcast-tower"></i> Channels
          </a>
          <a
            (click)="activeTab = 'messages'"
            [class.active]="activeTab === 'messages'"
          >
            <i class="fas fa-chart-bar"></i> Message Stats
          </a>
          <a routerLink="/chat" class="back-link">
            <i class="fas fa-arrow-left"></i> Back to Chat
          </a>
        </nav>
      </div>

      <!-- Main content -->
      <div class="admin-main">
        <!-- Dashboard -->
        <div *ngIf="activeTab === 'dashboard'" class="admin-dashboard">
          <h2>Dashboard Overview</h2>
          <div class="stats-grid">
            <div class="stat-card" style="--accent: #128C7E;">
              <div class="stat-icon"><i class="fas fa-users"></i></div>
              <div class="stat-info">
                <span class="stat-value">{{ dashboard?.totalUsers || 0 }}</span>
                <span class="stat-label">Total Users</span>
              </div>
            </div>
            <div class="stat-card" style="--accent: #25D366;">
              <div class="stat-icon"><i class="fas fa-circle"></i></div>
              <div class="stat-info">
                <span class="stat-value">{{
                  dashboard?.onlineUsers || 0
                }}</span>
                <span class="stat-label">Online Users</span>
              </div>
            </div>
            <div class="stat-card" style="--accent: #34B7F1;">
              <div class="stat-icon"><i class="fas fa-comments"></i></div>
              <div class="stat-info">
                <span class="stat-value">{{
                  dashboard?.totalMessages || 0
                }}</span>
                <span class="stat-label">Total Messages</span>
              </div>
            </div>
            <div class="stat-card" style="--accent: #FF6B6B;">
              <div class="stat-icon"><i class="fas fa-layer-group"></i></div>
              <div class="stat-info">
                <span class="stat-value">{{
                  dashboard?.totalGroups || 0
                }}</span>
                <span class="stat-label">Groups</span>
              </div>
            </div>
            <div class="stat-card" style="--accent: #FFA726;">
              <div class="stat-icon">
                <i class="fas fa-broadcast-tower"></i>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{
                  dashboard?.totalChannels || 0
                }}</span>
                <span class="stat-label">Channels</span>
              </div>
            </div>
            <div class="stat-card" style="--accent: #AB47BC;">
              <div class="stat-icon"><i class="fas fa-clock"></i></div>
              <div class="stat-info">
                <span class="stat-value">{{
                  dashboard?.messagesToday || 0
                }}</span>
                <span class="stat-label">Messages Today</span>
              </div>
            </div>
          </div>

          <!-- Recent users -->
          <div class="admin-section">
            <h3>Recent Users</h3>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let user of dashboard?.recentUsers || []">
                    <td>
                      <div class="user-cell">
                        <div class="avatar sm">
                          {{ user.fullName?.charAt(0) }}
                        </div>
                        <span>{{ user.fullName }}</span>
                      </div>
                    </td>
                    <td>{{ user.email }}</td>
                    <td>
                      <span class="badge" [class.online]="user.isOnline">
                        {{ user.isOnline ? 'Online' : 'Offline' }}
                      </span>
                    </td>
                    <td>{{ user.createdAt | date: 'shortDate' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Users management -->
        <div *ngIf="activeTab === 'users'" class="admin-users">
          <div class="section-header">
            <h2>User Management</h2>
            <div class="search-box">
              <i class="fas fa-search"></i>
              <input
                type="text"
                [(ngModel)]="userSearch"
                placeholder="Search users..."
                (ngModelChange)="filterUsers()"
              />
            </div>
          </div>

          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Seen</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let user of filteredUsers">
                  <td>
                    <div class="user-cell">
                      <div class="avatar sm">
                        {{ user.fullName?.charAt(0) }}
                      </div>
                      <div>
                        <span class="user-name">{{ user.fullName }}</span>
                        <span class="username">&#64;{{ user.username }}</span>
                      </div>
                    </div>
                  </td>
                  <td>{{ user.email }}</td>
                  <td>
                    <span
                      class="role-badge"
                      [class.admin]="user.role === 'Admin'"
                    >
                      {{ user.role }}
                    </span>
                  </td>
                  <td>
                    <span class="badge" [class.online]="user.isOnline">
                      {{ user.isOnline ? 'Online' : 'Offline' }}
                    </span>
                  </td>
                  <td>{{ user.lastSeen | date: 'short' }}</td>
                  <td>
                    <div class="action-btns">
                      <button
                        class="action-btn"
                        title="Toggle Role"
                        (click)="toggleRole(user)"
                      >
                        <i class="fas fa-user-shield"></i>
                      </button>
                      <button
                        class="action-btn danger"
                        title="Delete User"
                        (click)="deleteUser(user.id)"
                      >
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Groups -->
        <div *ngIf="activeTab === 'groups'" class="admin-groups">
          <h2>Groups</h2>
          <div class="cards-grid">
            <div *ngFor="let group of groups" class="info-card">
              <div class="card-header">
                <div class="avatar">{{ group.name?.charAt(0) }}</div>
                <div>
                  <h4>{{ group.name }}</h4>
                  <span class="meta">{{ group.memberCount }} members</span>
                </div>
              </div>
              <p class="card-desc">
                {{ group.description || 'No description' }}
              </p>
              <div class="card-footer">
                <span>Created {{ group.createdAt | date: 'shortDate' }}</span>
              </div>
            </div>
            <div class="empty-state" *ngIf="groups.length === 0">
              <i class="fas fa-layer-group"></i>
              <p>No groups yet</p>
            </div>
          </div>
        </div>

        <!-- Channels -->
        <div *ngIf="activeTab === 'channels'" class="admin-channels">
          <h2>Channels</h2>
          <div class="cards-grid">
            <div *ngFor="let ch of channels" class="info-card">
              <div class="card-header">
                <div class="avatar">{{ ch.name?.charAt(0) }}</div>
                <div>
                  <h4>{{ ch.name }}</h4>
                  <span class="meta">{{ ch.subscriberCount }} subscribers</span>
                </div>
              </div>
              <p class="card-desc">{{ ch.description || 'No description' }}</p>
              <div class="card-footer">
                <span>By {{ ch.creatorName }}</span>
              </div>
            </div>
            <div class="empty-state" *ngIf="channels.length === 0">
              <i class="fas fa-broadcast-tower"></i>
              <p>No channels yet</p>
            </div>
          </div>
        </div>

        <!-- Message Stats -->
        <div *ngIf="activeTab === 'messages'" class="admin-stats">
          <h2>Message Statistics</h2>
          <div class="stats-detail">
            <div class="stat-row" *ngIf="messageStats">
              <div class="stat-block">
                <span class="stat-num">{{ messageStats.totalMessages }}</span>
                <span class="stat-lbl">Total Messages</span>
              </div>
              <div class="stat-block">
                <span class="stat-num">{{ messageStats.messagesToday }}</span>
                <span class="stat-lbl">Today</span>
              </div>
              <div class="stat-block">
                <span class="stat-num">{{
                  messageStats.messagesThisWeek
                }}</span>
                <span class="stat-lbl">This Week</span>
              </div>
              <div class="stat-block">
                <span class="stat-num">{{
                  messageStats.messagesThisMonth
                }}</span>
                <span class="stat-lbl">This Month</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .admin-container {
        display: flex;
        height: 100vh;
        background: var(--bg-primary);
      }
      .admin-sidebar {
        width: 260px;
        background: var(--bg-sidebar);
        border-right: 1px solid var(--border-color);
        display: flex;
        flex-direction: column;
      }
      .admin-brand {
        padding: 20px;
        font-size: 18px;
        font-weight: 700;
        color: var(--primary);
        display: flex;
        align-items: center;
        gap: 10px;
        border-bottom: 1px solid var(--border-color);
        i {
          font-size: 22px;
        }
      }
      .admin-nav {
        flex: 1;
        padding: 8px 0;
        a {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 20px;
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
          text-decoration: none;
          i {
            width: 20px;
            text-align: center;
          }
          &:hover {
            background: var(--hover);
            color: var(--text-primary);
          }
          &.active {
            background: var(--hover);
            color: var(--primary);
            border-right: 3px solid var(--primary);
          }
        }
        .back-link {
          margin-top: auto;
          border-top: 1px solid var(--border-color);
        }
      }
      .admin-main {
        flex: 1;
        overflow-y: auto;
        padding: 24px 32px;
      }
      h2 {
        margin: 0 0 24px;
        font-size: 22px;
      }
      h3 {
        margin: 24px 0 16px;
        font-size: 18px;
      }
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 16px;
      }
      .stat-card {
        background: var(--bg-sidebar);
        border-radius: 12px;
        padding: 20px;
        display: flex;
        align-items: center;
        gap: 16px;
        border: 1px solid var(--border-color);
        transition: transform 0.2s;
        &:hover {
          transform: translateY(-2px);
        }
      }
      .stat-icon {
        width: 52px;
        height: 52px;
        border-radius: 12px;
        background: var(--accent);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 22px;
      }
      .stat-info {
        display: flex;
        flex-direction: column;
        .stat-value {
          font-size: 28px;
          font-weight: 700;
        }
        .stat-label {
          font-size: 13px;
          color: var(--text-secondary);
        }
      }
      .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;
        h2 {
          margin: 0;
        }
      }
      .search-box {
        display: flex;
        align-items: center;
        background: var(--bg-input);
        border-radius: 8px;
        padding: 8px 14px;
        gap: 8px;
        i {
          color: var(--text-secondary);
        }
        input {
          background: transparent;
          border: none;
          color: var(--text-primary);
          outline: none;
          font-size: 14px;
          width: 200px;
        }
      }
      .table-container {
        background: var(--bg-sidebar);
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid var(--border-color);
      }
      table {
        width: 100%;
        border-collapse: collapse;
        th,
        td {
          padding: 12px 16px;
          text-align: left;
          font-size: 14px;
        }
        th {
          background: var(--bg-input);
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
          color: var(--text-secondary);
        }
        tr {
          border-bottom: 1px solid var(--border-color);
        }
        tr:last-child {
          border-bottom: none;
        }
        tr:hover td {
          background: var(--hover);
        }
      }
      .user-cell {
        display: flex;
        align-items: center;
        gap: 10px;
        .username {
          display: block;
          font-size: 12px;
          color: var(--text-secondary);
        }
      }
      .avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: var(--primary);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 600;
        font-size: 14px;
        &.sm {
          width: 32px;
          height: 32px;
          font-size: 13px;
        }
      }
      .badge {
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 12px;
        background: #555;
        color: #aaa;
        &.online {
          background: rgba(37, 211, 102, 0.15);
          color: #25d366;
        }
      }
      .role-badge {
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 12px;
        background: rgba(255, 255, 255, 0.1);
        &.admin {
          background: rgba(18, 140, 126, 0.2);
          color: var(--primary);
        }
      }
      .action-btns {
        display: flex;
        gap: 4px;
      }
      .action-btn {
        width: 32px;
        height: 32px;
        border-radius: 6px;
        border: none;
        background: var(--hover);
        color: var(--text-secondary);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        &:hover {
          background: var(--primary);
          color: white;
        }
        &.danger:hover {
          background: #f44336;
        }
      }
      .cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 16px;
      }
      .info-card {
        background: var(--bg-sidebar);
        border-radius: 12px;
        padding: 16px;
        border: 1px solid var(--border-color);
        .card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
          h4 {
            margin: 0;
            font-size: 15px;
          }
          .meta {
            font-size: 13px;
            color: var(--text-secondary);
          }
        }
        .card-desc {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 8px 0;
        }
        .card-footer {
          font-size: 12px;
          color: var(--text-secondary);
        }
      }
      .empty-state {
        text-align: center;
        padding: 40px;
        color: var(--text-secondary);
        grid-column: 1 / -1;
        i {
          font-size: 48px;
          margin-bottom: 12px;
        }
      }
      .stats-detail {
        background: var(--bg-sidebar);
        border-radius: 12px;
        padding: 24px;
        border: 1px solid var(--border-color);
      }
      .stat-row {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
      }
      .stat-block {
        text-align: center;
        padding: 20px;
        background: var(--bg-input);
        border-radius: 10px;
        .stat-num {
          display: block;
          font-size: 32px;
          font-weight: 700;
          color: var(--primary);
        }
        .stat-lbl {
          font-size: 13px;
          color: var(--text-secondary);
          margin-top: 4px;
          display: block;
        }
      }
    `,
  ],
})
export class AdminComponent implements OnInit {
  activeTab = 'dashboard';
  dashboard: any = null;
  users: any[] = [];
  filteredUsers: any[] = [];
  groups: any[] = [];
  channels: any[] = [];
  messageStats: any = null;
  userSearch = '';

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadDashboard();
    this.loadUsers();
    this.loadGroups();
    this.loadChannels();
    this.loadMessageStats();
  }

  loadDashboard(): void {
    this.adminService
      .getDashboard()
      .subscribe((data) => (this.dashboard = data));
  }

  loadUsers(): void {
    this.adminService.getAllUsers().subscribe((users) => {
      this.users = users;
      this.filteredUsers = users;
    });
  }

  loadGroups(): void {
    this.adminService
      .getAllGroups()
      .subscribe((groups) => (this.groups = groups));
  }

  loadChannels(): void {
    this.adminService
      .getAllChannels()
      .subscribe((channels) => (this.channels = channels));
  }

  loadMessageStats(): void {
    this.adminService
      .getMessageStats()
      .subscribe((stats) => (this.messageStats = stats));
  }

  filterUsers(): void {
    if (!this.userSearch) {
      this.filteredUsers = this.users;
    } else {
      const q = this.userSearch.toLowerCase();
      this.filteredUsers = this.users.filter(
        (u) =>
          u.fullName?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.username?.toLowerCase().includes(q),
      );
    }
  }

  toggleRole(user: any): void {
    const newRole = user.role === 'Admin' ? 'User' : 'Admin';
    this.adminService.updateUser(user.id, { role: newRole }).subscribe(() => {
      user.role = newRole;
    });
  }

  deleteUser(id: number): void {
    if (confirm('Are you sure you want to delete this user?')) {
      this.adminService.deleteUser(id).subscribe(() => {
        this.users = this.users.filter((u) => u.id !== id);
        this.filterUsers();
      });
    }
  }
}
