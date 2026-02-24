import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { UserStories, Story } from '../models/models';

@Injectable({ providedIn: 'root' })
export class StoryService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createStory(dto: any): Observable<Story> {
    return this.http.post<Story>(`${this.apiUrl}/story`, dto);
  }

  getStories(): Observable<UserStories[]> {
    return this.http.get<UserStories[]>(`${this.apiUrl}/story`);
  }

  viewStory(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/story/${id}/view`, {});
  }

  getStoryViews(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/story/${id}/views`);
  }

  deleteStory(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/story/${id}`);
  }

  getMyStories(): Observable<Story[]> {
    return this.http.get<Story[]>(`${this.apiUrl}/story/my`);
  }

  createStoryWithMedia(formData: FormData): Observable<Story> {
    return this.http.post<Story>(`${this.apiUrl}/story/media`, formData);
  }
}
