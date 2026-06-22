import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-portal',
  standalone: true,
  templateUrl: './portal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule],
})
export class PortalComponent {
  currentYear = new Date().getFullYear();
}