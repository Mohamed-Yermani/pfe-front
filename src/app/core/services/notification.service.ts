import { Injectable, inject, effect, signal } from '@angular/core';
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

  // ← signal exposé, alimenté par 3 sources ci-dessous
  unreadCount = signal<number>(0);

  constructor() {
    // Source 1 — chargement initial + refresh API
    // Quand la liste change, on recalcule le compteur localement
    this.notificationsSubject.subscribe(notifs => {
      this.unreadCount.set(notifs.filter(n => !n.lue).length);
    });

    // Source 2 — compteur temps réel envoyé par le backend via WebSocket
    // C'est la source la plus précise : elle prime sur le calcul local
    this.websocketService.compteur$.subscribe(count => {
      this.unreadCount.set(count);
    });

    // Source 3 — nouvelle notification reçue en temps réel
    // On rafraîchit la liste complète (qui mettra à jour le compteur via Source 1)
    this.websocketService.notification$.subscribe(() => {
      if (this.authService.currentUser()) {
        this.rafraichirNotifications();
      }
    });

    // Chargement au démarrage dès que l'utilisateur est disponible
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.rafraichirNotifications();
      } else {
        this.notificationsSubject.next([]);
        this.unreadCount.set(0);
      }
    });
  }

  rafraichirNotifications(): void {
    this.http.get<AppNotification[]>('/api/notifications').subscribe({
      next: notifs => this.notificationsSubject.next(notifs),
      error: err => console.error('Erreur notifications:', err)
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
      tap(res => {
        const updated = this.notificationsSubject.value.map(n =>
          n.id === id ? { ...n, lue: true } : n
        );
        this.notificationsSubject.next(updated);
        // Mise à jour optimiste immédiate du compteur
        this.unreadCount.set(res.nonLues);
      })
    );
  }

  marquerToutesLues(): Observable<{ nonLues: number }> {
    return this.http.put<{ nonLues: number }>('/api/notifications/lire-toutes', null).pipe(
      tap(() => {
        const updated = this.notificationsSubject.value.map(n => ({ ...n, lue: true }));
        this.notificationsSubject.next(updated);
        this.unreadCount.set(0);
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