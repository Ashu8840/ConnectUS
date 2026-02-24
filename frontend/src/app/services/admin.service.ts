import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AdminDashboard, User } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<AdminDashboard> {
    return this.http.get<AdminDashboard>(`${this.apiUrl}/admin/dashboard`);
  }

  getAllUsers(page = 1, search?: string): Observable<User[]> {
    let url = `${this.apiUrl}/admin/users?page=${page}`;
    if (search) url += `&search=${search}`;
    return this.http.get<User[]>(url);
  }

  updateUser(id: number, dto: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/users/${id}`, dto);
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/users/${id}`);
  }

  getMessageStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/messages/stats`);
  }

  getAllGroups(page = 1): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/groups?page=${page}`);
  }

  getAllChannels(page = 1): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/channels?page=${page}`);
  }
}
