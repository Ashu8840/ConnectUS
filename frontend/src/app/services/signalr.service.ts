import { Injectable, EventEmitter } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { Message } from '../models/models';

@Injectable({ providedIn: 'root' })
export class SignalrService {
  private hubConnection!: signalR.HubConnection;

  messageReceived = new EventEmitter<Message>();
  groupMessageReceived = new EventEmitter<Message>();
  channelMessageReceived = new EventEmitter<Message>();
  userOnline = new EventEmitter<number>();
  userOffline = new EventEmitter<{ userId: number; lastSeen: string }>();
  userTyping = new EventEmitter<number>();
  userStoppedTyping = new EventEmitter<number>();
  userTypingGroup = new EventEmitter<{ userId: number; groupId: number }>();
  messagesRead = new EventEmitter<number>();
  messageDeleted = new EventEmitter<number>();

  // WebRTC events
  incomingCall = new EventEmitter<any>();
  callAccepted = new EventEmitter<number>();
  callRejected = new EventEmitter<number>();
  callEnded = new EventEmitter<void>();
  receiveOffer = new EventEmitter<{ userId: number; offer: string }>();
  receiveAnswer = new EventEmitter<{ userId: number; answer: string }>();
  receiveIceCandidate = new EventEmitter<{
    userId: number;
    candidate: string;
  }>();

  constructor(private authService: AuthService) {}

  startConnection(): void {
    const token = this.authService.getToken();
    if (!token) return;

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.hubUrl}?access_token=${token}`)
      .withAutomaticReconnect()
      .build();

    this.hubConnection
      .start()
      .then(() => console.log('SignalR Connected'))
      .catch((err) => console.error('SignalR Error:', err));

    this.registerHandlers();
  }

  stopConnection(): void {
    if (this.hubConnection) {
      this.hubConnection.stop();
    }
  }

  private registerHandlers(): void {
    this.hubConnection.on('ReceiveMessage', (msg: Message) =>
      this.messageReceived.emit(msg),
    );
    this.hubConnection.on('ReceiveGroupMessage', (msg: Message) =>
      this.groupMessageReceived.emit(msg),
    );
    this.hubConnection.on('ReceiveChannelMessage', (msg: Message) =>
      this.channelMessageReceived.emit(msg),
    );
    this.hubConnection.on('UserOnline', (userId: number) =>
      this.userOnline.emit(userId),
    );
    this.hubConnection.on('UserOffline', (userId: number, lastSeen: string) =>
      this.userOffline.emit({ userId, lastSeen }),
    );
    this.hubConnection.on('UserTyping', (userId: number) =>
      this.userTyping.emit(userId),
    );
    this.hubConnection.on('UserStoppedTyping', (userId: number) =>
      this.userStoppedTyping.emit(userId),
    );
    this.hubConnection.on(
      'UserTypingGroup',
      (userId: number, groupId: number) =>
        this.userTypingGroup.emit({ userId, groupId }),
    );
    this.hubConnection.on('MessagesRead', (userId: number) =>
      this.messagesRead.emit(userId),
    );
    this.hubConnection.on('MessageDeleted', (msgId: number) =>
      this.messageDeleted.emit(msgId),
    );

    // WebRTC
    this.hubConnection.on('IncomingCall', (data: any) =>
      this.incomingCall.emit(data),
    );
    this.hubConnection.on('CallAccepted', (userId: number) =>
      this.callAccepted.emit(userId),
    );
    this.hubConnection.on('CallRejected', (userId: number) =>
      this.callRejected.emit(userId),
    );
    this.hubConnection.on('CallEnded', () => this.callEnded.emit());
    this.hubConnection.on('ReceiveOffer', (userId: number, offer: string) =>
      this.receiveOffer.emit({ userId, offer }),
    );
    this.hubConnection.on('ReceiveAnswer', (userId: number, answer: string) =>
      this.receiveAnswer.emit({ userId, answer }),
    );
    this.hubConnection.on(
      'ReceiveIceCandidate',
      (userId: number, candidate: string) =>
        this.receiveIceCandidate.emit({ userId, candidate }),
    );
  }

  startTyping(receiverId: number): void {
    this.hubConnection?.invoke('StartTyping', receiverId);
  }

  stopTyping(receiverId: number): void {
    this.hubConnection?.invoke('StopTyping', receiverId);
  }

  startTypingGroup(groupId: number): void {
    this.hubConnection?.invoke('StartTypingGroup', groupId);
  }

  markAsRead(senderId: number): void {
    this.hubConnection?.invoke('MarkAsRead', senderId);
  }

  // WebRTC signaling
  callUser(targetUserId: number, callType: string): void {
    this.hubConnection?.invoke('CallUser', targetUserId, callType);
  }

  acceptCall(callerId: number): void {
    this.hubConnection?.invoke('AcceptCall', callerId);
  }

  rejectCall(callerId: number): void {
    this.hubConnection?.invoke('RejectCall', callerId);
  }

  endCall(otherUserId: number): void {
    this.hubConnection?.invoke('EndCall', otherUserId);
  }

  sendOffer(targetUserId: number, offer: string): void {
    this.hubConnection?.invoke('SendOffer', targetUserId, offer);
  }

  sendAnswer(targetUserId: number, answer: string): void {
    this.hubConnection?.invoke('SendAnswer', targetUserId, answer);
  }

  sendIceCandidate(targetUserId: number, candidate: string): void {
    this.hubConnection?.invoke('SendIceCandidate', targetUserId, candidate);
  }
}
