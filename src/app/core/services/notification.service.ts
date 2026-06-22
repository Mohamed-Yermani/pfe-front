import { Injectable, inject, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { AppNotification } from '../models/notification.model';
import { AuthService } from './auth.service';
import { WebsocketService } from './websocket.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private websocketService = inject(WebsocketService);

  private notificationsSubject = new BehaviorSubject<AppNotification[]>([]);
  notifications$ = this.notificationsSubject.asObservable();

  constructor() {
    // 1. Charger les notifications persistées de l'API pour l'utilisateur actuel
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.rafraichirNotifications();
      } else {
        this.notificationsSubject.next([]);
      }
    });

    // 2. Écouter les nouvelles notifications via le WebSocket et rafraîchir la liste
    this.websocketService.notification$.subscribe(payload => {
      const user = this.authService.currentUser();
      if (!user) return;
      
      this.rafraichirNotifications();
    });
  }

  rafraichirNotifications() {
    this.http.get<AppNotification[]>('/api/notifications').subscribe({
      next: (notifs) => {
        this.notificationsSubject.next(notifs);
      },
      error: (err) => {
        console.error('Erreur de chargement des notifications:', err);
      }
    });
  }

  getMesNotifications(): Observable<AppNotification[]> {
    return this.http.get<AppNotification[]>('/api/notifications').pipe(
      tap(notifs => this.notificationsSubject.next(notifs))
    );
  }

  getNonLuesCount(): Observable<{ nonLues: number }> {
    return this.http.get<{ nonLues: number }>('/api/notifications/count');
  }

  marquerLue(id: number): Observable<{ nonLues: number }> {
    return this.http.put<{ nonLues: number }>(`/api/notifications/${id}/lire`, null).pipe(
      tap(() => {
        const updated = this.notificationsSubject.value.map(n => 
          n.id === id ? { ...n, lue: true } : n
        );
        this.notificationsSubject.next(updated);
      })
    );
  }

  marquerToutesLues(): Observable<{ nonLues: number }> {
    return this.http.put<{ nonLues: number }>('/api/notifications/lire-toutes', null).pipe(
      tap(() => {
        const updated = this.notificationsSubject.value.map(n => ({ ...n, lue: true }));
        this.notificationsSubject.next(updated);
      })
    );
  }

  getWebSocketStatus(): Observable<{ status: string; endpoint: string; topic?: string; topics?: string[] }> {
    return this.http.get<{ status: string; endpoint: string; topic?: string; topics?: string[] }>('/api/notifications/status');
  }

  sendTestNotification(email: string, message: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`/api/notifications/test/${email}`, null, {
      params: { message }
    });
  }
}
