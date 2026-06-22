
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserService } from '../../../../core/services/user.service';
import { inject } from '@angular/core';
import { User } from '../../../../core/models/user.model';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserManagementComponent {
  userService = inject(UserService);
  users = toSignal(this.userService.getUsers(), { initialValue: [] as User[] });
}