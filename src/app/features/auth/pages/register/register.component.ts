
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../../core/services/auth.service';
import { finalize } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  registerForm: FormGroup;
  isLoading = signal(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  constructor() {
    this.registerForm = this.fb.group({
      prenom: ['', Validators.required],
      nom: ['', Validators.required],
      email: ['admin@cnss.tn', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required, 
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      ]],
      numeroAssure: ['', Validators.required],
      cin: ['', Validators.required],
      telephone: ['', Validators.required],
      role: ['ROLE_ASSURE']
    });
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    this.successMessage.set(null);
    console.log('Submitting registration form...', this.registerForm.value);

    this.authService.register(this.registerForm.value).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: () => {
        this.successMessage.set('Registration successful! Please check your email to verify your account.');
        this.registerForm.reset();
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'An unexpected error occurred. Please try again.');
      }
    });
  }
}