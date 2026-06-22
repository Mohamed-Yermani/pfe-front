import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { toSignal } from '@angular/core/rxjs-interop';
import { NotificationService } from '../../../../core/services/notification.service';
import { AppNotification } from '../../../../core/models/notification.model';

@Component({
  selector: 'app-notification-history',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './notification-history.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationHistoryComponent {
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  notifications = toSignal(this.notificationService.notifications$, { initialValue: [] as AppNotification[] });
  unreadCount = computed(() => this.notifications().filter(n => !n.lue).length);

  constructor() {
    this.notificationService.rafraichirNotifications();
  }

  markAllAsRead(): void {
    this.notificationService.marquerToutesLues().subscribe();
  }

  onNotificationClick(notif: AppNotification): void {
    if (!notif.lue) {
      this.notificationService.marquerLue(notif.id).subscribe();
    }
    if (notif.dossierId) {
      this.router.navigate(['/dossiers', notif.dossierId]);
    }
  }

  iconFor(type: AppNotification['type']): string {
    switch (type) {
      case 'SUCCESS': return 'check_circle';
      case 'DANGER': return 'error';
      case 'WARNING': return 'warning';
      default: return 'info';
    }
  }

  iconBgClass(type: AppNotification['type']): string {
    switch (type) {
      case 'SUCCESS': return 'bg-emerald-50 text-emerald-700';
      case 'DANGER': return 'bg-red-50 text-red-700';
      case 'WARNING': return 'bg-amber-50 text-amber-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  }
}