import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Group } from '../models/models';

@Injectable({ providedIn: 'root' })
export class GroupService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createGroup(dto: {
    name: string;
    description?: string;
    memberIds: number[];
  }): Observable<Group> {
    return this.http.post<Group>(`${this.apiUrl}/group`, dto);
  }

  getMyGroups(): Observable<Group[]> {
    return this.http.get<Group[]>(`${this.apiUrl}/group`);
  }

  getGroup(id: number): Observable<Group> {
    return this.http.get<Group>(`${this.apiUrl}/group/${id}`);
  }

  updateGroup(id: number, dto: any): Observable<Group> {
    return this.http.put<Group>(`${this.apiUrl}/group/${id}`, dto);
  }

  addMembers(id: number, memberIds: number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/group/${id}/members`, memberIds);
  }

  removeMember(id: number, memberId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/group/${id}/members/${memberId}`);
  }

  deleteGroup(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/group/${id}`);
  }

  uploadGroupPicture(id: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/group/${id}/picture`, formData);
  }

  searchGroups(query: string): Observable<Group[]> {
    return this.http.get<Group[]>(
      `${this.apiUrl}/group/search?query=${encodeURIComponent(query)}`,
    );
  }

  joinGroup(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/group/${id}/join`, {});
  }
}
