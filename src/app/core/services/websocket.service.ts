import { Injectable, inject, effect, signal, OnDestroy } from '@angular/core';
import { AuthService } from './auth.service';
import { Subject } from 'rxjs';

export interface NotificationPayload {
  id?: number;
  titre: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER';
  destinataire: string;
  dossierId?: number;
  typeAvantage?: string;
  nonLues?: number;
  dateEnvoi?: string;
}

interface StompFrame {
  command: string;
  headers: Record<string, string>;
  body: string;
}

@Injectable({
  providedIn: 'root'
})
export class WebsocketService implements OnDestroy {
  private authService = inject(AuthService);
  
  private socket: WebSocket | null = null;
  private reconnectTimeout: any = null;
  private intentionDisconnect = false;
  
  connected = signal<boolean>(false);
  notification$ = new Subject<NotificationPayload>();
  compteur$ = new Subject<number>();
  activeToasts = signal<NotificationPayload[]>([]);

  constructor() {
    effect(() => {
      const token = this.authService.getToken();
      if (token) {
        this.intentionDisconnect = false;
        this.connect(token);
      } else {
        this.intentionDisconnect = true;
        this.disconnect();
      }
    }, { allowSignalWrites: true });
  }

  triggerToast(payload: NotificationPayload) {
    this.activeToasts.update(toasts => [...toasts, payload]);
    setTimeout(() => {
      this.removeToast(payload);
    }, 6000); // Automatiquement fermé après 6 secondes
  }

  removeToast(payload: NotificationPayload) {
    this.activeToasts.update(toasts => toasts.filter(t => t !== payload));
  }

  private useDirectLocal = true;

  private connect(token: string) {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.disconnect();

    const isSecure = window.location.protocol === 'https:';
    const protocol = isSecure ? 'wss:' : 'ws:';
    
    let wsUrl = '';
    if ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && this.useDirectLocal) {
      wsUrl = `ws://localhost:8089/ws/websocket`;
    } else {
      wsUrl = `${protocol}//${window.location.host}/ws/websocket`;
    }

    console.log('[STOMP-WS] Connecting to:', wsUrl);

    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log('[STOMP-WS] Web Socket opened, sending CONNECT frame...');
      const connectFrame = this.buildFrame('CONNECT', {
        'accept-version': '1.1,1.2',
        'heart-beat': '10000,10000',
        'Authorization': `Bearer ${token}`
      });
      this.send(connectFrame);
    };

    this.socket.onmessage = (event) => {
      this.handleMessage(event.data);
    };

    this.socket.onerror = (error) => {
      console.error('[STOMP-WS] WebSocket Error:', error);
    };

    this.socket.onclose = (event) => {
      console.log('[STOMP-WS] WebSocket Closed:', event);
      this.connected.set(false);
      this.socket = null;

      // Si nous étions en localhost et qu'un essai de connexion directe a échoué,
      // on basculera sur le fallback au prochain essai
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        this.useDirectLocal = !this.useDirectLocal;
      }

      if (!this.intentionDisconnect) {
        this.scheduleReconnect(token);
      }
    };
  }

  private handleMessage(data: string) {
    if (!data || data === '\n' || data === '\r\n') {
      // Heartbeat ping from server
      return;
    }

    const frame = this.parseFrame(data);
    if (!frame) return;

    if (frame.command === 'CONNECTED') {
      console.log('[STOMP-WS] STOMP Protocol Handshake Successful!');
      this.connected.set(true);
      this.subscribeToNotifications();
    } else if (frame.command === 'MESSAGE') {
      try {
        const dest = frame.headers['destination'] || '';
        const bodyObj = JSON.parse(frame.body);
        console.log(`[STOMP-WS] Message received on ${dest}:`, bodyObj);

        if (dest.endsWith('/queue/compteur')) {
          if (bodyObj && typeof bodyObj.nonLues === 'number') {
            this.compteur$.next(bodyObj.nonLues);
          } else if (typeof bodyObj === 'number') {
            this.compteur$.next(bodyObj);
          }
        } else {
          const payload: NotificationPayload = bodyObj;
          this.notification$.next(payload);
          this.triggerToast(payload);
          if (payload && typeof payload.nonLues === 'number') {
            this.compteur$.next(payload.nonLues);
          }
        }
      } catch (err) {
        console.error('[STOMP-WS] Error parsing message body:', err);
      }
    } else if (frame.command === 'ERROR') {
      console.error('[STOMP-WS] STOMP error frame:', frame.headers['message'] || frame.body);
    }
  }

  private subscribeToNotifications() {
    console.log('[STOMP-WS] Subscribing to /user/queue/notifications');
    const subscribeFrame = this.buildFrame('SUBSCRIBE', {
      id: 'sub-notifications',
      destination: '/user/queue/notifications',
      ack: 'auto'
    });
    this.send(subscribeFrame);

    console.log('[STOMP-WS] Subscribing to /user/queue/compteur');
    const subscribeCompteurFrame = this.buildFrame('SUBSCRIBE', {
      id: 'sub-compteur',
      destination: '/user/queue/compteur',
      ack: 'auto'
    });
    this.send(subscribeCompteurFrame);
  }

  private send(frame: string) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(frame);
    } else {
      console.warn('[STOMP-WS] Cannot send. Socket not open.');
    }
  }

  private scheduleReconnect(token: string) {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    this.reconnectTimeout = setTimeout(() => {
      if (!this.intentionDisconnect) {
        console.log('[STOMP-WS] Attempting automatic reconnection...');
        this.connect(token);
      }
    }, 5000);
  }

  private buildFrame(command: string, headers: Record<string, string>, body = ''): string {
    let frame = command + '\n';
    for (const [key, value] of Object.entries(headers)) {
      if (value !== undefined && value !== null) {
        frame += `${key}:${value}\n`;
      }
    }
    frame += '\n'; // Divider blank line
    if (body) {
      frame += body;
    }
    frame += '\0';
    return frame;
  }

  private parseFrame(data: string): StompFrame | null {
    // Find null character termination if any
    const nullIndex = data.indexOf('\0');
    const frameText = nullIndex !== -1 ? data.substring(0, nullIndex) : data;

    const parts = frameText.split(/\n\r?\n/);
    if (parts.length < 1) return null;

    const headerPart = parts[0];
    const body = parts.slice(1).join('\n\n');

    const lines = headerPart.split(/\r?\n/).map(line => line.trim());
    const command = lines[0];
    if (!command) return null;

    const headers: Record<string, string> = {};
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const colonIndex = line.indexOf(':');
      if (colonIndex !== -1) {
        const key = line.substring(0, colonIndex).trim();
        const val = line.substring(colonIndex + 1).trim();
        headers[key] = val;
      }
    }

    return { command, headers, body };
  }

  private disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.connected.set(false);
  }

  ngOnDestroy() {
    this.intentionDisconnect = true;
    this.disconnect();
  }
}
