import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500 font-medium">
      &copy; 2026 Caisse Nationale de Sécurité Sociale (CNSS) — Tous droits réservés.
    </footer>
  `
})
export class FooterComponent {}
