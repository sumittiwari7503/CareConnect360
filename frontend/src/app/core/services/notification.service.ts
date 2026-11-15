import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AppNotification, UnreadCountResponse } from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly apiUrl = 'http://localhost:8080/api/v1/notifications';

  // Reactive signal for unread notification count
  public unreadCount = signal<number>(0);

  constructor(private http: HttpClient) {}

  getNotifications(category?: string): Observable<AppNotification[]> {
    let params = new HttpParams();
    if (category && category !== 'all') {
      params = params.set('category', category);
    }
    return this.http.get<AppNotification[]>(this.apiUrl, { params });
  }

  getUnreadCount(): Observable<UnreadCountResponse> {
    return this.http.get<UnreadCountResponse>(`${this.apiUrl}/unread-count`).pipe(
      tap((res) => this.unreadCount.set(res.unreadCount))
    );
  }

  markAsRead(id: number): Observable<AppNotification> {
    return this.http.put<AppNotification>(`${this.apiUrl}/${id}/read`, {}).pipe(
      tap(() => {
        this.unreadCount.update((c) => Math.max(0, c - 1));
      })
    );
  }

  markAllAsRead(): Observable<{ message: string; updatedCount: number }> {
    return this.http.put<{ message: string; updatedCount: number }>(`${this.apiUrl}/mark-all-read`, {}).pipe(
      tap(() => this.unreadCount.set(0))
    );
  }

  clearReadNotifications(): Observable<{ message: string; clearedCount: number }> {
    return this.http.delete<{ message: string; clearedCount: number }>(`${this.apiUrl}/clear-read`);
  }
}
