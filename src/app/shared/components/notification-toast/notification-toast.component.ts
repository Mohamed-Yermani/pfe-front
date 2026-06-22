import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { WebsocketService, NotificationPayload } from '../../../core/services/websocket.service';

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="fixed top-4 right-4 z-[100] flex flex-col gap-3 w-[340px] max-w-[90vw]">
      @for (toast of websocketService.activeToasts(); track toast) {
        <div
          class="bg-white rounded-xl border shadow-2xl overflow-hidden animate-in slide-in-from-right-8 fade-in duration-300 cursor-pointer"
          [class]="borderClass(toast.type)"
          (click)="onClick(toast)">
          <div class="p-4 flex gap-3 items-start">
            <div class="w-9 h-9 rounded-full flex items-center justify-center shrink-0" [class]="iconBgClass(toast.type)">
              <mat-icon class="!text-[18px] w-[18px] h-[18px] flex items-center justify-center">{{ iconFor(toast.type) }}</mat-icon>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-black text-slate-900 leading-tight">{{ toast.titre }}</p>
              <p class="text-[11px] text-slate-500 leading-snug mt-1 line-clamp-3">{{ toast.message }}</p>
            </div>
            <button (click)="dismiss(toast, $event)" class="text-slate-300 hover:text-slate-600 transition-colors shrink-0" title="Fermer" aria-label="Fermer">
              <mat-icon class="!text-[16px] w-4 h-4">close</mat-icon>
            </button>
          </div>
          <div class="h-1 w-full" [class]="barClass(toast.type)"></div>
        </div>
      }
    </div>
  `
})
export class NotificationToastComponent {
  websocketService = inject(WebsocketService);
  private router = inject(Router);

  iconFor(type: NotificationPayload['type']): string {
    switch (type) {
      case 'SUCCESS': return 'check_circle';
      case 'DANGER': return 'error';
      case 'WARNING': return 'warning';
      default: return 'info';
    }
  }

  iconBgClass(type: NotificationPayload['type']): string {
    switch (type) {
      case 'SUCCESS': return 'bg-emerald-50 text-emerald-700';
      case 'DANGER': return 'bg-red-50 text-red-700';
      case 'WARNING': return 'bg-amber-50 text-amber-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  }

  borderClass(type: NotificationPayload['type']): string {
    switch (type) {
      case 'SUCCESS': return 'border-emerald-100';
      case 'DANGER': return 'border-red-100';
      case 'WARNING': return 'border-amber-100';
      default: return 'border-slate-200';
    }
  }

  barClass(type: NotificationPayload['type']): string {
    switch (type) {
      case 'SUCCESS': return 'bg-emerald-600';
      case 'DANGER': return 'bg-red-600';
      case 'WARNING': return 'bg-amber-500';
      default: return 'bg-slate-400';
    }
  }

  dismiss(toast: NotificationPayload, event: Event): void {
    event.stopPropagation();
    this.websocketService.removeToast(toast);
  }

  onClick(toast: NotificationPayload): void {
    this.websocketService.removeToast(toast);
    if (toast.dossierId) {
      this.router.navigate(['/dossiers']);
    }
  }
}