import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Contact } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ContactService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getContacts(): Observable<Contact[]> {
    return this.http.get<Contact[]>(`${this.apiUrl}/contact`);
  }

  addContact(dto: {
    usernameOrEmail: string;
    nickname?: string;
  }): Observable<Contact> {
    return this.http.post<Contact>(`${this.apiUrl}/contact`, dto);
  }

  toggleBlock(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/contact/${id}/block`, {});
  }

  toggleFavorite(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/contact/${id}/favorite`, {});
  }

  deleteContact(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/contact/${id}`);
  }
}
