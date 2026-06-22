
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../../../core/services/user.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-profile-edit',
  templateUrl: './profile-edit.component.html',
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileEditComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  
  profileForm: FormGroup = this.fb.group({
    prenom: ['', Validators.required],
    nom: ['', Validators.required],
    telephone: ['', Validators.required]
  });

  currentUser = this.authService.currentUser;
  isLoading = signal(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  ngOnInit() {
    const user = this.currentUser();
    if (user) {
      this.profileForm.patchValue({
        prenom: user.prenom,
        nom: user.nom,
        telephone: user.telephone
      });
    }
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
        this.authService.currentUser.set(updatedUser);
        this.successMessage.set('Profile updated successfully!');
        setTimeout(() => this.router.navigate(['/profile']), 2000);
      },
      error: (err) => {
         this.error.set(err?.error?.message || 'Failed to update profile. Please try again.');
      }
    });
  }
}