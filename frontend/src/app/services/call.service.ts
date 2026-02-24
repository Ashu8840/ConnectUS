import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CallLog } from '../models/models';

@Injectable({ providedIn: 'root' })
export class CallService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  initiateCall(dto: {
    receiverId: number;
    callType: string;
  }): Observable<CallLog> {
    return this.http.post<CallLog>(`${this.apiUrl}/call/initiate`, dto);
  }

  answerCall(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/call/${id}/answer`, {});
  }

  endCall(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/call/${id}/end`, {});
  }

  rejectCall(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/call/${id}/reject`, {});
  }

  getCallHistory(page = 1): Observable<CallLog[]> {
    return this.http.get<CallLog[]>(`${this.apiUrl}/call/history?page=${page}`);
  }
}
