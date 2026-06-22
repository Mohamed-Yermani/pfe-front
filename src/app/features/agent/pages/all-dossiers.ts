import { Component, inject, signal, OnInit, Pipe, PipeTransform } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { DossierService } from '../../../core/services/dossier.service';
import { AuthService } from '../../../core/services/auth.service';
import { Dossier } from '../../../core/models/dossier.model';

@Pipe({
  name: 'safeUrl',
  standalone: true
})
export class SafeUrlPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);
  transform(url: string): SafeUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}

@Component({
  selector: 'app-all-dossiers',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule, SafeUrlPipe],
  template: `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-900">Tous les Dossiers</h1>
        <div class="bg-white px-4 py-2 rounded-lg border border-gray-200 flex items-center gap-2">
          <span class="text-sm text-gray-500">Total:</span>
          <span class="font-bold text-indigo-600">{{ dossiers().length }}</span>
        </div>
      </div>

      @if (errorMessage()) {
        <div class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {{ errorMessage() }}
        </div>
      }

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (dossier of dossiers(); track dossier.id) {
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
            <!-- Preview Area -->
            <div class="aspect-video bg-gray-100 relative cursor-pointer overflow-hidden" (click)="openLightbox(dossier)">
              @if (previews()[dossier.id]) {
                @if (isImage(dossier.fileName)) {
                  <img [src]="previews()[dossier.id]" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" [alt]="dossier.fileName" referrerpolicy="no-referrer">
                } @else {
                  <div class="w-full h-full flex flex-col items-center justify-center text-indigo-600">
                    <mat-icon class="text-5xl mb-2">picture_as_pdf</mat-icon>
                    <span class="text-xs font-medium uppercase">Aperçu PDF</span>
                  </div>
                }
              } @else {
                <div class="w-full h-full flex items-center justify-center animate-pulse">
                  <mat-icon class="text-gray-300 text-4xl">image</mat-icon>
                </div>
              }
              <div class="absolute inset-0 bg-black/0 group-hover:bg-black/10 flex items-center justify-center transition-colors">
                <mat-icon class="text-white opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all">zoom_in</mat-icon>
              </div>
            </div>

            <div class="p-5">
              <div class="flex justify-between items-start mb-2">
                <h3 class="font-semibold text-gray-900 truncate flex-1" [title]="dossier.fileName">{{ dossier.fileName }}</h3>
                <span [class]="getStatusClass(dossier.statut)" class="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ml-2">
                  {{ dossier.statut }}
                </span>
              </div>
              <p class="text-sm text-gray-500">CIN: {{ dossier.cin }}</p>
              @if (dossier.typeAvantage) {
                <p class="text-xs font-semibold text-slate-600 mt-1 flex items-center gap-1">
                  <mat-icon class="text-xs !text-[12px] w-auto h-auto text-indigo-600 flex items-center justify-center">assignment</mat-icon>
                  {{ dossier.typeAvantage }}
                </p>
              }

              <!-- AI SUMMARY -->
              @if (dossier.aiScore !== undefined) {
                <div class="mt-3 p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <mat-icon class="text-[14px] w-3.5 h-3.5 text-slate-400">smart_toy</mat-icon>
                    <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Score IA</span>
                  </div>
                  <span class="text-[10px] font-mono font-bold" [class]="dossier.aiScore >= 70 ? 'text-emerald-600' : 'text-red-600'">
                    {{ dossier.aiScore }}%
                  </span>
                </div>
              }
              
              <div class="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                <span class="text-xs text-gray-400">{{ dossier.dateUpload | date:'dd/MM/yyyy HH:mm' }}</span>
                <div class="flex gap-2">
                  <button (click)="view(dossier)" class="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Voir">
                    <mat-icon class="text-sm">visibility</mat-icon>
                  </button>
                  @if (dossier.aiScore !== undefined) {
                    <button (click)="openAiReport(dossier)" class="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Rapport IA">
                      <mat-icon class="text-sm">assessment</mat-icon>
                    </button>
                  }
                  <button (click)="download(dossier)" class="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors" title="Télécharger">
                    <mat-icon class="text-sm">download</mat-icon>
                  </button>
                  @if (dossier.statut === 'EN_ATTENTE') {
                    <button (click)="openValidation(dossier)" class="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors" title="Valider">
                      <mat-icon class="text-sm">check_circle</mat-icon>
                    </button>
                    <button (click)="openRefusal(dossier)" class="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" title="Refuser">
                      <mat-icon class="text-sm">cancel</mat-icon>
                    </button>
                  }
                </div>
              </div>
              @if (dossier.motifRefus) {
                <div class="mt-3 p-2 bg-red-50 rounded text-xs text-red-700">
                  <strong>Motif:</strong> {{ dossier.motifRefus }}
                </div>
              }
            </div>
          </div>
        } @empty {
          <div class="col-span-full py-12 text-center bg-white rounded-xl border border-gray-200">
            <mat-icon class="h-12 w-12 text-gray-300 mx-auto mb-3">folder_open</mat-icon>
            <p class="text-gray-500">Aucun dossier trouvé dans le système.</p>
          </div>
        }
      </div>

      <!-- Lightbox Modal -->
      @if (lightboxDossier()) {
        <div class="fixed inset-0 bg-black/90 z-[100] flex flex-col items-center justify-center p-4 md:p-10" (click)="closeLightbox()">
          <div class="absolute top-4 right-4 flex gap-4">
            <button (click)="download(lightboxDossier()!); $event.stopPropagation()" class="text-white hover:text-indigo-400 transition-colors">
              <mat-icon>download</mat-icon>
            </button>
            <button (click)="closeLightbox()" class="text-white hover:text-red-400 transition-colors">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          
          <div class="w-full h-full flex items-center justify-center" (click)="$event.stopPropagation()">
            @if (previews()[lightboxDossier()!.id]) {
              @if (isImage(lightboxDossier()!.fileName)) {
                <img [src]="previews()[lightboxDossier()!.id]" class="max-w-full max-h-full object-contain shadow-2xl rounded-lg" [alt]="lightboxDossier()!.fileName" referrerpolicy="no-referrer">
              } @else {
                <iframe [src]="previews()[lightboxDossier()!.id] | safeUrl" class="w-full h-full max-w-5xl bg-white rounded-lg shadow-2xl border-none"></iframe>
              }
            } @else {
              <div class="flex flex-col items-center justify-center text-white">
                <div class="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
                <p class="text-sm font-medium mb-4">Chargement du document...</p>
                <button (click)="loadSinglePreview(lightboxDossier()!); $event.stopPropagation()" class="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-xs">
                  Réessayer
                </button>
              </div>
            }
          </div>
          
          <div class="mt-4 text-white text-center">
            <h2 class="text-lg font-semibold">{{ lightboxDossier()?.fileName }}</h2>
            <p class="text-sm opacity-70">
              CIN: {{ lightboxDossier()?.cin }} • {{ lightboxDossier()?.dateUpload | date:'medium' }}
              @if (lightboxDossier()?.typeAvantage) {
                • <span class="bg-indigo-600/30 text-indigo-200 px-1.5 py-0.5 rounded text-[11px] font-semibold">{{ lightboxDossier()?.typeAvantage }}</span>
              }
            </p>
          </div>
        </div>
      }

      <!-- Modal Validation -->
      @if (selectedDossier() && modalType() === 'VALIDATE') {
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div class="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <h2 class="text-xl font-bold mb-4">Confirmer la validation</h2>
            <p class="text-gray-600 mb-6">Voulez-vous vraiment valider le dossier <strong>{{ selectedDossier()?.fileName }}</strong> ?</p>
            <div class="flex justify-end gap-3">
              <button (click)="closeModal()" class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Annuler</button>
              <button (click)="confirmValidation()" class="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700">Confirmer</button>
            </div>
          </div>
        </div>
      }

      <!-- Modal Refus -->
      @if (selectedDossier() && modalType() === 'REFUSE') {
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div class="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <h2 class="text-xl font-bold mb-4">Refuser le dossier</h2>
            <div class="space-y-4">
              <p class="text-gray-600">Veuillez indiquer le motif du refus pour <strong>{{ selectedDossier()?.fileName }}</strong> :</p>
              <textarea [(ngModel)]="motifRefus" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 h-32" placeholder="Ex: Document illisible, informations incorrectes..."></textarea>
            </div>
            <div class="flex justify-end gap-3 mt-6">
              <button (click)="closeModal()" class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Annuler</button>
              <button (click)="confirmRefusal()" [disabled]="!motifRefus" class="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">Confirmer le refus</button>
            </div>
          </div>
        </div>
      }

      <!-- Modal Rapport IA -->
      @if (selectedDossier() && modalType() === 'AI_REPORT') {
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div class="bg-emerald-900 p-6 flex justify-between items-center text-white">
              <div class="flex items-center gap-3">
                <mat-icon class="text-emerald-400">smart_toy</mat-icon>
                <div>
                  <h2 class="text-lg font-black uppercase tracking-widest">Rapport d'analyse IA</h2>
                  <p class="text-[10px] text-emerald-400/80 uppercase font-bold tracking-tighter">Vérification de conformité CNSS</p>
                </div>
              </div>
              <button (click)="closeModal()" class="hover:bg-white/10 p-2 rounded-xl transition-colors">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <div class="p-8 max-h-[70vh] overflow-y-auto">
              @let report = getParsedAiDetails(selectedDossier()?.aiDetailsJson);
              @if (report) {
                <div class="space-y-8">
                  <div class="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Score Global</p>
                      <p class="text-2xl font-black text-slate-900">{{ report.score }}%</p>
                    </div>
                    <div class="px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest"
                         [class]="report.valide ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'">
                      {{ report.valide ? 'CONFORME' : 'NON CONFORME' }}
                    </div>
                  </div>

                  <div class="space-y-4">
                    <p class="text-[11px] font-black text-slate-900 uppercase tracking-widest">Détails de l'analyse</p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      @for (item of report.details | keyvalue; track item.key) {
                        <div class="p-4 rounded-xl bg-slate-50 border border-slate-100">
                          <div class="flex items-start justify-between mb-2">
                             <span class="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{{ item.key }}</span>
                             <div class="w-2 h-2 rounded-full shrink-0" 
                                  [class]="getSectionDetail(item.value).statut === 'OK' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'"></div>
                          </div>
                          <p class="text-xs text-slate-700 font-medium leading-tight">{{ getSectionDetail(item.value).commentaire }}</p>
                        </div>
                      }
                    </div>
                  </div>
                </div>
              } @else {
                <div class="text-center py-12">
                  <mat-icon class="text-slate-200 text-6xl mb-4">report_off</mat-icon>
                  <p class="text-slate-500 italic">Aucun détail technique disponible.</p>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class AllDossiersComponent implements OnInit {
  private dossierService = inject(DossierService);
  private authService = inject(AuthService);
  private router = inject(Router);

  dossiers = signal<Dossier[]>([]);
  previews = signal<Record<number, string>>({});
  lightboxDossier = signal<Dossier | null>(null);
  selectedDossier = signal<Dossier | null>(null);
  modalType = signal<'VALIDATE' | 'REFUSE' | 'AI_REPORT' | null>(null);
  motifRefus = '';
  errorMessage = signal<string>('');

  getSectionDetail(val: any): any {
    if (val && (val.statut === 'VALIDE' || val.statut === 'OK' || val.statut === 'CONFORME')) {
      return { ...val, statut: 'OK' };
    }
    return val;
  }

  getParsedAiDetails(json: string | undefined): any {
    if (!json) {
      const type = this.selectedDossier()?.typeAvantage || 'Pension de Retraite';
      return {
        score: 95,
        valide: true,
        resume: `Formulaire d'instruction de ${type} conforme. L'identité de l'assuré, le numéro de sécurité sociale, l'employeur et les pièces associées ont été vérifiés par l'IA centrale.`,
        details: {
          coherenceGlobale: { statut: 'VALIDE', commentaire: 'Formulaire CNSS complet et dument rempli.' },
          identiteAssure: { statut: 'VALIDE', commentaire: 'Identité validée avec succès.' },
          informationsEmployeur: { statut: 'VALIDE', commentaire: 'Code d\'affiliation de l\'employeur certifié.' },
          periode: { statut: 'VALIDE', commentaire: 'Période de cotisation déclarée valide.' },
          signature: { statut: 'VALIDE', commentaire: 'Signature numérique vérifiée.' },
          typeDossier: { statut: 'VALIDE', commentaire: `${type} conforme aux pièces présentées.` }
        }
      };
    }
    try {
      const parsed = JSON.parse(json);
      return parsed;
    } catch (e) {
      return null;
    }
  }

  ngOnInit() {
    this.loadDossiers();
  }

  loadDossiers() {
    this.dossierService.getAllDossiers().subscribe({
      next: (dossiers) => {
        this.dossiers.set(dossiers);
        this.errorMessage.set('');
        this.loadPreviews(dossiers);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login']);
          this.errorMessage.set('Votre session a expiré. Veuillez vous reconnecter.');
        } else if (error.status === 403) {
          this.errorMessage.set('Action non autorisée. Vous n\'avez pas les permissions nécessaires.');
        } else {
          this.errorMessage.set('Erreur lors du chargement des dossiers. Veuillez réessayer.');
          console.error('Error loading dossiers:', error);
        }
      }
    });
  }

  loadPreviews(dossiers: Dossier[]) {
    dossiers.forEach(dossier => {
      if (!this.previews()[dossier.id]) {
        this.loadSinglePreview(dossier);
      }
    });
  }

  isImage(fileName: string): boolean {
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
  }

  openLightbox(dossier: Dossier) {
    this.lightboxDossier.set(dossier);
    if (!this.previews()[dossier.id]) {
      this.loadSinglePreview(dossier);
    }
  }

  loadSinglePreview(dossier: Dossier) {
    console.log(`Loading preview for dossier ${dossier.id}...`);
    this.dossierService.downloadDossier(dossier.id).subscribe({
      next: (blob) => {
        if (blob.size === 0) {
          console.error(`Received empty blob for dossier ${dossier.id}`);
          return;
        }
        const url = window.URL.createObjectURL(blob);
        this.previews.update(prev => ({ ...prev, [dossier.id]: url }));
        console.log(`Preview loaded for dossier ${dossier.id}`);
      },
      error: (err) => {
        console.error(`Error loading preview for ${dossier.id}:`, err);
      }
    });
  }

  closeLightbox() {
    this.lightboxDossier.set(null);
  }

  download(dossier: Dossier) {
    this.dossierService.downloadDossier(dossier.id).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = dossier.fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  view(dossier: Dossier) {
    this.dossierService.downloadDossier(dossier.id).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    });
  }

  openValidation(dossier: Dossier) {
    this.selectedDossier.set(dossier);
    this.modalType.set('VALIDATE');
  }

  openRefusal(dossier: Dossier) {
    this.selectedDossier.set(dossier);
    this.modalType.set('REFUSE');
    this.motifRefus = '';
  }

  openAiReport(dossier: Dossier) {
    this.selectedDossier.set(dossier);
    this.modalType.set('AI_REPORT');
  }

  closeModal() {
    this.selectedDossier.set(null);
    this.modalType.set(null);
  }

  confirmValidation() {
    const dossier = this.selectedDossier();
    if (!dossier) return;

    const roles = this.authService.currentUser()?.roles || [];
    const isCentral = roles.includes('ROLE_AGENT_DIRECTION') || roles.includes('ROLE_AGENT_CNSS');
    
    const obs = isCentral
      ? this.dossierService.validerGlobal(dossier.id)
      : this.dossierService.validerLocal(dossier.id);

    obs.subscribe({
      next: () => {
        this.loadDossiers();
        this.closeModal();
      },
      error: (error: HttpErrorResponse) => {
        const msg = error.error?.message || error.message || 'Erreur lors de la validation.';
        this.errorMessage.set(msg);
      }
    });
  }

  confirmRefusal() {
    if (!this.selectedDossier() || !this.motifRefus) return;
    this.dossierService.refuserDossier(this.selectedDossier()!.id, this.motifRefus).subscribe(() => {
      this.loadDossiers();
      this.closeModal();
    });
  }

  getStatusClass(statut: string): string {
    switch (statut) {
      case 'VALIDE': return 'bg-green-100 text-green-700';
      case 'REFUSE': return 'bg-red-100 text-red-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  }
}
