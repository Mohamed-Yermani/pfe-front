import { Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatTooltipModule],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  isOpen = input<boolean>(true);

  private authService = inject(AuthService);
  private router = inject(Router);

  currentUser = this.authService.currentUser;
  isAdmin = computed(() => this.currentUser()?.roles.includes('ROLE_ADMIN'));
  isAgent = computed(() => this.currentUser()?.roles.some(r => r.includes('AGENT')));
  isAgentCNSS = computed(() => this.currentUser()?.roles.includes('ROLE_AGENT_CNSS'));

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}