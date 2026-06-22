import { Component, EventEmitter, Output, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AppNotification } from '../../../core/models/notification.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatTooltipModule],
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  @Output() toggleSidebar = new EventEmitter<void>();

  authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  isDropdownOpen = signal(false);
  isNotificationsOpen = signal(false);

  notifications = toSignal(this.notificationService.notifications$, { initialValue: [] as AppNotification[] });
  unreadCount = computed(() => this.notifications().filter(n => !n.lue).length);

  unreadCountLabel = computed(() => {
    const count = this.unreadCount();
    if (count === 0) return 'Aucune notification non lue';
    return count === 1 ? '1 notification non lue' : `${count} notifications non lues`;
  });

  recentNotifications = computed(() => this.notifications().slice(0, 5));

  primaryRole = computed(() => this.authService.currentUser()?.roles?.[0] ?? '');

  userInitials = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return '?';
    return `${user.prenom?.[0] ?? ''}${user.nom?.[0] ?? ''}`.toUpperCase();
  });

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  toggleDropdown(): void {
    this.isDropdownOpen.update(v => !v);
    this.isNotificationsOpen.set(false);
  }

  toggleNotifications(): void {
    this.isNotificationsOpen.update(v => !v);
    this.isDropdownOpen.set(false);
  }

  closeAllPanels(): void {
    this.isDropdownOpen.set(false);
    this.isNotificationsOpen.set(false);
  }

  onNotificationClick(notif: AppNotification): void {
    if (!notif.lue) {
      this.notificationService.marquerLue(notif.id).subscribe();
    }
    this.closeAllPanels();
    if (notif.dossierId) {
      this.router.navigate(['/dossiers', notif.dossierId]);
    }
  }

  markAllAsRead(event: Event): void {
    event.stopPropagation();
    this.notificationService.marquerToutesLues().subscribe();
  }

  viewAll(): void {
    this.closeAllPanels();
    this.router.navigate(['/notifications']);
  }

  iconForType(type: AppNotification['type']): string {
    switch (type) {
      case 'SUCCESS': return 'check_circle';
      case 'DANGER': return 'error';
      case 'WARNING': return 'warning';
      default: return 'info';
    }
  }

  colorClassForType(type: AppNotification['type']): string {
    switch (type) {
      case 'SUCCESS': return 'bg-emerald-50 text-emerald-700';
      case 'DANGER': return 'bg-red-50 text-red-700';
      case 'WARNING': return 'bg-amber-50 text-amber-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  }

  timeAgo(date: string | Date): string {
    const now = new Date();
    const past = new Date(date);
    const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (seconds < 60) return "à l'instant";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `il y a ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `il y a ${hours} h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `il y a ${days} j`;
    return past.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  logout(): void {
    this.closeAllPanels();
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}