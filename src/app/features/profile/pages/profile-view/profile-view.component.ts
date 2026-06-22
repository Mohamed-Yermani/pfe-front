
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-profile-view',
  templateUrl: './profile-view.component.html',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileViewComponent {
  authService = inject(AuthService);
  user = this.authService.currentUser;
  
  getRoleDisplayNames(roles: string[]): string {
    return roles.map(role => role.replace('ROLE_', '')).join(', ');
  }
}