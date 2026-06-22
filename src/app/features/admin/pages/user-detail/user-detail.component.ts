
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserService } from '../../../../core/services/user.service';
import { ActivatedRoute } from '@angular/router';
import { User } from '../../../../core/models/user.model';
import { switchMap, finalize, tap, of, catchError } from 'rxjs';

@Component({
  selector: 'app-user-detail',
  templateUrl: './user-detail.component.html',
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDetailComponent {
  private route = inject(ActivatedRoute);
  private userService = inject(UserService);

  user = signal<User | null>(null);
  isLoading = signal(true);
  isUpdating = signal(false);
  loadError = signal<string | null>(null);
  updateError = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  
  constructor() {
    this.route.paramMap.pipe(
      tap(() => this.isLoading.set(true)),
      switchMap(params => {
          const id = params.get('id');
          if (!id) {
            this.loadError.set('User ID not found in URL.');
            return of(null);
          }
          return this.userService.getUserById(id).pipe(
            catchError(err => {
              this.loadError.set('Failed to load user details. The user may not exist.');
              return of(null);
            })
          );
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (userData) => this.user.set(userData),
    });
  }

  toggleStatus() {
    const currentUser = this.user();
    if (!currentUser) return;
    
    this.isUpdating.set(true);
    this.updateError.set(null);
    this.successMessage.set(null);
    
    const newStatus = !currentUser.enabled;

    this.userService.toggleUserStatus(currentUser.id, newStatus).pipe(
      finalize(() => this.isUpdating.set(false))
    ).subscribe({
      next: (updatedUser) => {
        this.user.set(updatedUser);
        this.successMessage.set(`User has been successfully ${newStatus ? 'activated' : 'deactivated'}.`);
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (err) => {
        this.updateError.set('Failed to update user status. Please try again.');
        setTimeout(() => this.updateError.set(null), 3000);
      }
    });
  }
}