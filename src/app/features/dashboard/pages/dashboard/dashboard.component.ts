import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { DossierService } from '../../../../core/services/dossier.service';
import { AdminDashboardComponent } from '../admin-dashboard';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, AdminDashboardComponent, MatIconModule, MatTooltipModule, RouterModule],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  authService = inject(AuthService);
  dossierService = inject(DossierService);
  currentUser = this.authService.currentUser;

  isAdmin = computed(() => this.currentUser()?.roles.includes('ROLE_ADMIN'));
  isAssure = computed(() => this.currentUser()?.roles.includes('ROLE_ASSURE'));
  isAgent = computed(() => this.currentUser()?.roles.some(r => r.includes('AGENT')));

  downloadForm() {
    this.dossierService.telechargerFormulaire().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const cin = this.currentUser()?.cin || 'formulaire';
        a.download = `formulaire_${cin}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Erreur lors du téléchargement du formulaire:', err);
      }
    });
  }
}