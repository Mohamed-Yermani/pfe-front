import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="flex flex-col min-h-screen bg-slate-50">
       <main class="flex-grow">
          <router-outlet></router-outlet>
       </main>
    </div>
  `
})
export class AuthLayoutComponent {}
