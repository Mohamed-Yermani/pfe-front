import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { NotificationToastComponent } from '../../components/notification-toast/notification-toast.component';


@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, HeaderComponent, FooterComponent, NotificationToastComponent],
  template: `
    <div class="flex h-screen bg-gray-100 font-sans">
      <app-sidebar [isOpen]="isSidebarOpen()"></app-sidebar>
      <div class="flex flex-col flex-1 overflow-hidden">
        <app-header (toggleSidebar)="toggleSidebar()"></app-header>
        <main class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div class="container mx-auto px-6 py-8">
            <router-outlet></router-outlet>
          </div>
        </main>
        <app-footer></app-footer>
      </div>
    </div>
    <app-notification-toast></app-notification-toast>
  `
})
export class MainLayoutComponent {
  isSidebarOpen = signal<boolean>(true);

  toggleSidebar() {
    this.isSidebarOpen.update(val => !val);
  }
}