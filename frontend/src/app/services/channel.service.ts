import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Channel, Message } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ChannelService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createChannel(dto: {
    name: string;
    description?: string;
    isPublic: boolean;
  }): Observable<Channel> {
    return this.http.post<Channel>(`${this.apiUrl}/channel`, dto);
  }

  getPublicChannels(search?: string): Observable<Channel[]> {
    const q = search ? `?search=${search}` : '';
    return this.http.get<Channel[]>(`${this.apiUrl}/channel${q}`);
  }

  getMyChannels(): Observable<Channel[]> {
    return this.http.get<Channel[]>(`${this.apiUrl}/channel/my`);
  }

  getChannel(id: number): Observable<Channel> {
    return this.http.get<Channel>(`${this.apiUrl}/channel/${id}`);
  }

  subscribe(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/channel/${id}/subscribe`, {});
  }

  unsubscribe(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/channel/${id}/unsubscribe`, {});
  }

  getChannelMessages(id: number, page = 1): Observable<Message[]> {
    return this.http.get<Message[]>(
      `${this.apiUrl}/channel/${id}/messages?page=${page}`,
    );
  }

  deleteChannel(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/channel/${id}`);
  }
}
