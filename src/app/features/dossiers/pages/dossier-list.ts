import { Component, inject, signal, computed, OnInit, Pipe, PipeTransform } from '@angular/core';
import { CommonModule, KeyValuePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { DossierService } from '../../../core/services/dossier.service';
import { PieceService } from '../../../core/services/piece.service';
import { AuthService } from '../../../core/services/auth.service';
import { AiVerificationFrontendService } from '../../../core/services/ai-verification.service';
import { Dossier, AiVerificationResult, SectionDetail, PieceJustificative, RequiredPieceInfo, TypePiece } from '../../../core/models/dossier.model';

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
  selector: 'app-dossier-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, SafeUrlPipe, KeyValuePipe, RouterModule],
  template: `
    <div class="space-y-8 pb-12">
      <div class="flex flex-col md:flex-row justify-between items-end gap-6">
        <div class="space-y-1">
          <h1 class="text-3xl font-black text-slate-900 tracking-tight">Espace Dossiers</h1>
          <p class="text-sm text-slate-500 font-medium">Gestion centralisée des prestations CNSS</p>
        </div>
        <div class="flex flex-wrap gap-3">
          <button (click)="downloadForm()" class="px-5 py-2.5 text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2 hover:bg-emerald-100 transition-all font-bold text-sm">
            <mat-icon class="text-lg">download</mat-icon>
            Modèle Officiel
          </button>
          <button routerLink="/dossiers/nouveau" class="px-5 py-2.5 text-white bg-slate-900 rounded-xl flex items-center gap-2 hover:bg-slate-800 transition-all font-bold text-sm shadow-lg shadow-slate-900/20">
            <mat-icon class="text-lg">edit_document</mat-icon>
            Remplir Formulaire
          </button>
          <button (click)="showUploadForm.set(true)" class="bg-emerald-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-emerald-700 transition-all font-bold text-sm shadow-lg shadow-emerald-600/20">
            <mat-icon class="text-lg">upload</mat-icon>
            Déposer Dossier
          </button>
        </div>
      </div>

      @if (errorMessage()) {
        <div class="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl text-red-700 flex items-center gap-3 animate-pulse">
          <mat-icon>error_outline</mat-icon>
          <span class="text-sm font-bold">{{ errorMessage() }}</span>
        </div>
      }

      @if (showUploadForm()) {
        <div class="bg-white overflow-hidden rounded-2xl shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-300">
          <div class="bg-slate-900 p-4 flex justify-between items-center">
            <div class="flex items-center gap-3 text-white">
              <mat-icon class="text-emerald-400">add_task</mat-icon>
              <h2 class="text-sm font-black uppercase tracking-widest">Nouveau Dépôt de Dossier</h2>
            </div>
            <button (click)="cancelUpload()" class="text-slate-400 hover:text-white transition-colors">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          
          <div class="p-8 space-y-8">
            <div class="max-w-xl mx-auto">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Sélection du fichier PDF généré</label>
              <div class="relative group">
                <input #fileInput type="file" class="hidden" (change)="onFileSelected($event)" accept="application/pdf">
                <div class="border-2 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 group-hover:border-blue-500 bg-slate-50/50 group-hover:bg-blue-50/30 transition-all cursor-pointer"
                     (click)="fileInput.click()">
                  <div class="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                    <mat-icon class="text-slate-400 group-hover:text-blue-600 transition-colors h-8 w-8">cloud_upload</mat-icon>
                  </div>
                  <div class="text-center">
                    <p class="text-sm font-black text-slate-800">
                      {{ selectedFile() ? selectedFile()?.name : 'Cliquez pour sélectionner le PDF' }}
                    </p>
                    <p class="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-tight">Format PDF (Max 50MB)</p>
                  </div>
                </div>
              </div>
            </div>

            @if (isVerifying()) {
              <div class="flex flex-col items-center py-12 space-y-6 bg-slate-50/50 rounded-2xl animate-pulse">
                <div class="relative">
                  <div class="w-16 h-16 border-4 border-emerald-900/10 border-t-emerald-600 rounded-full animate-spin"></div>
                  <mat-icon class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-600">analytics</mat-icon>
                </div>
                <div class="text-center">
                  <p class="text-sm font-black text-slate-900 uppercase tracking-widest">Analyse Intelligente en cours</p>
                  <p class="text-xs text-slate-500 mt-1 italic">Vérification de la conformité CNSS par l'IA...</p>
                </div>
              </div>
            }

            @if (preVerificationResult() || submissionError() || errorMessage()) {
              @let result = preVerificationResult() || submissionError()?.aiVerification;
              
              @if (result) {
                <div class="rounded-2xl border-2 overflow-hidden shadow-sm" [class]="result?.valide ? 'bg-emerald-50/50 border-emerald-100' : 'bg-red-50/50 border-red-100'">
                  <div class="p-5 flex items-center justify-between" [class]="result?.valide ? 'bg-emerald-600' : 'bg-red-600'">
                    <div class="flex items-center gap-3 text-white">
                      <mat-icon>{{ result?.valide ? 'verified' : 'report_problem' }}</mat-icon>
                      <span class="font-black text-sm uppercase tracking-widest">Rapport d'analyse IA</span>
                    </div>
                    <div class="bg-white/20 px-3 py-1 rounded-lg text-white font-mono text-xs font-bold ring-1 ring-white/30 lowercase">
                      score: {{ result?.score }}%
                    </div>
                  </div>

                  <div class="p-6 space-y-6">
                    <div class="flex items-start gap-4">
                      <div class="p-3 rounded-xl" [class]="result?.valide ? 'bg-emerald-100' : 'bg-red-100'">
                         <span class="text-lg font-black" [class]="result?.valide ? 'text-emerald-700' : 'text-red-700'">{{ result?.scoreBadge }}</span>
                      </div>
                      <div class="flex-1">
                        <p class="text-sm font-bold text-slate-900 leading-tight mb-1">{{ result?.resume }}</p>
                        @if (submissionError()) {
                          <p class="text-xs font-bold text-red-600">{{ submissionError()?.message }}</p>
                        }
                      </div>
                    </div>

                    @if (result?.champsManquants?.length) {
                      <div class="bg-white p-4 rounded-xl border border-red-100">
                        <p class="text-[10px] font-black text-red-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <mat-icon class="text-[14px] w-3.5 h-3.5">error</mat-icon>
                          Éléments manquants détectés
                        </p>
                        <div class="flex flex-wrap gap-2">
                          @for (champ of result?.champsManquants; track champ) {
                            <span class="bg-red-50 text-red-700 px-2 py-1 rounded-md text-[10px] font-bold border border-red-100">
                              {{ champ }}
                            </span>
                          }
                        </div>
                      </div>
                    }

                    @if (result?.details) {
                      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        @for (detail of result.details | keyvalue; track detail.key) {
                          <div class="p-3 rounded-xl bg-white border border-slate-100 group hover:border-slate-300 transition-colors shadow-sm">
                            <p class="text-[9px] font-black uppercase tracking-tight text-slate-400 mb-2 truncate">{{ detail.key }}</p>
                            <div class="flex items-center gap-2 mb-2">
                              <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase" 
                                    [class]="getSectionDetail(detail.value).statut === 'VALIDE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'">
                                {{ getSectionDetail(detail.value).statut }}
                              </span>
                            </div>
                            <p class="text-[10px] text-slate-600 leading-snug line-clamp-2">{{ getSectionDetail(detail.value).commentaire }}</p>
                          </div>
                        }
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- Astuce Box when verification fails or error occurs -->
              @if (!result?.valide || errorMessage()) {
                <div class="p-6 bg-amber-50 border border-amber-100 rounded-2xl space-y-3">
                  <div class="flex items-center gap-2 text-amber-800">
                    <mat-icon class="text-lg">lightbulb</mat-icon>
                    <span class="text-xs font-black uppercase tracking-widest">Astuce pour un dépôt réussi</span>
                  </div>
                  <p class="text-xs text-amber-800 leading-relaxed font-medium">
                    Si l'IA ne parvient pas à lire votre document, assurez-vous de l'avoir généré via le bouton 
                    <span class="font-black uppercase text-[10px]">"Générer le PDF"</span> de notre formulaire, 
                    puis d'avoir choisi <span class="font-black uppercase text-[10px]">"Enregistrer au format PDF"</span> 
                    dans les options d'impression. Évitez les scanners ou photos qui empêchent l'extraction automatique du texte.
                  </p>
                </div>
              }
            }

            <div class="flex justify-end gap-4">
              <button type="button" (click)="cancelUpload()" 
                      class="px-6 py-2.5 text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all font-bold text-sm">
                Annuler
              </button>
              <button type="button" (click)="preVerify()" [disabled]="!selectedFile() || isVerifying()" 
                      class="px-6 py-2.5 text-emerald-700 bg-emerald-50 border-2 border-emerald-100 rounded-xl hover:bg-emerald-100 transition-all disabled:opacity-50 font-bold text-sm">
                Lancer Pré-vérification
              </button>
              <button type="button" (click)="onUpload()" [disabled]="!selectedFile() || isVerifying()" 
                      class="px-6 py-2.5 text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50 font-bold text-sm shadow-xl shadow-slate-900/20">
                Finaliser le Dépôt
              </button>
            </div>
          </div>
        </div>
      }

      <!-- BARRE DE RECHERCHE & FILTRAGE -->
      <div class="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4 md:flex-row md:items-center md:justify-between animate-in fade-in duration-300">
        <!-- Barre de recherche -->
        <div class="relative flex-1 max-w-md">
          <mat-icon class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">search</mat-icon>
          <input 
            type="text" 
            [value]="searchTerm()"
            (input)="onSearchInput($event)"
            placeholder="Rechercher par nom, statut, type..." 
            class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
          >
          @if (searchTerm()) {
            <button (click)="searchTerm.set('')" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
              <mat-icon class="text-base select-none">cancel</mat-icon>
            </button>
          }
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <!-- Filtre Statut (Pills/Tabs) -->
          <div class="bg-slate-100 p-0.5 rounded-lg flex flex-wrap items-center gap-1">
            <button 
              (click)="onStatusFilterChange('TOUS')"
              [class]="statusFilter() === 'TOUS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'"
              class="px-2.5 py-1 text-[11px] font-black uppercase rounded-md transition-all cursor-pointer"
            >
              Tous
            </button>
            <button 
              (click)="onStatusFilterChange('EN_ATTENTE')"
              [class]="statusFilter() === 'EN_ATTENTE' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'"
              class="px-2.5 py-1 text-[11px] font-black uppercase rounded-md transition-all cursor-pointer"
            >
              En attente
            </button>
            <button 
              (click)="onStatusFilterChange('VALIDATION_LOCALE')"
              [class]="statusFilter() === 'VALIDATION_LOCALE' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'"
              class="px-2.5 py-1 text-[11px] font-black uppercase rounded-md transition-all cursor-pointer"
            >
              Validé Local
            </button>
            <button 
              (click)="onStatusFilterChange('VALIDE')"
              [class]="statusFilter() === 'VALIDE' ? 'bg-green-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'"
              class="px-2.5 py-1 text-[11px] font-black uppercase rounded-md transition-all cursor-pointer"
            >
              Qualifié
            </button>
            <button 
              (click)="onStatusFilterChange('REFUSE')"
              [class]="statusFilter() === 'REFUSE' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'"
              class="px-2.5 py-1 text-[11px] font-black uppercase rounded-md transition-all cursor-pointer"
            >
              Refusés
            </button>
          </div>

          <!-- Filtre Type d'Avantage (Dropdown) -->
          <div class="relative">
            <select 
              [value]="advantageTypeFilter()"
              (change)="onAdvantageTypeFilterChange($event)"
              class="appearance-none bg-slate-50 border border-slate-200/80 pl-3 pr-8 py-2 rounded-xl text-xs font-black uppercase tracking-wide text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all cursor-pointer"
            >
              @for (opt of staticAdvantageTypes; track opt.value) {
                <option [value]="opt.value">{{ opt.label }}</option>
              }
            </select>
            <mat-icon class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-sm w-4 h-4 flex items-center justify-center">expand_more</mat-icon>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        @for (dossier of filteredDossiers(); track dossier.id) {
          <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group">
            <div class="aspect-[4/3] bg-slate-50 relative cursor-pointer overflow-hidden border-b border-slate-50" (click)="openLightbox(dossier)">
              @if (previews()[dossier.id]) {
                @if (isImage(dossier.fileName)) {
                  <img [src]="previews()[dossier.id]" class="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-300" [alt]="dossier.fileName" referrerpolicy="no-referrer">
                } @else {
                  <div class="w-full h-full flex flex-col items-center justify-center group-hover:bg-emerald-50 transition-colors">
                    <mat-icon class="text-6xl mb-3 text-slate-300 group-hover:text-emerald-700 transition-colors">description</mat-icon>
                    <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Document PDF</span>
                  </div>
                }
              } @else {
                <div class="w-full h-full flex items-center justify-center animate-pulse">
                  <mat-icon class="text-slate-200 text-5xl">inventory_2</mat-icon>
                </div>
              }
              <div class="absolute inset-0 bg-emerald-900/0 group-hover:bg-emerald-900/10 flex items-center justify-center transition-all">
                <div class="bg-white/90 p-3 rounded-full shadow-2xl opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                  <mat-icon class="text-emerald-700">zoom_in</mat-icon>
                </div>
              </div>
              <div class="absolute top-4 right-4">
                 <span [class]="getStatusClass(dossier.statut)" class="px-3 py-1 text-[9px] font-black uppercase rounded-lg shadow-sm border border-white/20 backdrop-blur-sm">
                    {{ dossier.statut }}
                 </span>
              </div>
            </div>

            <div class="p-6">
              <div class="flex items-start justify-between gap-4 mb-1">
                @if (dossier.typeAvantage) {
                  <div class="mb-2 flex items-center gap-1 text-[11px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md w-fit">
                    <mat-icon class="!text-[12px] w-3 h-3 flex items-center justify-center">assignment</mat-icon>
                    {{ dossier.typeAvantage }}
                  </div>
                }
                <h3 class="font-black text-slate-900 truncate flex-1 text-sm uppercase tracking-tight group-hover:text-emerald-700 transition-colors" [title]="dossier.fileName">{{ dossier.fileName }}</h3>
              </div>
              <p class="text-[10px] text-slate-400 font-bold mb-4 italic">{{ dossier.dateUpload | date:'dd MMM yyyy à HH:mm' }}</p>
              
              <div class="pt-4 border-t border-slate-50 flex justify-between items-center">
                <div class="flex -space-x-2">
                   <div class="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center" title="IA Active">
                      <mat-icon class="text-[10px] w-auto h-auto text-emerald-800 font-black">smart_toy</mat-icon>
                   </div>
                   <div class="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center" title="Signé">
                      <mat-icon class="text-[10px] w-auto h-auto text-emerald-600">verified</mat-icon>
                   </div>
                </div>
                <div class="flex gap-1">
                  <button (click)="openPiecesModal(dossier)" class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Pièces Justificatives">
                    <mat-icon class="text-lg">attach_file</mat-icon>
                  </button>
                  <button (click)="view(dossier)" class="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Aperçu">
                    <mat-icon class="text-lg">visibility</mat-icon>
                  </button>
                  <button (click)="download(dossier)" class="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Télécharger">
                    <mat-icon class="text-lg">file_download</mat-icon>
                  </button>
                  @if (dossier.statut === 'EN_ATTENTE') {
                    <button (click)="delete(dossier.id)" class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Supprimer">
                      <mat-icon class="text-lg">delete_outline</mat-icon>
                    </button>
                  }
                </div>
              </div>
              @if (dossier.motifRefus) {
                <div class="mt-4 p-3 bg-red-50 rounded-xl text-[10px] text-red-700 border border-red-100">
                  <p class="font-black uppercase mb-1 flex items-center gap-1">
                    <mat-icon class="text-[12px] w-3 h-3">error_outline</mat-icon>
                    Motif du refus
                  </p>
                  {{ dossier.motifRefus }}
                </div>
              }
            </div>
          </div>
        } @empty {
          @if (dossiers().length > 0) {
            <div class="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center animate-in fade-in duration-300">
              <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <mat-icon class="text-3xl text-slate-300">search_off</mat-icon>
              </div>
              <p class="text-slate-900 font-black uppercase tracking-widest text-[11px]">Aucun résultat trouvé</p>
              <p class="text-slate-400 text-xs mt-1">Aucun dossier ne correspond à vos critères de recherche.</p>
              <button (click)="searchTerm.set(''); statusFilter.set('TOUS'); advantageTypeFilter.set('TOUS')" class="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-lg font-bold transition-all cursor-pointer">
                Réinitialiser les filtres
              </button>
            </div>
          } @else {
            <div class="col-span-full py-24 text-center bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center animate-in fade-in duration-300">
              <div class="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <mat-icon class="text-4xl text-slate-300">folder_off</mat-icon>
              </div>
              <p class="text-slate-900 font-black uppercase tracking-widest text-sm">Aucun dossier déposé</p>
              <p class="text-slate-400 text-sm mt-1 max-w-xs">Commencez par générer votre formulaire officiel ou déposez un dossier existant.</p>
              <button (click)="showUploadForm.set(true)" class="mt-8 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 cursor-pointer">
                Effectuer mon premier dépôt
              </button>
            </div>
          }
        }
      </div>

      <!-- PIECES JUSTIFICATIVES MODAL -->
      @if (selectedDossierForPieces()) {
        <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div class="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 border border-slate-200">
            <!-- Modal Header -->
            <div class="bg-slate-900 p-8 flex justify-between items-center text-white">
              <div class="flex items-center gap-4">
                <div class="p-3 bg-white/10 rounded-2xl">
                  <mat-icon class="text-indigo-400">attach_file</mat-icon>
                </div>
                <div>
                  <h2 class="text-xl font-black uppercase tracking-widest">Pièces Justificatives</h2>
                  <p class="text-[10px] text-slate-400 uppercase font-black tracking-tighter">Dossier #{{ selectedDossierForPieces()?.id }} - {{ selectedDossierForPieces()?.fileName }}</p>
                </div>
              </div>
              <button (click)="closePiecesModal()" class="hover:bg-white/10 p-2 rounded-xl transition-all">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <div class="p-8 space-y-8 max-h-[60vh] overflow-y-auto">
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
                        <span class="text-[8px] font-black uppercase px-2 py-0.5 rounded-full border"
                              [class]="getPieceStatusClass(piece.statut)">
                          {{ piece.statut }}
                        </span>
                      </div>
                      
                      <div>
                        <p class="text-[9px] font-black text-slate-400 uppercase tracking-tighter truncate">{{ piece.typePiece }}</p>
                        <p class="text-xs font-bold text-slate-900 truncate">{{ piece.fileName }}</p>
                      </div>

                      <div class="flex justify-between items-center pt-2">
                         <span class="text-[9px] font-mono font-bold text-slate-400">{{ piece.dateUpload | date:'dd/MM/yy HH:mm' }}</span>
                         <div class="flex gap-2">
                           <button (click)="previewPiece(piece)" class="p-1.5 text-indigo-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-indigo-100">
                             <mat-icon class="text-sm">visibility</mat-icon>
                           </button>
                           <button (click)="downloadPiece(piece)" class="p-1.5 text-indigo-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-indigo-100">
                             <mat-icon class="text-sm">download</mat-icon>
                           </button>
                         </div>
                      </div>
                      
                      @if (piece.statut === 'REFUSE') {
                        <div class="mt-2 p-2 bg-red-50 rounded-lg text-[9px] text-red-600 font-bold border border-red-100 italic">
                          Motif: {{ piece.motifRefus }}
                        </div>
                      }
                    </div>
                  }

                  <!-- PIECE UPLOAD BUTTONS -->
                  @for (req of requiredPieceTypes(); track req.type) {
                    @if (!hasPieceType(req.type)) {
                      <div class="p-5 bg-white rounded-2xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center space-y-3 hover:border-indigo-400 hover:bg-slate-50/50 transition-all group cursor-pointer"
                           (click)="triggerFileUpload(req.type, pieceFileInput)">
                        <div class="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all">
                          <mat-icon>add</mat-icon>
                        </div>
                        <div>
                          <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Déposer</p>
                          <p class="text-[10px] font-bold text-slate-800 leading-tight">{{ req.libelle }}</p>
                        </div>
                        @if (req.obligatoire) {
                          <span class="text-[8px] font-black bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">OBLIGATOIRE</span>
                        }
                      </div>
                    }
                  }

                  @if (dossierPieces().length === 0 && requiredPieceTypes().length === 0) {
                    <div class="col-span-full py-10 text-center space-y-4">
                      <mat-icon class="text-4xl text-slate-200">folder_open</mat-icon>
                      <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Aucune pièce requise trouvée pour ce dossier.</p>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- HIDDEN FILE INPUT FOR PIECES -->
            <input #pieceFileInput type="file" class="hidden" (change)="onPieceFileSelected($event)">
            
            <!-- Modal Footer -->
            <div class="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
               <div class="flex items-center gap-2">
                 <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                 <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Documents secondaires pour conformité</span>
               </div>
               <button (click)="closePiecesModal()" class="px-8 py-3 bg-slate-900 font-black text-white rounded-xl text-xs uppercase tracking-widest transition-all hover:bg-slate-800 active:scale-95 shadow-xl shadow-slate-900/10">
                 FERMER
               </button>
            </div>
          </div>
        </div>
      }

      <!-- Lightbox Modal -->
      @if (lightboxDossier()) {
        <div class="fixed inset-0 bg-slate-950/95 z-[100] flex flex-col items-center justify-center p-4 md:p-8 animate-in fade-in duration-200" (click)="closeLightbox()">
          <div class="absolute top-6 right-6 flex gap-4">
            <button (click)="download(lightboxDossier()!); $event.stopPropagation()" class="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-md" title="Télécharger">
              <mat-icon>download</mat-icon>
            </button>
            <button (click)="closeLightbox()" class="p-3 bg-red-500/80 hover:bg-red-500 rounded-full text-white transition-all backdrop-blur-md" title="Fermer">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          
          <div class="w-full h-full flex flex-col items-center" (click)="$event.stopPropagation()">
            <div class="w-full h-full max-w-5xl bg-white rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-12 duration-500">
               @if (previews()[lightboxDossier()!.id]) {
                @if (isImage(lightboxDossier()!.fileName)) {
                  <div class="w-full h-full overflow-auto p-4 flex items-center justify-center bg-slate-100">
                    <img [src]="previews()[lightboxDossier()!.id]" class="max-w-full max-h-none shadow-2xl rounded-sm" [alt]="lightboxDossier()!.fileName" referrerpolicy="no-referrer">
                  </div>
                } @else {
                  <iframe [src]="previews()[lightboxDossier()!.id] | safeUrl" class="w-full h-full border-none"></iframe>
                }
              } @else {
                <div class="flex flex-col items-center justify-center text-slate-900 h-full">
                  <div class="w-16 h-16 border-4 border-slate-200 border-t-emerald-700 rounded-full animate-spin mb-6"></div>
                  <p class="text-sm font-black uppercase tracking-widest">Génération du rendu en cours...</p>
                  <button (click)="loadSinglePreview(lightboxDossier()!); $event.stopPropagation()" class="mt-8 px-6 py-2 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-xs hover:bg-emerald-100 transition-all">
                    Réessayer le chargement
                  </button>
                </div>
              }
            </div>
          </div>
          
          <div class="mt-6 text-white text-center animate-in fade-in slide-in-from-bottom-2 duration-700">
            <h2 class="text-xl font-black uppercase tracking-tight">{{ lightboxDossier()?.fileName }}</h2>
            <div class="flex items-center justify-center gap-3 mt-2">
               <span class="text-xs opacity-50 font-mono">{{ lightboxDossier()?.dateUpload | date:'medium' }}</span>
               <span class="w-1 h-1 bg-white/30 rounded-full"></span>
               <span class="px-2 py-0.5 rounded bg-white/10 text-[9px] font-black uppercase tracking-widest text-emerald-400 ring-1 ring-emerald-400/30">Dossier Certifié</span>
            </div>
          </div>
        </div>
      }

      <!-- PREVIEW PIÈCE MODAL -->
      @if (piecePreviewUrl() || isPreviewLoading()) {
        <div class="fixed inset-0 bg-slate-950/95 flex flex-col z-[70] p-4 sm:p-10 animate-in fade-in duration-300">
           <div class="flex justify-between items-center mb-4 max-w-5xl mx-auto w-full">
              <h3 class="text-white font-black uppercase tracking-widest text-xs">Aperçu du justificatif</h3>
              <button (click)="closePreview()" class="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-md">
                <mat-icon>close</mat-icon>
              </button>
           </div>
           <div class="flex-1 bg-white rounded-3xl overflow-hidden shadow-2xl relative max-w-5xl mx-auto w-full animate-in zoom-in duration-300">
              @if (isPreviewLoading()) {
                <div class="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-sm z-10">
                   <div class="w-12 h-12 border-4 border-white/20 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
                   <p class="text-white text-[10px] font-black uppercase tracking-widest">Chargement sécurisé...</p>
                </div>
              }

              @if (piecePreviewUrl()) {
                @if (piecePreviewType() === 'pdf') {
                  <iframe [src]="piecePreviewUrl()!" class="w-full h-full rounded-2xl border-0 select-none"></iframe>
                } @else {
                  <div class="w-full h-full flex items-center justify-center bg-slate-100 overflow-auto p-4">
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
export class DossierListComponent implements OnInit {
  private dossierService: DossierService = inject(DossierService);
  private pieceService: PieceService = inject(PieceService);
  private aiVerificationService: AiVerificationFrontendService = inject(AiVerificationFrontendService);
  private authService: AuthService = inject(AuthService);
  private router: Router = inject(Router);
  private sanitizer: DomSanitizer = inject(DomSanitizer);

  dossiers = signal<Dossier[]>([]);

  staticAdvantageTypes = [
    { value: 'TOUS', label: 'Tous les avantages' },
    { value: 'RETRAITE / VIEILLESSE', label: 'Retraite / Vieillesse' },
    { value: 'RÉGIME GÉNÉRAL', label: 'Régime Général' },
    { value: 'MALADIE PROFESSIONNELLE', label: 'Maladie Professionnelle' },
    { value: 'ACCIDENT DE TRAVAIL', label: 'Accident de Travail' },
    { value: 'INDEMNITÉS JOURNALIÈRES', label: 'Indemnités Journalières' },
    { value: 'DÉCÈS / CAPITAL DÉCÈS', label: 'Décès / Capital Décès' },
    { value: 'PENSION INVALIDITÉ', label: 'Pension Invalidité' }
  ];

  // Filtering & Search signals
  searchTerm = signal<string>('');
  statusFilter = signal<string>('TOUS');
  advantageTypeFilter = signal<string>('TOUS');

  matchesAdvantageType(dossierType: string | undefined, filterType: string): boolean {
    if (filterType === 'TOUS') return true;
    if (!dossierType) return false;
    const dossierLower = dossierType.toLowerCase();
    
    switch (filterType) {
      case 'RETRAITE / VIEILLESSE':
        return dossierLower.includes('retraite') || dossierLower.includes('vieillesse');
        
      case 'RÉGIME GÉNÉRAL':
        return dossierLower.includes('général') || dossierLower.includes('general') || dossierLower.includes('régime') || dossierLower.includes('regime');
        
      case 'MALADIE PROFESSIONNELLE':
        return dossierLower.includes('professionnelle') || (dossierLower.includes('maladie') && dossierLower.includes('prof'));
        
      case 'ACCIDENT DE TRAVAIL':
        return dossierLower.includes('accident') || dossierLower.includes('travail');
        
      case 'INDEMNITÉS JOURNALIÈRES':
        return dossierLower.includes('indemnité') || dossierLower.includes('indemnite') || dossierLower.includes('journali');
        
      case 'DÉCÈS / CAPITAL DÉCÈS':
        return dossierLower.includes('décès') || dossierLower.includes('deces') || dossierLower.includes('capital') || dossierLower.includes('survivant');
        
      case 'PENSION INVALIDITÉ':
        return dossierLower.includes('invalid');
        
      default:
        return false;
    }
  }

  filteredDossiers = computed(() => {
    let list = this.dossiers();
    const search = this.searchTerm().toLowerCase().trim();
    const status = this.statusFilter();
    const advantage = this.advantageTypeFilter();

    if (search) {
      list = list.filter(d => 
        (d.fileName && d.fileName.toLowerCase().includes(search)) ||
        (d.typeAvantage && d.typeAvantage.toLowerCase().includes(search)) ||
        (d.statut && d.statut.toLowerCase().includes(search))
      );
    }

    if (status && status !== 'TOUS') {
      list = list.filter(d => d.statut === status);
    }

    if (advantage && advantage !== 'TOUS') {
      list = list.filter(d => this.matchesAdvantageType(d.typeAvantage || d.fileName, advantage));
    }

    return list;
  });

  onSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  onStatusFilterChange(status: string) {
    this.statusFilter.set(status);
  }

  onAdvantageTypeFilterChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.advantageTypeFilter.set(value);
  }

  previews = signal<Record<number, string>>({});
  lightboxDossier = signal<Dossier | null>(null);
  
  // Pieces Management
  selectedDossierForPieces = signal<Dossier | null>(null);
  dossierPieces = signal<PieceJustificative[]>([]);
  requiredPieceTypes = signal<RequiredPieceInfo[]>([]);
  isLoadingPieces = signal(false);
  activeUploadType = signal<TypePiece | null>(null);

  // Piece Preview
  piecePreviewUrl = signal<SafeUrl | null>(null);
  piecePreviewType = signal<'pdf' | 'image' | null>(null);
  isPreviewLoading = signal(false);

  showUploadForm = signal(false);
  selectedFile = signal<File | null>(null);
  isVerifying = signal(false);
  preVerificationResult = signal<AiVerificationResult | null>(null);
  submissionError = signal<any | null>(null);
  errorMessage = signal<string>('');
  extractedPdfText = '';

  detectTypeFromText(text: string, filename?: string): string | null {
    if (filename) {
      const fnUpper = filename.toUpperCase();
      if (fnUpper.includes('RETRAITE') || fnUpper.includes('VIEILLESSE')) {
        return 'Pension de Retraite Régime Général (Vieillesse)';
      }
      if (fnUpper.includes('MALADIE') && (fnUpper.includes('PROF') || fnUpper.includes('PRO'))) {
        return 'Indemnités pour Maladie Professionnelle';
      }
      if (fnUpper.includes('ACCIDENT') || fnUpper.includes('TRAVAIL')) {
        return 'Rente pour Accident de Travail';
      }
      if (fnUpper.includes('INDEMNITE') || fnUpper.includes('JOURNALI')) {
        return 'Indemnités Journalières de Maladie';
      }
      if (fnUpper.includes('DECES') || fnUpper.includes('CAPITAL') || fnUpper.includes('SURVIVANT')) {
        return 'Capital Décès de Survivants';
      }
      if (fnUpper.includes('INVALID')) {
        return 'Pension d\'Invalidité';
      }
      if (fnUpper.includes('GENERAL') || fnUpper.includes('REGIME')) {
        return 'Régime Général';
      }
    }

    if (!text) return null;

    // Find all checkbox matches with their associated labels
    const regex = /(\[[\sXx]*\]|☒|☑|☐)\s*([^\[☒☑☐\n\r]+)/gi;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      const marker = match[1];
      const label = match[2].toUpperCase();
      
      // Determine if checkmark is set
      const isChecked = marker.includes('X') || marker.includes('x') || marker === '☒' || marker === '☑';
      
      if (isChecked) {
        if (label.includes('RETRAITE') || label.includes('VIEILLESSE')) {
          return 'Pension de Retraite Régime Général (Vieillesse)';
        }
        if (label.includes('MALADIE PROFESSIONNELLE') || label.includes('MALADIE PROF')) {
          return 'Indemnités pour Maladie Professionnelle';
        }
        if (label.includes('ACCIDENT')) {
          return 'Rente pour Accident de Travail';
        }
        if (label.includes('INDEMNITÉ') || label.includes('INDEMNITE') || label.includes('JOURNALI')) {
          return 'Indemnités Journalières de Maladie';
        }
        if (label.includes('DÉCÈS') || label.includes('DECES') || label.includes('CAPITAL')) {
          return 'Capital Décès de Survivants';
        }
        if (label.includes('INVALIDITÉ') || label.includes('INVALIDITE')) {
          return 'Pension d\'Invalidité';
        }
        if (label.includes('RÉGIME GÉNÉRAL') || label.includes('REGIME GENERAL') || label.includes('GENERAL')) {
          return 'Régime Général';
        }
      }
    }

    // Secondary fallback: Do keyword matching ONLY if no checkboxes matched
    const textUpper = text.toUpperCase();
    if (textUpper.includes('MALADIE PROFESSIONNELLE')) {
      return 'Indemnités pour Maladie Professionnelle';
    }
    if (textUpper.includes('ACCIDENT DE TRAVAIL')) {
      return 'Rente pour Accident de Travail';
    }
    if (textUpper.includes('INDEMNITÉS JOURNALIÈRES')) {
      return 'Indemnités Journalières de Maladie';
    }
    if (textUpper.includes('DÉCÈS / CAPITAL DÉCÈS')) {
      return 'Capital Décès de Survivants';
    }
    if (textUpper.includes('PENSION INVALIDITÉ')) {
      return 'Pension d\'Invalidité';
    }
    if (textUpper.includes('RETRAITE / VIEILLESSE')) {
      return 'Pension de Retraite Régime Général (Vieillesse)';
    }

    return null;
  }

  getSectionDetail(val: any): SectionDetail {
    return val as SectionDetail;
  }

  ngOnInit() {
    this.loadDossiers();
  }

  loadDossiers() {
    this.dossierService.getUserDossiers().subscribe({
      next: (dossiers: Dossier[]) => {
        // Sort dossiers by most recent first (based on dateUpload desc, fallback to id desc)
        const sorted = [...dossiers].sort((a, b) => {
          const dateA = a.dateUpload ? new Date(a.dateUpload).getTime() : 0;
          const dateB = b.dateUpload ? new Date(b.dateUpload).getTime() : 0;
          if (dateA === dateB || isNaN(dateA) || isNaN(dateB)) {
            return b.id - a.id;
          }
          return dateB - dateA;
        });
        this.dossiers.set(sorted);
        this.errorMessage.set('');
        this.loadPreviews(sorted);
      },
      error: (error: HttpErrorResponse) => this.handleError(error, 'chargement des dossiers')
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
      next: (blob: Blob) => {
        if (blob.size === 0) {
          console.error(`Received empty blob for dossier ${dossier.id}`);
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          this.previews.update(prev => ({ ...prev, [dossier.id]: base64data }));
          console.log(`Preview loaded for dossier ${dossier.id}`);
        };
        reader.readAsDataURL(blob);
      },
      error: (err: any) => {
        console.error(`Error loading preview for ${dossier.id}:`, err);
      }
    });
  }

  closeLightbox() {
    this.lightboxDossier.set(null);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        this.errorMessage.set('Veuillez sélectionner un fichier PDF.');
        return;
      }
      this.selectedFile.set(file);
      this.preVerificationResult.set(null);
    }
  }

  async preVerify() {
    if (!this.selectedFile()) return;
    
    this.isVerifying.set(true);
    this.errorMessage.set('');
    
    try {
      const text = await this.aiVerificationService.extractTextFromPdf(this.selectedFile()!);
      this.extractedPdfText = text;
     const result = await this.aiVerificationService.verifyDossier(this.selectedFile()!);
      this.preVerificationResult.set(result);
    } catch (error: any) {
      console.error('AI Verification error:', error);
      this.errorMessage.set(error.message || 'Erreur lors de la vérification IA.');
      
      // Fallback to backend only if it wasn't an extraction error that we already caught
      if (!error.message.includes("Impossible d'extraire")) {
        this.dossierService.preVerifier(this.selectedFile()!).subscribe({
          next: (result: AiVerificationResult) => {
            this.preVerificationResult.set(result);
            this.errorMessage.set('Note: Vérification effectuée par le serveur (IA locale).');
          },
          error: (err: any) => {
            this.errorMessage.set('Erreur critique de vérification. Le PDF est peut-être illisible.');
          }
        });
      }
    } finally {
      this.isVerifying.set(false);
    }
  }

  async onUpload() {
    if (!this.selectedFile()) return;

    this.isVerifying.set(true);
    this.submissionError.set(null);
    this.errorMessage.set('');

    let detectedType = '';
    try {
      let text = this.extractedPdfText;
      if (!text) {
        text = await this.aiVerificationService.extractTextFromPdf(this.selectedFile()!);
        this.extractedPdfText = text;
      }
      detectedType = this.detectTypeFromText(text, this.selectedFile()?.name) || '';
    } catch (e) {
      console.warn('Could not extract text locally:', e);
    }

    const preResult = this.preVerificationResult();
    const aiScore = preResult ? preResult.score : 0;
    const aiValide = preResult ? preResult.valide : false;

    this.dossierService.uploadDossier(this.selectedFile()!, aiScore, aiValide, detectedType).subscribe({
      next: () => {
        this.extractedPdfText = '';
        this.loadDossiers();
        this.cancelUpload();
        this.isVerifying.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.isVerifying.set(false);
        if (error.status === 400 && error.error?.erreur === 'FORMULAIRE_INVALIDE') {
          this.submissionError.set(error.error);
          this.errorMessage.set(error.error.message || "Le formulaire est invalide selon l'IA.");
        } else {
          this.handleError(error, 'envoi du dossier');
        }
      }
    });
  }

  cancelUpload() {
    this.showUploadForm.set(false);
    this.selectedFile.set(null);
    this.preVerificationResult.set(null);
    this.submissionError.set(null);
    this.errorMessage.set('');
  }

  downloadForm() {
    this.dossierService.telechargerFormulaire().subscribe((blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'formulaire_dossier_cnss.pdf';
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  download(dossier: Dossier) {
    this.dossierService.downloadDossier(dossier.id).subscribe((blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = dossier.fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  view(dossier: Dossier) {
    this.dossierService.downloadDossier(dossier.id).subscribe((blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    });
  }

  delete(id: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce dossier ?')) {
      this.dossierService.deleteDossier(id).subscribe(() => this.loadDossiers());
    }
  }

  getStatusClass(statut: string): string {
    switch (statut) {
      case 'VALIDE': return 'bg-green-100 text-green-700';
      case 'VALIDATION_LOCALE': return 'bg-blue-100 text-blue-700';
      case 'REFUSE': return 'bg-red-100 text-red-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  }

  getPieceStatusClass(status: string) {
    switch (status) {
      case 'VALIDE': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'REFUSE': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-amber-50 text-amber-600 border-amber-100';
    }
  }

  // Pieces Management Actions
  openPiecesModal(dossier: Dossier) {
    this.selectedDossierForPieces.set(dossier);
    this.loadDossierPieces(dossier.id);
    this.loadRequiredPieces(dossier);
  }

  closePiecesModal() {
    this.selectedDossierForPieces.set(null);
    this.dossierPieces.set([]);
    this.requiredPieceTypes.set([]);
  }

  loadDossierPieces(dossierId: number) {
    this.isLoadingPieces.set(true);
    this.pieceService.getPiecesByDossier(dossierId).subscribe({
      next: (data) => {
        this.dossierPieces.set(data || []);
        this.isLoadingPieces.set(false);
      },
      error: () => {
        this.dossierPieces.set([]);
        this.isLoadingPieces.set(false);
      }
    });
  }

  loadRequiredPieces(dossier: Dossier) {
    // Determine advantage type from filename or default to RETRAITE for demo
    const type = dossier.fileName.toUpperCase().includes('DECES') ? 'DECES' : 'RETRAITE';
    this.pieceService.getPiecesRequises(type).subscribe({
      next: (res) => {
        if (res && res.pieces) {
          this.requiredPieceTypes.set(res.pieces);
        } else {
          // Fallback demo data if API returns empty
          this.requiredPieceTypes.set([
            { type: 'CIN', libelle: 'Carte d\'Identité Nationale', obligatoire: true, formatsAcceptes: ['pdf', 'jpg', 'png'] },
            { type: 'EXTRAIT_NAISSANCE', libelle: 'Extrait de Naissance', obligatoire: true, formatsAcceptes: ['pdf', 'jpg', 'png'] }
          ]);
        }
      },
      error: () => {
        // Fallback demo data on error
        this.requiredPieceTypes.set([
          { type: 'CIN', libelle: 'Carte d\'Identité Nationale', obligatoire: true, formatsAcceptes: ['pdf', 'jpg', 'png'] },
          { type: 'EXTRAIT_NAISSANCE', libelle: 'Extrait de Naissance', obligatoire: true, formatsAcceptes: ['pdf', 'jpg', 'png'] }
        ]);
      }
    });
  }

  hasPieceType(type: TypePiece): boolean {
    return this.dossierPieces().some(p => p.typePiece === type && p.statut !== 'REFUSE');
  }

  triggerFileUpload(type: TypePiece, input: HTMLInputElement) {
    this.activeUploadType.set(type);
    input.value = '';
    input.click();
  }

  onPieceFileSelected(event: any) {
    const file = event.target.files[0];
    const type = this.activeUploadType();
    const dossier = this.selectedDossierForPieces();
    
    if (file && type && dossier) {
      this.isLoadingPieces.set(true);
      this.pieceService.uploadPiece(dossier.id, file, type).subscribe({
        next: () => {
          this.loadDossierPieces(dossier.id);
          this.activeUploadType.set(null);
        },
        error: (err: HttpErrorResponse) => {
          this.isLoadingPieces.set(false);
          this.errorMessage.set(err.error?.message || "Erreur lors de l'upload de la pièce.");
          setTimeout(() => this.errorMessage.set(''), 5000);
        }
      });
    }
  }

  downloadPiece(piece: PieceJustificative) {
    this.pieceService.downloadPiece(piece.id).subscribe((blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = piece.fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    });
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
        this.errorMessage.set("Impossible de récupérer la pièce justificative.");
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

  private handleError(error: HttpErrorResponse, action: string) {
    if (error.status === 401) {
      this.authService.logout();
      this.router.navigate(['/login']);
      this.errorMessage.set('Votre session a expiré. Veuillez vous reconnecter.');
    } else if (error.status === 403) {
      this.errorMessage.set('Action non autorisée. Vous n\'avez pas les permissions nécessaires.');
    } else {
      const apiMessage = error.error?.message || error.error?.error;
      this.errorMessage.set(apiMessage ? `Erreur: ${apiMessage}` : `Erreur lors du ${action}. Veuillez réessayer.`);
      console.error(`Error during ${action}:`, error);
    }
  }
}
