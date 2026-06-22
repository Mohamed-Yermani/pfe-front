import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { DossierService } from '../../../core/services/dossier.service';
import { DossierStatistics } from '../../../core/models/dossier.model';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule, ReactiveFormsModule],
  template: `
    <div class="space-y-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Tableau de Bord</h1>
        <p class="text-gray-500">Aperçu global de l'activité CNSS et monitoring temps réel</p>
      </div>

      <!-- Statistiques Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div class="flex items-center justify-between mb-4">
            <div class="p-2 bg-indigo-50 rounded-lg">
              <mat-icon class="text-indigo-600">folder</mat-icon>
            </div>
            <span class="text-xs font-medium text-gray-400">Total</span>
          </div>
          <div class="text-2xl font-bold text-gray-900">{{ stats()?.total || 0 }}</div>
          <div class="text-sm text-gray-500 mt-1">Dossiers déposés</div>
        </div>

        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div class="flex items-center justify-between mb-4">
            <div class="p-2 bg-yellow-50 rounded-lg">
              <mat-icon class="text-yellow-600">pending_actions</mat-icon>
            </div>
            <span class="text-xs font-medium text-gray-400">En attente</span>
          </div>
          <div class="text-2xl font-bold text-gray-900">{{ stats()?.enAttente || 0 }}</div>
          <div class="text-sm text-gray-500 mt-1">À valider</div>
        </div>

        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div class="flex items-center justify-between mb-4">
            <div class="p-2 bg-blue-50 rounded-lg">
              <mat-icon class="text-blue-600">fact_check</mat-icon>
            </div>
            <span class="text-xs font-medium text-gray-400">Val. Locale</span>
          </div>
          <div class="text-2xl font-bold text-gray-900">{{ stats()?.validationLocale || 0 }}</div>
          <div class="text-sm text-gray-500 mt-1">Étape 2</div>
        </div>

        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div class="flex items-center justify-between mb-4">
            <div class="p-2 bg-green-50 rounded-lg">
              <mat-icon class="text-green-600">check_circle</mat-icon>
            </div>
            <span class="text-xs font-medium text-gray-400">Validés</span>
          </div>
          <div class="text-2xl font-bold text-gray-900">{{ stats()?.valides || 0 }}</div>
          <div class="text-sm text-gray-500 mt-1">Acceptés</div>
        </div>

        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div class="flex items-center justify-between mb-4">
            <div class="p-2 bg-red-50 rounded-lg">
              <mat-icon class="text-red-600">cancel</mat-icon>
            </div>
            <span class="text-xs font-medium text-gray-400">Refusés</span>
          </div>
          <div class="text-2xl font-bold text-gray-900">{{ stats()?.refuses || 0 }}</div>
          <div class="text-sm text-gray-500 mt-1">Rejetés</div>
        </div>

        <div class="bg-indigo-600 p-6 rounded-xl shadow-md border border-indigo-500 text-white">
          <div class="flex items-center justify-between mb-4">
            <div class="p-2 bg-white/10 rounded-lg">
              <mat-icon class="text-white">smart_toy</mat-icon>
            </div>
            <span class="text-xs font-medium text-indigo-100 uppercase tracking-widest">Performance IA</span>
          </div>
          <div class="text-2xl font-black">{{ stats()?.avgAiScore || 0 }}%</div>
          <div class="text-sm text-indigo-100 mt-1">Score de conformité moyen</div>
        </div>
      </div>

      <!-- SECTION: DIAGNOSTIC WEBSOCKET & TESTEUR DE NOTIFICATION -->
      <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between border-b border-gray-100 pb-6 mb-8 gap-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="relative flex h-3 w-3">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <h2 class="text-xl font-bold text-slate-900">Console de Diagnostic & Notification Temps Réel</h2>
            </div>
            <p class="text-slate-500 text-sm mt-1">Monitorez le statut WebSocket du contrôleur Spring Boot et testez des relances</p>
          </div>
          <div class="flex items-center gap-2">
            <button (click)="loadStatus()" [disabled]="statusLoading()" class="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:border-indigo-200 hover:bg-slate-50 rounded-xl text-sm font-semibold transition-all">
              <mat-icon [class.animate-spin]="statusLoading()" class="text-slate-500">refresh</mat-icon>
              Actualiser le statut
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <!-- Infos Websocket Status -->
          <div class="lg:col-span-5 bg-slate-50 p-6 rounded-2xl border border-slate-100/80 space-y-4">
            <h3 class="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">Etat du WebSocket</h3>
            
            @if (statusData()) {
              <div class="space-y-4">
                <div class="flex items-start justify-between">
                  <span class="text-sm text-slate-500">Statut:</span>
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
                    {{ statusData()?.status }}
                  </span>
                </div>

                <div class="space-y-1">
                  <span class="text-xs text-slate-400 block font-medium">Point d'accès (Endpoint)</span>
                  <div class="p-3 bg-white rounded-xl border border-slate-100 font-mono text-xs text-slate-600 break-all flex items-center justify-between">
                    <span>{{ statusData()?.endpoint }}</span>
                    <mat-icon class="text-slate-400 text-base h-4 w-4">lan</mat-icon>
                  </div>
                </div>

                <div class="space-y-1">
                  <span class="text-xs text-slate-400 block font-medium">Topic de message (Topic)</span>
                  <div class="p-3 bg-white rounded-xl border border-slate-100 font-mono text-xs text-slate-600 break-all flex items-center justify-between">
                    <span>{{ statusData()?.topics ? statusData()?.topics?.join(', ') : statusData()?.topic }}</span>
                    <mat-icon class="text-slate-400 text-base h-4 w-4">rss_feed</mat-icon>
                  </div>
                </div>

                <div class="pt-2">
                  <span class="text-xs text-slate-500 italic block">
                    * Toutes les notifications de changement de dossier ou de validation de pièce sont instantanément expédiées sur ce canal STOMP.
                  </span>
                </div>
              </div>
            } @else {
              <div class="flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl border border-dashed border-slate-200">
                <mat-icon class="text-slate-300 transform scale-125 mb-2">cloud_off</mat-icon>
                <p class="text-sm text-slate-400">Aucune donnée de statut récupérée</p>
              </div>
            }
          </div>

          <!-- Formulaire Envoi notification test -->
          <div class="lg:col-span-7 space-y-4">
            <h3 class="text-sm font-bold uppercase tracking-wider text-slate-400">Tester l'envoi de notification</h3>
            <p class="text-xs text-slate-500">
              Saisissez l'email d'un utilisateur / agent et envoyez un message test. Il recevra la notification instantanément s'il est connecté par WebSocket.
            </p>

            <form [formGroup]="testForm" (ngSubmit)="sendTest()" class="space-y-4 bg-white/50">
              <div>
                <label for="email" class="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Email du destinataire *</label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                    <mat-icon class="text-slate-400 text-lg">alternate_email</mat-icon>
                  </span>
                  <input type="email" id="email" formControlName="email" placeholder="Ex: mohamedyermani5@gmail.com ou agent@cnss.tn" class="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all">
                </div>
                @if (testForm.get('email')?.invalid && testForm.get('email')?.touched) {
                  <span class="text-xs text-red-500 mt-1 block">Veuillez entrer une adresse email valide</span>
                }
              </div>

              <div>
                <label for="message" class="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Message de la notification *</label>
                <div class="relative">
                  <span class="absolute top-3 left-0 flex items-start pl-3.5 pointer-events-none">
                    <mat-icon class="text-slate-400 text-lg">chat_bubble_outline</mat-icon>
                  </span>
                  <textarea id="message" formControlName="message" rows="3" placeholder="Saisissez le texte du message de test..." class="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all resize-none"></textarea>
                </div>
                @if (testForm.get('message')?.invalid && testForm.get('message')?.touched) {
                  <span class="text-xs text-red-500 mt-1 block">Veuillez spécifier un message pour le test</span>
                }
              </div>

              <!-- Messages de retours -->
              @if (testResult()) {
                <div class="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2.5 text-emerald-800 text-sm">
                  <mat-icon class="text-emerald-600">check_circle_outline</mat-icon>
                  <p class="font-medium">{{ testResult() }}</p>
                </div>
              }
              @if (testError()) {
                <div class="p-3.5 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2.5 text-red-800 text-sm">
                  <mat-icon class="text-red-600">error_outline</mat-icon>
                  <p class="font-medium">{{ testError() }}</p>
                </div>
              }

              <!-- Bouton d'envoi -->
              <div class="flex justify-end pt-2">
                <button type="submit" [disabled]="testForm.invalid || testLoading()" class="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl shadow-sm transition-all">
                  @if (testLoading()) {
                    <mat-icon class="animate-spin text-white">sync</mat-icon>
                    Envoi en cours...
                  } @else {
                    <mat-icon class="text-white">send</mat-icon>
                    Envoyer Test
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Graphiques et Actions Rapides -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 class="text-lg font-semibold mb-4">Répartition des Statuts</h2>
          <div class="h-64 flex items-center justify-center">
            <div class="flex flex-col items-center gap-4">
              <div class="flex gap-2 items-end h-32">
                <div [style.height.%]="getPercentage('enAttente')" class="w-12 bg-yellow-400 rounded-t-lg" title="En attente"></div>
                <div [style.height.%]="getPercentage('validationLocale')" class="w-12 bg-blue-400 rounded-t-lg" title="Val. Locale"></div>
                <div [style.height.%]="getPercentage('valides')" class="w-12 bg-green-400 rounded-t-lg" title="Validés"></div>
                <div [style.height.%]="getPercentage('refuses')" class="w-12 bg-red-400 rounded-t-lg" title="Refusés"></div>
              </div>
              <div class="flex gap-4 text-xs text-gray-500">
                <div class="flex items-center gap-1"><span class="w-3 h-3 bg-yellow-400 rounded-full"></span> Attente</div>
                <div class="flex items-center gap-1"><span class="w-3 h-3 bg-blue-400 rounded-full"></span> Locale</div>
                <div class="flex items-center gap-1"><span class="w-3 h-3 bg-green-400 rounded-full"></span> Validés</div>
                <div class="flex items-center gap-1"><span class="w-3 h-3 bg-red-400 rounded-full"></span> Refusés</div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 class="text-lg font-semibold mb-4">Actions Rapides</h2>
          <div class="grid grid-cols-2 gap-4">
            <button class="p-4 border border-gray-100 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 transition-all text-left group">
              <mat-icon class="text-indigo-600 mb-2">person_add</mat-icon>
              <div class="font-medium text-gray-900">Nouvel Agent</div>
              <div class="text-xs text-gray-500">Ajouter un collaborateur</div>
            </button>
            <button class="p-4 border border-gray-100 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 transition-all text-left group">
              <mat-icon class="text-indigo-600 mb-2">assessment</mat-icon>
              <div class="font-medium text-gray-900">Rapport Mensuel</div>
              <div class="text-xs text-gray-500">Exporter les données</div>
            </button>
            <button class="p-4 border border-gray-100 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 transition-all text-left group">
              <mat-icon class="text-indigo-600 mb-2">settings</mat-icon>
              <div class="font-medium text-gray-900">Configuration</div>
              <div class="text-xs text-gray-500">Paramètres système</div>
            </button>
            <button class="p-4 border border-gray-100 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 transition-all text-left group">
              <mat-icon class="text-indigo-600 mb-2">help_outline</mat-icon>
              <div class="font-medium text-gray-900">Support</div>
              <div class="text-xs text-gray-500">Aide et documentation</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  private dossierService = inject(DossierService);
  private notificationService = inject(NotificationService);

  stats = signal<DossierStatistics | null>(null);

  // Formulaire test
  testForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    message: new FormControl('🔔 Envoi manuel de test via le websocket de la CNSS !', [Validators.required])
  });

  statusData = signal<any>(null);
  statusLoading = signal<boolean>(false);
  testLoading = signal<boolean>(false);
  testResult = signal<string | null>(null);
  testError = signal<string | null>(null);

  ngOnInit() {
    this.dossierService.getStatistics().subscribe(stats => {
      this.stats.set(stats);
    });
    this.loadStatus();
  }

  loadStatus() {
    this.statusLoading.set(true);
    this.notificationService.getWebSocketStatus().subscribe({
      next: (data) => {
        this.statusData.set(data);
        this.statusLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur de diagnostic WS:', err);
        this.statusLoading.set(false);
      }
    });
  }

  sendTest() {
    if (this.testForm.invalid) return;
    this.testLoading.set(true);
    this.testResult.set(null);
    this.testError.set(null);

    const email = this.testForm.value.email!;
    const message = this.testForm.value.message!;

    this.notificationService.sendTestNotification(email, message).subscribe({
      next: (res) => {
        this.testResult.set(res.message || `Notification de test lancée avec succès pour ${email}`);
        this.testLoading.set(false);
      },
      error: (err) => {
        const errorMsg = err?.error?.message || "Erreur lors de l'envoi de l'impulsion de test.";
        this.testError.set(errorMsg);
        this.testLoading.set(false);
      }
    });
  }

  getPercentage(type: keyof DossierStatistics): number {
    const stats = this.stats();
    if (!stats || stats.total === 0) return 0;
    const value = stats[type];
    return (typeof value === 'number' ? value : 0) / stats.total * 100;
  }
}
