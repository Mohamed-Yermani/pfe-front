import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../../../core/services/user.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-profile-view',
  templateUrl: './profile-view.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileViewComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly fb = inject(FormBuilder);

  user = this.authService.currentUser;

  isEditing = signal(false);
  isLoading = signal(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  profileForm: FormGroup = this.fb.group({
    prenom: ['', Validators.required],
    nom: ['', Validators.required],
    telephone: ['', Validators.required]
  });

  ngOnInit() {
    this.patchFormFromUser();
  }

  private patchFormFromUser() {
    const currentUser = this.user();
    if (currentUser) {
      this.profileForm.patchValue({
        prenom: currentUser.prenom,
        nom: currentUser.nom,
        telephone: currentUser.telephone
      });
    }
  }

  getRoleDisplayNames(roles: string[]): string {
    return roles.map(role => role.replace('ROLE_', '')).join(', ');
  }

  startEditing() {
    this.error.set(null);
    this.successMessage.set(null);
    this.patchFormFromUser();
    this.isEditing.set(true);
  }

  cancelEditing() {
    this.error.set(null);
    this.isEditing.set(false);
  }

  onSubmit() {
    if (this.profileForm.invalid) {
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    this.successMessage.set(null);

    this.userService.updateProfile(this.profileForm.value).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
     next: (updatedUser) => {
  this.authService.updateCurrentUserState(updatedUser); // ✅
  this.successMessage.set('Profil mis à jour avec succès !');
  this.isEditing.set(false);
},
      error: (err) => {
        this.error.set(err?.error?.message || 'Échec de la mise à jour du profil. Veuillez réessayer.');
      }
    });
  }
}