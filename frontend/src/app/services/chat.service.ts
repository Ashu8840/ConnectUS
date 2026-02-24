import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ChatListItem, Message } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getConversations(): Observable<ChatListItem[]> {
    return this.http.get<ChatListItem[]>(`${this.apiUrl}/chat/conversations`);
  }

  sendMessage(dto: any): Observable<Message> {
    return this.http.post<Message>(`${this.apiUrl}/chat/send`, dto);
  }

  getMessages(otherUserId: number, page = 1): Observable<Message[]> {
    return this.http.get<Message[]>(
      `${this.apiUrl}/chat/messages/${otherUserId}?page=${page}`,
    );
  }

  getGroupMessages(groupId: number, page = 1): Observable<Message[]> {
    return this.http.get<Message[]>(
      `${this.apiUrl}/chat/group-messages/${groupId}?page=${page}`,
    );
  }

  deleteMessage(messageId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/chat/message/${messageId}`);
  }

  toggleStar(messageId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/chat/message/${messageId}/star`, {});
  }

  getStarredMessages(): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/chat/starred`);
  }

  uploadMedia(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/chat/upload`, formData);
  }
}
