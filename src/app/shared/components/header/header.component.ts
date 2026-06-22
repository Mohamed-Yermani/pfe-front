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
  viewAll(): void {
  this.closeAllPanels();
  this.router.navigate(['/notifications']);
}
  // Connecté au vrai flux (API + WebSocket) via NotificationService.notifications$
  notifications = toSignal(this.notificationService.notifications$, { initialValue: [] as AppNotification[] });

  unreadCount = computed(() => this.notifications().filter(n => !n.lue).length);
  unreadCountLabel = computed(() => {
    const count = this.unreadCount();
    return count > 9 ? '9+' : String(count);
  });

  // Les 8 plus récentes pour le panneau déroulant
  recentNotifications = computed(() => this.notifications().slice(0, 8));

  userInitials = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return '?';
    return `${user.prenom?.[0] ?? ''}${user.nom?.[0] ?? ''}`.toUpperCase();
  });

  primaryRole = computed(() => {
    const user = this.authService.currentUser();
    const roles = (user as any)?.roles;
    if (!roles || !Array.isArray(roles) || roles.length === 0) return 'ROLE_ASSURE';
    const first = roles[0];
    return typeof first === 'string' ? first : (first?.name ?? 'ROLE_ASSURE');
  });

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  toggleDropdown(): void {
    this.isDropdownOpen.update(v => !v);
    this.isNotificationsOpen.set(false);
  }

  toggleNotifications(): void {
    const opening = !this.isNotificationsOpen();
    this.isNotificationsOpen.set(opening);
    this.isDropdownOpen.set(false);
    if (opening) {
      // Rafraîchit au cas où une notif serait arrivée hors WebSocket
      this.notificationService.rafraichirNotifications();
    }
  }

  closeAllPanels(): void {
    this.isDropdownOpen.set(false);
    this.isNotificationsOpen.set(false);
  }

  onNotificationClick(notif: AppNotification): void {
    if (!notif.lue) {
      this.notificationService.marquerLue(notif.id).subscribe();
    }
    this.isNotificationsOpen.set(false);

    if (notif.link) {
      this.router.navigateByUrl(notif.link);
    } else if (notif.dossierId) {
      this.router.navigate(['/dossiers']);
    }
  }

  markAllAsRead(event: Event): void {
    event.stopPropagation();
    this.notificationService.marquerToutesLues().subscribe();
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
      case 'SUCCESS': return 'text-emerald-700 bg-emerald-50';
      case 'DANGER': return 'text-red-700 bg-red-50';
      case 'WARNING': return 'text-amber-700 bg-amber-50';
      default: return 'text-slate-600 bg-slate-100';
    }
  }

  timeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return "à l'instant";
    if (diffMin < 60) return `il y a ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `il y a ${diffH} h`;
    const diffJ = Math.floor(diffH / 24);
    if (diffJ < 7) return `il y a ${diffJ} j`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  }

  logout(): void {
    this.isDropdownOpen.set(false);
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}