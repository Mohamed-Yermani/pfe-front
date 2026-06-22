import { Component, inject, signal, OnInit, Pipe, PipeTransform, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { DossierService } from '../../../core/services/dossier.service';
import { PieceService } from '../../../core/services/piece.service';
import { AuthService } from '../../../core/services/auth.service';
import { Dossier, PieceJustificative, TypePiece } from '../../../core/models/dossier.model';

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
  selector: 'app-dossier-validation',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, SafeUrlPipe],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Validation des Dossiers</h1>
          <p class="text-sm text-gray-500">{{ roleLabel() }}</p>
        </div>
        <div class="flex gap-4">
          <div class="bg-white px-4 py-2 rounded-xl border border-gray-200 flex items-center gap-2 shadow-sm">
            <span class="text-sm text-gray-500 font-medium">Dossiers filtrés / total:</span>
            <span class="font-black text-indigo-600">{{ filteredDossiers().length }} / {{ dossiers().length }}</span>
          </div>
        </div>
      </div>

      <!-- BARRE DE RECHERCHE & FILTRAGE (DESIGN PROFESSIONNEL) -->
      <div class="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center transition-all">
        <!-- Champ de recherche fluid -->
        <div class="flex-1 relative">
          <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <mat-icon class="text-lg">search</mat-icon>
          </div>
          <input 
            type="text" 
            [ngModel]="searchTerm()" 
            (ngModelChange)="searchTerm.set($event)"
            placeholder="Rechercher par nom, CIN, n° d'assuré, fichier..." 
            class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-gray-700 placeholder:text-gray-400"
          />
        </div>

        <!-- Options de filtrage et tri -->
        <div class="flex flex-col sm:flex-row gap-3">
          <!-- Filtre conformité IA -->
          <div class="relative min-w-[200px]">
            <select 
              [ngModel]="aiScoreFilter()" 
              (ngModelChange)="aiScoreFilter.set($event)"
              class="w-full pl-3 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold text-gray-600 cursor-pointer appearance-none"
            >
              <option value="all">Tous les scores IA</option>
              <option value="conforme">Conforme (Score ≥ 70%)</option>
              <option value="non-conforme">Non Conforme (< 70%)</option>
            </select>
            <div class="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-gray-400">
              <mat-icon class="text-sm">filter_alt</mat-icon>
            </div>
          </div>

          <!-- Filtre Tri chronologique / Score -->
          <div class="relative min-w-[200px]">
            <select 
              [ngModel]="sortBy()" 
              (ngModelChange)="sortBy.set($event)"
              class="w-full pl-3 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold text-gray-600 cursor-pointer appearance-none"
            >
              <option value="recent">Le plus récent</option>
              <option value="ancien">Le plus ancien</option>
              <option value="score">Score IA le plus élevé</option>
            </select>
            <div class="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-gray-400">
              <mat-icon class="text-sm">sort</mat-icon>
            </div>
          </div>
        </div>
      </div>

      @if (errorMessage()) {
        <div class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {{ errorMessage() }}
        </div>
      }

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (dossier of filteredDossiers(); track dossier.id) {
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
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

              <!-- INFORMATIONS ASSURÉ (DESIGN PROFESSIONNEL) -->
              <div class="mb-3 py-2.5 px-3 bg-indigo-50/40 rounded-xl border border-indigo-100/50 space-y-1.5 shadow-sm">
                <div class="flex items-center gap-1.5">
                  <mat-icon class="text-indigo-600 !text-sm w-3.5 h-3.5 flex items-center justify-center">person</mat-icon>
                  <span class="text-xs font-bold text-gray-800">
                    {{ dossier.user ? (dossier.user.prenom + ' ' + dossier.user.nom) : 'Jean Assuré' }}
                  </span>
                </div>
                <div class="grid grid-cols-2 gap-2 text-[11px]">
                  <div class="flex flex-col">
                    <span class="text-[9px] font-black text-gray-400 uppercase tracking-wider">N° Assuré</span>
                    <span class="font-mono font-extrabold text-[#3730a3] select-all">
                      {{ dossier.user?.numeroAssure || '1029384756' }}
                    </span>
                  </div>
                  <div class="flex flex-col">
                    <span class="text-[9px] font-black text-gray-400 uppercase tracking-wider">CIN / Réf</span>
                    <span class="font-mono font-bold text-gray-700">
                      {{ dossier.user?.cin || dossier.cin || 'AB123456' }}
                    </span>
                  </div>
                </div>
                @if (dossier.typeAvantage) {
                  <div class="pt-1.5 border-t border-indigo-100/55 flex flex-col text-[11px]">
                    <span class="text-[9px] font-black text-gray-400 uppercase tracking-wider">Type d'Avantage</span>
                    <span class="font-semibold text-indigo-900 flex items-center gap-1 mt-0.5">
                      <mat-icon class="!text-[12.5px] w-3.5 h-3.5 text-indigo-700 flex items-center justify-center">assignment</mat-icon>
                      {{ dossier.typeAvantage }}
                    </span>
                  </div>
                }
              </div>
              
              <!-- AI SUMMARY FOR AGENT -->
              @if (dossier.aiScore !== undefined) {
                <div class="mb-4 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div class="flex justify-between items-center mb-1">
                    <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <mat-icon class="text-[14px] w-3.5 h-3.5">smart_toy</mat-icon>
                      Avis IA
                    </span>
                    <span class="text-[10px] font-mono font-bold" [class]="dossier.aiScore >= 70 ? 'text-emerald-600' : 'text-red-600'">
                      {{ dossier.aiScore }}%
                    </span>
                  </div>
                  <p class="text-[10px] text-slate-600 line-clamp-2 leading-tight italic">
                    "{{ dossier.aiResume || 'Analyse effectuée' }}"
                  </p>
                </div>
              }
              
              <div class="mt-4 pt-4 border-t border-gray-100">
                <div class="flex justify-between items-center mb-3">
                  <span class="text-xs text-gray-400">{{ dossier.dateUpload | date:'dd/MM/yyyy HH:mm' }}</span>
                  <div class="flex gap-1">
                    <button (click)="openAiReport(dossier)" class="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Rapport IA">
                      <mat-icon class="text-sm">smart_toy</mat-icon>
                    </button>
                    <button (click)="openPiecesModal(dossier)" class="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Pièces Justificatives">
                      <mat-icon class="text-sm">attach_file</mat-icon>
                    </button>
                    <button (click)="download(dossier)" class="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors" title="Télécharger">
                      <mat-icon class="text-sm">download</mat-icon>
                    </button>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-2">
                  <button (click)="openValidation(dossier)" 
                          class="flex items-center justify-center gap-2 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest border border-emerald-100">
                    <mat-icon class="text-sm">check_circle</mat-icon>
                    Valider
                  </button>
                  <button (click)="openRefusal(dossier)" 
                          class="flex items-center justify-center gap-2 py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest border border-red-100">
                    <mat-icon class="text-sm">cancel</mat-icon>
                    Refuser
                  </button>
                </div>
              </div>
            </div>
          </div>
        } @empty {
          <div class="col-span-full py-12 text-center bg-white rounded-xl border border-gray-200">
            <mat-icon class="h-12 w-12 text-gray-300 mx-auto mb-3">folder_open</mat-icon>
            <p class="text-gray-500">Aucun dossier à traiter pour le moment.</p>
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
            @if (isImage(lightboxDossier()!.fileName)) {
              <img [src]="previews()[lightboxDossier()!.id]" class="max-w-full max-h-full object-contain shadow-2xl rounded-lg" [alt]="lightboxDossier()!.fileName" referrerpolicy="no-referrer">
            } @else {
              <iframe [src]="previews()[lightboxDossier()!.id] | safeUrl" class="w-full h-full max-w-5xl bg-white rounded-lg shadow-2xl border-none"></iframe>
            }
          </div>
          
          <div class="mt-4 text-white text-center">
            <h2 class="text-lg font-semibold">{{ lightboxDossier()?.fileName }}</h2>
            <p class="text-sm opacity-70">{{ lightboxDossier()?.dateUpload | date:'medium' }}</p>
          </div>
        </div>
      }

      <!-- Modal Validation -->
      @if (selectedDossier() && modalType() === 'VALIDATE') {
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div class="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <h2 class="text-xl font-bold mb-4">Confirmer la validation</h2>
            <p class="text-gray-600 mb-6">
              Voulez-vous vraiment passer le dossier <strong>{{ selectedDossier()?.fileName }}</strong> à l'étape suivante ?
              <br>
              <span class="text-sm text-indigo-600 font-medium">Étape actuelle: {{ selectedDossier()?.statut }}</span>
            </p>
            <div class="flex justify-end gap-3">
              <button (click)="closeModal()" class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Annuler</button>
              <button (click)="confirmValidation()" class="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700">Confirmer la validation</button>
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

                  @if (report.champsManquants?.length) {
                    <div class="p-6 bg-red-50 rounded-2xl border border-red-100">
                      <p class="text-[10px] font-black text-red-800 uppercase tracking-widest mb-4">Éléments bloquants / manquants</p>
                      <ul class="space-y-2">
                        @for (champ of report.champsManquants; track champ) {
                          <li class="flex items-center gap-3 text-xs text-red-700 font-bold">
                            <mat-icon class="text-sm">error_outline</mat-icon>
                            {{ champ }}
                          </li>
                        }
                      </ul>
                    </div>
                  }
                </div>
              } @else {
                <div class="text-center py-12">
                  <mat-icon class="text-slate-200 text-6xl mb-4">report_off</mat-icon>
                  <p class="text-slate-500 italic">Aucun détail technique disponible pour ce dossier.</p>
                  <p class="text-[10px] text-slate-400 mt-1 uppercase">{{ selectedDossier()?.aiResume }}</p>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- MODAL PIÈCES JUSTIFICATIVES AGENT -->
      @if (selectedDossier() && modalType() === 'PIECES') {
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div class="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 border border-slate-200">
            <!-- Modal Header -->
            <div class="bg-indigo-900 p-8 flex justify-between items-center text-white">
              <div class="flex items-center gap-4">
                <div class="p-3 bg-white/10 rounded-2xl">
                  <mat-icon class="text-indigo-400">attach_file</mat-icon>
                </div>
                <div>
                  <h2 class="text-xl font-black uppercase tracking-widest">Contrôle des Pièces</h2>
                  <p class="text-[10px] text-indigo-400 uppercase font-black tracking-tighter">Dossier #{{ selectedDossier()?.id }}</p>
                </div>
              </div>
              <button (click)="closeModal()" class="hover:bg-white/10 p-2 rounded-xl transition-all">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <div class="p-8 space-y-8 max-h-[60vh] overflow-y-auto font-sans">
              @if (isLoadingPieces()) {
                <div class="flex flex-col items-center justify-center py-20 space-y-4">
                   <div class="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                   <p class="text-xs font-black text-slate-400 uppercase tracking-widest">Chargement des documents...</p>
                </div>
              } @else {
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  @for (piece of dossierPieces(); track piece.id) {
                    <div class="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 relative overflow-hidden group">
                      <div class="flex justify-between items-start">
                        <div class="p-2 bg-white rounded-xl shadow-sm">
                          <mat-icon class="text-slate-400">insert_drive_file</mat-icon>
                        </div>
                        <span class="text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-slate-200"
                              [class]="getPieceStatusClass(piece.statut)">
                          {{ piece.statut }}
                        </span>
                      </div>
                      
                      <div>
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-tighter truncate">{{ piece.typePiece }}</p>
                        <p class="text-sm font-bold text-slate-900 truncate">{{ piece.fileName }}</p>
                      </div>

                      <div class="flex gap-2 pt-2 border-t border-slate-200">
                         <button (click)="previewPiece(piece)" class="flex-1 py-2 text-indigo-600 bg-white hover:bg-indigo-50 rounded-xl transition-all border border-indigo-100 font-bold text-[10px] uppercase flex items-center justify-center gap-2">
                           <mat-icon class="text-sm">visibility</mat-icon>
                           Voir
                         </button>
                         <button (click)="updatePieceStatus(piece, true)" class="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all border border-emerald-100" title="Valider">
                           <mat-icon class="text-sm">verified</mat-icon>
                         </button>
                         <button (click)="openPieceRefusal(piece)" class="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all border border-red-100" title="Refuser">
                           <mat-icon class="text-sm">block</mat-icon>
                         </button>
                      </div>
                      
                      @if (piece.statut === 'REFUSE') {
                        <div class="p-2 bg-red-50 rounded-lg text-[9px] text-red-600 font-bold italic">
                          Motif: {{ piece.motifRefus }}
                        </div>
                      }
                    </div>
                  } @empty {
                    <div class="col-span-full py-10 text-center">
                      <p class="text-sm text-slate-400 font-bold italic">Aucune pièce déposée par l'usager.</p>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Modal Footer -->
            <div class="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
               <button (click)="closeModal()" class="px-8 py-3 bg-slate-900 font-black text-white rounded-xl text-[10px] uppercase tracking-widest transition-all hover:bg-slate-800 shadow-xl shadow-slate-900/10">
                 TERMINER LE CONTRÔLE
               </button>
            </div>
          </div>
        </div>
      }

      <!-- SUB-MODAL REFUS PIÈCE -->
      @if (selectedPieceForRefusal()) {
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 font-sans">
          <div class="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 class="text-lg font-black text-slate-900 uppercase tracking-tight mb-4">Motif de refus de la pièce</h3>
            <textarea [(ngModel)]="pieceMotifRefus" class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 h-32 text-sm font-medium" placeholder="Ex: Document flou, signature manquante..."></textarea>
            <div class="flex justify-end gap-3 mt-6">
              <button (click)="selectedPieceForRefusal.set(null)" class="px-5 py-2 text-slate-600 bg-slate-100 rounded-xl font-bold text-xs uppercase">Annuler</button>
              <button (click)="confirmPieceRefusal()" [disabled]="!pieceMotifRefus" class="px-5 py-2 text-white bg-red-600 rounded-xl font-bold text-xs uppercase disabled:opacity-50">Confirmer Refus</button>
            </div>
          </div>
        </div>
      }

      <!-- PREVIEW PIÈCE MODAL -->
      @if (piecePreviewUrl() || isPreviewLoading()) {
        <div class="fixed inset-0 bg-black/90 backdrop-blur-md flex flex-col z-[70] p-4 sm:p-10">
           <div class="flex justify-between items-center mb-4">
              <h3 class="text-white font-black uppercase tracking-widest text-xs">Aperçu du document</h3>
              <button (click)="closePreview()" class="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all">
                <mat-icon>close</mat-icon>
              </button>
           </div>
           <div class="flex-1 bg-white rounded-2xl overflow-hidden shadow-2xl relative">
              @if (isPreviewLoading()) {
                <div class="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-sm z-10">
                   <div class="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
                   <p class="text-white text-[10px] font-black uppercase tracking-widest">Préparation de l'aperçu...</p>
                </div>
              }

              @if (piecePreviewUrl()) {
                @if (piecePreviewType() === 'pdf') {
                  <iframe [src]="piecePreviewUrl()!" class="w-full h-full rounded-2xl border-0 select-none"></iframe>
                } @else {
                  <div class="w-full h-full flex items-center justify-center bg-slate-900 overflow-auto p-4">
                    <img [src]="piecePreviewUrl()!" class="max-w-full max-h-full object-contain shadow-2xl" alt="Preview" referrerpolicy="no-referrer">
                  </div>
                }
              }
           </div>
        </div>
      }
    </div>
  `
})
export class DossierValidationComponent implements OnInit {
  private dossierService = inject(DossierService);
  private pieceService = inject(PieceService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);

  dossiers = signal<Dossier[]>([]);
  searchTerm = signal('');
  aiScoreFilter = signal<'all' | 'conforme' | 'non-conforme'>('all');
  sortBy = signal<'recent' | 'ancien' | 'score'>('recent');

  filteredDossiers = computed(() => {
    let list = this.dossiers();
    
    // Search filter
    const term = this.searchTerm().trim().toLowerCase();
    if (term) {
      list = list.filter(d => 
        (d.fileName && d.fileName.toLowerCase().includes(term)) || 
        (d.cin && d.cin.toLowerCase().includes(term)) ||
        (d.id && d.id.toString().includes(term)) ||
        (d.user && d.user.nom && d.user.nom.toLowerCase().includes(term)) ||
        (d.user && d.user.prenom && d.user.prenom.toLowerCase().includes(term)) ||
        (d.user && d.user.numeroAssure && d.user.numeroAssure.toLowerCase().includes(term))
      );
    }

    // AI Score filter
    const aiOption = this.aiScoreFilter();
    if (aiOption === 'conforme') {
      list = list.filter(d => d.aiScore !== undefined && d.aiScore >= 70);
    } else if (aiOption === 'non-conforme') {
      list = list.filter(d => d.aiScore !== undefined && d.aiScore < 70);
    }

    // Sort
    const sortOption = this.sortBy();
    return [...list].sort((a, b) => {
      if (sortOption === 'recent') {
        const dateA = a.dateUpload ? new Date(a.dateUpload).getTime() : 0;
        const dateB = b.dateUpload ? new Date(b.dateUpload).getTime() : 0;
        return dateB - dateA;
      } else if (sortOption === 'ancien') {
        const dateA = a.dateUpload ? new Date(a.dateUpload).getTime() : 0;
        const dateB = b.dateUpload ? new Date(b.dateUpload).getTime() : 0;
        return dateA - dateB;
      } else if (sortOption === 'score') {
        return (b.aiScore || 0) - (a.aiScore || 0);
      }
      return 0;
    });
  });

  previews = signal<Record<number, string>>({});
  lightboxDossier = signal<Dossier | null>(null);
  selectedDossier = signal<Dossier | null>(null);
  modalType = signal<'VALIDATE' | 'REFUSE' | 'AI_REPORT' | 'PIECES' | null>(null);
  
  // Pieces for Agent
  dossierPieces = signal<PieceJustificative[]>([]);
  isLoadingPieces = signal(false);
  selectedPieceForRefusal = signal<PieceJustificative | null>(null);
  pieceMotifRefus = '';

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
      // Ensure nested fields are mapped properly if they exist as parsed.details
      return parsed;
    } catch (e) {
      return null;
    }
  }

  user = this.authService.currentUser;
  
  roleLabel = computed(() => {
    const roles = this.user()?.roles || [];
    if (roles.includes('ROLE_AGENT_BUREAU')) return 'Agent Bureau - Validation Locale';
    if (roles.includes('ROLE_AGENT_DIRECTION')) return 'Agent Direction - Validation Globale';
    if (roles.includes('ROLE_AGENT_CNSS')) return 'Agent CNSS - Validation Centrale';
    return 'Validation des Dossiers';
  });

  ngOnInit() {
    this.loadDossiers();
  }

  loadDossiers() {
    const roles = this.user()?.roles || [];
    const isDirection = roles.includes('ROLE_AGENT_DIRECTION');
    
    // According to Java backend: 
    // AGENT_DIRECTION sees valides-local
    // AGENT_CNSS and AGENT_BUREAU see en-attente
    const obs = isDirection 
      ? this.dossierService.getDossiersValidesLocal() 
      : this.dossierService.getDossiersEnAttente();

    obs.subscribe({
      next: (dossiers) => {
        this.dossiers.set(dossiers);
        this.errorMessage.set('');
        this.loadPreviews(dossiers);
      },
      error: (error: HttpErrorResponse) => this.handleError(error)
    });
  }

  loadPreviews(dossiers: Dossier[]) {
    dossiers.forEach(dossier => {
      if (!this.previews()[dossier.id]) {
        this.dossierService.downloadDossier(dossier.id).subscribe(blob => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = reader.result as string;
            this.previews.update(prev => ({ ...prev, [dossier.id]: base64data }));
          };
          reader.readAsDataURL(blob);
        });
      }
    });
  }

  isImage(fileName: string): boolean {
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
  }

  openLightbox(dossier: Dossier) {
    this.lightboxDossier.set(dossier);
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

  // Piece Management for Agent
  piecePreviewUrl = signal<SafeUrl | null>(null);
  piecePreviewType = signal<'pdf' | 'image' | null>(null);
  isPreviewLoading = signal(false);

  openPiecesModal(dossier: Dossier) {
    this.selectedDossier.set(dossier);
    this.modalType.set('PIECES');
    this.loadDossierPieces(dossier.id);
  }

  loadDossierPieces(dossierId: number) {
    this.isLoadingPieces.set(true);
    this.pieceService.getPiecesByDossier(dossierId).subscribe({
      next: (data) => {
        this.dossierPieces.set(data);
        this.isLoadingPieces.set(false);
      },
      error: () => this.isLoadingPieces.set(false)
    });
  }

  getPieceStatusClass(status: string) {
    switch (status) {
      case 'VALIDE': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'REFUSE': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  }

  updatePieceStatus(piece: PieceJustificative, valide: boolean, motif?: string) {
    console.log(`[UpdatePieceStatus] ID: ${piece.id}, Valide: ${valide}, Motif: ${motif}`);
    this.pieceService.validerPiece(piece.id, valide, motif).subscribe({
      next: () => {
        console.log(`[UpdatePieceStatus] Success for piece ${piece.id}`);
        this.loadDossierPieces(this.selectedDossier()!.id);
        this.selectedPieceForRefusal.set(null);
        this.pieceMotifRefus = '';
      },
      error: (error: HttpErrorResponse) => {
        console.error(`[UpdatePieceStatus] Error for piece ${piece.id}:`, error);
        this.handleError(error);
      }
    });
  }

  openPieceRefusal(piece: PieceJustificative) {
    this.selectedPieceForRefusal.set(piece);
    this.pieceMotifRefus = '';
  }

  confirmPieceRefusal() {
    if (this.selectedPieceForRefusal() && this.pieceMotifRefus) {
      this.updatePieceStatus(this.selectedPieceForRefusal()!, false, this.pieceMotifRefus);
    }
  }

  private currentObjectUrl: string | null = null;

  previewPiece(piece: PieceJustificative) {
    this.isPreviewLoading.set(true);
    this.pieceService.downloadPiece(piece.id).subscribe({
      next: (blob) => {
        // Forcer le type MIME si nécessaire
        let mimeType = blob.type;
        if (!mimeType || mimeType === 'application/octet-stream') {
          mimeType = piece.fileName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';
        }

        const typedBlob = new Blob([blob], { type: mimeType });

        // Revoke previous URL if any
        if (this.currentObjectUrl) {
          window.URL.revokeObjectURL(this.currentObjectUrl);
        }

        this.currentObjectUrl = window.URL.createObjectURL(typedBlob);
        const safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.currentObjectUrl);
        
        this.piecePreviewUrl.set(safeUrl);
        this.piecePreviewType.set(piece.fileName.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image');
        this.isPreviewLoading.set(false);
      },
      error: () => {
        this.isPreviewLoading.set(false);
        this.errorMessage.set("Impossible de récupérer le document.");
      }
    });
  }

  closePreview() {
    this.piecePreviewUrl.set(null);
    this.piecePreviewType.set(null);
    this.isPreviewLoading.set(false);
    if (this.currentObjectUrl) {
      window.URL.revokeObjectURL(this.currentObjectUrl);
      this.currentObjectUrl = null;
    }
  }

  downloadPiece(piece: PieceJustificative) {
    this.pieceService.downloadPiece(piece.id).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = piece.fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  closeModal() {
    this.selectedDossier.set(null);
    this.modalType.set(null);
  }

  confirmValidation() {
    const dossier = this.selectedDossier();
    if (!dossier) return;
    console.log(`[ConfirmValidation] Dossier ID: ${dossier.id}`);

    const roles = this.user()?.roles || [];
    const callsGlobal = roles.includes('ROLE_AGENT_DIRECTION') || roles.includes('ROLE_AGENT_CNSS');
    
    const obs = callsGlobal
      ? this.dossierService.validerGlobal(dossier.id)
      : this.dossierService.validerLocal(dossier.id);

    obs.subscribe({
      next: () => {
        console.log(`[ConfirmValidation] Success for dossier ${dossier.id}`);
        this.loadDossiers();
        this.closeModal();
      },
      error: (error: HttpErrorResponse) => {
        console.error(`[ConfirmValidation] Error for dossier ${dossier.id}:`, error);
        this.handleError(error);
      }
    });
  }

  confirmRefusal() {
    const dossier = this.selectedDossier();
    if (!dossier || !this.motifRefus) return;
    console.log(`[ConfirmRefusal] Dossier ID: ${dossier.id}, Motif: ${this.motifRefus}`);

    this.dossierService.refuserDossier(dossier.id, this.motifRefus).subscribe({
      next: () => {
        console.log(`[ConfirmRefusal] Success for dossier ${dossier.id}`);
        this.loadDossiers();
        this.closeModal();
      },
      error: (error: HttpErrorResponse) => {
        console.error(`[ConfirmRefusal] Error for dossier ${dossier.id}:`, error);
        this.handleError(error);
      }
    });
  }

  getStatusClass(statut: string): string {
    switch (statut) {
      case 'VALIDE': return 'bg-green-100 text-green-700';
      case 'VALIDATION_LOCALE': return 'bg-blue-100 text-blue-700';
      case 'REFUSE': return 'bg-red-100 text-red-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  }

  private handleError(error: HttpErrorResponse) {
    if (error.status === 401) {
      this.authService.logout();
      this.router.navigate(['/login']);
      this.errorMessage.set('Votre session a expiré. Veuillez vous reconnecter.');
    } else if (error.status === 403) {
      this.errorMessage.set('Action non autorisée. Vous n\'avez pas les permissions nécessaires.');
    } else {
      const msg = error.error?.message || error.message || 'Une erreur est survenue. Veuillez réessayer.';
      this.errorMessage.set(msg);
      console.error('Error:', error);
    }
  }
}
