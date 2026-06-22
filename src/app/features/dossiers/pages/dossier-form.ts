import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, KeyValuePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { DossierService } from '../../../core/services/dossier.service';
import { AiVerificationFrontendService } from '../../../core/services/ai-verification.service';
import { AiVerificationResult, SectionDetail } from '../../../core/models/dossier.model';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-dossier-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, RouterModule, KeyValuePipe],
  template: `
    <div class="min-h-screen bg-neutral-200/50 py-12 px-4 print:bg-white print:p-0">
      
      <!-- Action Bar (Screen Only) -->
      <div class="max-w-[210mm] mx-auto mb-8 flex justify-between items-center print:hidden">
        <button routerLink="/dashboard" class="flex items-center gap-2 text-gray-500 hover:text-black font-semibold transition-all group">
          <mat-icon class="text-lg group-hover:-translate-x-1 transition-transform">arrow_back</mat-icon>
          Retour au tableau de bord
        </button>
        <div class="flex gap-4">
          <div class="hidden md:flex flex-col items-end justify-center">
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">État du formulaire</span>
            <span class="text-xs font-bold" [class.text-green-600]="dossierForm.valid" [class.text-amber-500]="dossierForm.invalid">
              {{ dossierForm.valid ? 'PRÊT À GÉNÉRER' : 'SAISIE EN COURS...' }}
            </span>
          </div>
          <button type="button" (click)="generatePDF()" [disabled]="dossierForm.invalid"
                  class="bg-emerald-600 text-white px-8 py-3 rounded-lg shadow-xl hover:bg-emerald-700 disabled:bg-gray-300 flex items-center gap-2 font-bold transition-all transform active:scale-95">
            <mat-icon>picture_as_pdf</mat-icon>
            GÉNÉRER LE PDF OFFICIEL
          </button>
        </div>
      </div>

      <!-- OFFICIAL FORM VIEW -->
      <!-- We use max-w-[210mm] to simulate A4 width on screen -->
      <div id="official-form" class="max-w-[210mm] mx-auto bg-white shadow-[0_0_50px_rgba(0,0,0,0.1)] overflow-hidden print:shadow-none print:w-full print:mx-0 print:rounded-none">
        
        <!-- Header -->
        <div class="p-10 border-b-4 border-slate-900 flex justify-between items-start select-none">
          <div class="flex items-start gap-6">
            <!-- Large elegant CNSS grey text logo without box -->
            <div class="text-slate-400 font-sans tracking-tighter font-extrabold text-5xl leading-none">CNSS</div>
            <div class="space-y-1.5 border-l-2 border-emerald-500/30 pl-5">
              <p class="text-[11px] font-black text-slate-800 uppercase leading-none tracking-wider">République Tunisienne</p>
              <p class="text-[9px] font-bold text-slate-400 tracking-tight">Ministère des Affaires Sociales</p>
              <p class="text-[13px] font-black text-emerald-700 uppercase tracking-tight">Caisse Nationale de Sécurité Sociale</p>
              <div class="h-0.5 w-10 bg-emerald-500 mt-1"></div>
            </div>
          </div>
          <div class="text-right">
            <h1 class="text-3xl font-black text-slate-900 tracking-tight leading-none">DEMANDE DE</h1>
            <p class="text-3xl font-black text-slate-900 tracking-tight leading-none mt-1">PRESTATIONS</p>
            <p class="text-[9px] font-black text-slate-400 mt-3 uppercase tracking-[0.15em]">Formulaire Unique de Remboursement</p>
            <div class="mt-4 inline-block bg-slate-50 border border-slate-200 px-3 py-1.5 text-[10px] font-mono font-bold text-slate-600 rounded">
              RÉFÉRENCE: D-PREST-V2024-TN
            </div>
          </div>
        </div>

        <form [formGroup]="dossierForm" class="p-10 space-y-10">
          
          <!-- CADRE A: RÉSERVÉ À L'ASSURÉ -->
          <div class="relative pt-8 border-t-2 border-emerald-900">
            <div class="absolute -top-[14px] left-0 bg-emerald-900 px-6 py-1.5 text-white font-black text-[10px] uppercase tracking-widest rounded-full">
              CADRE A : IDENTIFICATION DE L'ASSURÉ(E)
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 pt-2">
              
              <div class="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-8 bg-emerald-50/30 p-6 rounded-2xl border border-emerald-100">
                <div class="space-y-1.5">
                  <label class="text-[9px] font-black text-emerald-900/60 uppercase whitespace-nowrap tracking-wider">NOM ET PRÉNOMS :</label>
                  <p class="text-sm font-black text-slate-900 uppercase">{{ user()?.nom }} {{ user()?.prenom }}</p>
                </div>
                <div class="space-y-1.5 border-l border-emerald-200/50 pl-8">
                  <label class="text-[9px] font-black text-emerald-900/60 uppercase whitespace-nowrap tracking-wider">N° CIN :</label>
                  <p class="text-sm font-black text-slate-900 font-mono tracking-wider">{{ user()?.cin }}</p>
                </div>
                <div class="space-y-1.5 border-l border-emerald-200/50 pl-8">
                  <label class="text-[9px] font-black text-emerald-900/60 uppercase whitespace-nowrap tracking-wider">DATE DE NAISSANCE :</label>
                  <input type="text" formControlName="dateNaissance" placeholder="JJ/MM/AAAA" class="w-full bg-transparent border-none p-0 text-sm font-black text-slate-900 focus:ring-0 outline-none">
                </div>
              </div>

              <div class="md:col-span-2 space-y-1.5">
                <label class="text-[9px] font-black text-slate-900 uppercase tracking-widest">ADRESSE DE RÉSIDENCE :</label>
                <input type="text" formControlName="adresse" class="w-full p-3 border-2 border-slate-100 bg-slate-50/50 focus:bg-white focus:border-emerald-600 rounded-xl transition-all font-bold uppercase text-sm outline-none" placeholder="Numéro, Rue, Code Postal, Ville">
              </div>

              <div class="space-y-1.5">
                <label class="text-[9px] font-black text-slate-900 uppercase tracking-widest">DATE DÉBUT ACTIVITÉ :</label>
                <div class="relative">
                  <input type="text" formControlName="dateDebut" placeholder="JJ/MM/AAAA" class="w-full p-3 border-2 border-slate-100 bg-slate-50/50 focus:bg-white focus:border-emerald-600 rounded-xl transition-all font-bold text-sm outline-none">
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="text-[9px] font-black text-slate-900 uppercase tracking-widest opacity-60">DATE FIN ACTIVITÉ :</label>
                <input type="text" formControlName="dateFin" placeholder="JJ/MM/AAAA" class="w-full p-3 border-2 border-slate-100 bg-slate-50/50 focus:bg-white focus:border-emerald-600 rounded-xl transition-all font-bold text-sm outline-none">
              </div>
            </div>
          </div>

          <!-- CADRE B: DÉCLARATION DE L'EMPLOYEUR -->
          <div class="relative pt-8 border-t-2 border-slate-900">
            <div class="absolute -top-[14px] left-0 bg-slate-900 px-6 py-1.5 text-white font-black text-[10px] uppercase tracking-widest rounded-full">
              CADRE B : DÉCLARATION DE L'EMPLOYEUR
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
              <div class="md:col-span-2 space-y-1.5">
                <label class="text-[9px] font-black text-slate-700 uppercase tracking-widest">NOM EMPLOYEUR :</label>
                <input type="text" formControlName="nomEmployeur" class="w-full p-3 border-2 border-slate-100 bg-slate-50/50 focus:bg-white focus:border-slate-900 rounded-xl transition-all font-bold uppercase text-sm outline-none">
              </div>
              <div class="space-y-1.5">
                <label class="text-[9px] font-black text-slate-700 uppercase tracking-widest">N° AFFILIATION (CODE EMPLOYEUR) :</label>
                <input type="text" formControlName="codeEmployeur" class="w-full p-3 border-2 border-slate-100 bg-slate-50/50 focus:bg-white focus:border-slate-900 rounded-xl transition-all font-mono print:tracking-normal tracking-[0.2em] text-sm font-bold outline-none" placeholder="0000000">
              </div>
              <div class="space-y-1.5">
                <label class="text-[9px] font-black text-slate-700 uppercase tracking-widest">DATE AFFILIATION :</label>
                <input type="text" formControlName="dateAffiliation" placeholder="JJ/MM/AAAA" class="w-full p-3 border-2 border-slate-100 bg-slate-50/50 focus:bg-white focus:border-slate-900 rounded-xl transition-all font-bold text-sm outline-none">
              </div>
            </div>
          </div>

          <!-- CADRE C: NATURE DE L'AVANTAGE SOLLICITÉ -->
          <div class="space-y-6"
               [class.border-red-500]="dossierForm.get('typeDossier')?.invalid && dossierForm.get('typeDossier')?.touched">
            <div class="flex items-center gap-4">
              <span class="text-xs font-black text-emerald-800 uppercase tracking-widest whitespace-nowrap"
                    [class.text-red-600]="dossierForm.get('typeDossier')?.invalid && dossierForm.get('typeDossier')?.touched">
                ✦ CADRE C : NATURE DE L'AVANTAGE SOLLICITÉ
                @if (dossierForm.get('typeDossier')?.invalid && dossierForm.get('typeDossier')?.touched) {
                  <span class="ml-2 font-black text-red-600/80">(REQUIS)</span>
                }
              </span>
              <div class="h-[2px] bg-emerald-600 flex-1"
                   [class.bg-red-500]="dossierForm.get('typeDossier')?.invalid && dossierForm.get('typeDossier')?.touched"></div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12 pt-2 p-2 rounded-xl transition-all"
                 [ngClass]="{'bg-red-50/20': dossierForm.get('typeDossier')?.invalid && dossierForm.get('typeDossier')?.touched}">
              @for (t of types; track t) {
                <label class="flex items-center gap-4 cursor-pointer group select-none py-1.5 hover:text-emerald-800 transition-colors">
                  <input type="radio" formControlName="typeDossier" [value]="t" class="sr-only">
                  
                  <!-- Custom Square Checkbox (matching ☐ / ☒ beautifully) -->
                  <div class="w-5 h-5 border-2 border-slate-800 flex items-center justify-center font-bold text-xs shrink-0 select-none transition-all group-hover:border-emerald-600 bg-white"
                       [ngClass]="{
                         'border-emerald-700': dossierForm.get('typeDossier')?.value === t,
                         'bg-emerald-50/50': dossierForm.get('typeDossier')?.value === t
                       }">
                    @if (dossierForm.get('typeDossier')?.value === t) {
                      <span class="text-slate-900 font-extrabold text-[12px] leading-none mb-[1px]">✕</span>
                    }
                  </div>

                  <span class="text-[10px] font-black text-slate-800 uppercase tracking-widest leading-none">AVANTAGE : {{ t }}</span>
                </label>
              }
            </div>
          </div>

          <!-- SIGNATURES -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8 h-48 mt-12">
            <div class="border-2 border-gray-200 p-6 flex flex-col justify-between rounded-lg">
              <div>
                <label class="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] block mb-4 border-b border-gray-100 pb-2">CERTIFICATION LOCALE</label>
                <div class="flex items-baseline gap-3 mt-4">
                  <span class="text-[11px] font-bold text-gray-700 uppercase">Fait à :</span>
                  <input type="text" formControlName="ville" class="flex-1 p-0 border-b-2 border-gray-100 focus:border-emerald-600 text-sm font-black uppercase outline-none bg-transparent">
                </div>
                <div class="flex items-baseline gap-3 mt-6">
                  <span class="text-[11px] font-bold text-gray-700 uppercase">En date du :</span>
                  <span class="text-sm font-black text-emerald-900">{{ today | date:'dd MMMM yyyy' }}</span>
                </div>
              </div>
            </div>
            <div class="border-2 border-gray-200 p-6 text-center relative overflow-hidden bg-gray-50/30 rounded-lg flex flex-col">
              <label class="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] border-b border-gray-100 pb-2">SIGNATURE DE L'ASSURÉ(E)</label>
              
              <div class="flex-1 flex flex-col items-center justify-center">
                 <!-- Tampon de signature numérique stylisé -->
                <div class="relative w-48 h-24 border-4 border-emerald-600/40 rounded-3xl rotate-[-5deg] flex flex-col items-center justify-center bg-white/20 backdrop-blur-[1px] shadow-sm">
                  <div class="absolute -top-3 bg-white px-2 text-[8px] font-black text-emerald-900 uppercase">Electronic Signature</div>
                  <span class="text-[10px] font-black text-emerald-900 uppercase leading-tight">{{ user()?.nom }} {{ user()?.prenom }}</span>
                  <span class="text-[12px] font-serif italic text-slate-900 mt-1 opacity-70">Signature Digitale</span>
                  <span class="text-[8px] font-mono text-emerald-900/60 mt-1">CODE: {{ idPreuve }}</span>
                  <div class="absolute -bottom-2 -right-2 bg-amber-500 text-white p-1 rounded-full shadow-sm">
                    <mat-icon class="text-[12px] w-3 h-3">verified</mat-icon>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </form>

        <!-- Footer -->
        <div class="bg-emerald-900 p-10 flex justify-between items-center text-white">
          <div class="space-y-4 max-w-lg">
            <div class="flex items-start gap-3">
              <mat-icon class="text-amber-500">security</mat-icon>
              <div>
                <p class="text-[10px] font-black uppercase leading-none mb-1">Authentification Documentaire</p>
                <p class="text-[9px] text-emerald-100 leading-tight">Ce document est généré par le système d'Information de la CNSS Tunisie. Toute falsification est passible de poursuites pénales selon le code de sécurité sociale.</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-[9px] font-mono bg-white/10 px-2 py-1 rounded">ID: {{ idPreuve }}</span>
              <span class="text-[9px] font-mono bg-white/10 px-2 py-1 rounded">TS: {{ today | date:'yyyy-MM-dd:HH:mm:ss' }}</span>
              <span class="text-[9px] font-bold text-amber-500 uppercase tracking-widest border border-amber-500/30 px-2 py-1">CERTIFIED TN-SECURE</span>
            </div>
          </div>
          <div class="flex flex-col items-center gap-2">
            <div class="w-16 h-16 bg-white p-2 shadow-inner">
               <div class="w-full h-full border border-black grid grid-cols-4 gap-0.5">
                 @for (i of [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]; track i) {
                   <div class="bg-black" [class.bg-white]="(i+idPreuve.length) % 3 === 0"></div>
                 }
               </div>
            </div>
            <span class="text-[8px] font-black uppercase opacity-60">Scannez pour vérifier</span>
          </div>
        </div>
      </div>

      <!-- NEW: UPLOAD & AI VERIFICATION SECTION -->
      <div class="max-w-[210mm] mx-auto mt-12 space-y-8 print:hidden">
        <div class="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden overflow-hidden">
          <div class="bg-emerald-900 p-6 flex justify-between items-center">
            <div class="flex items-center gap-3 text-white">
              <mat-icon class="text-emerald-400">cloud_upload</mat-icon>
              <h2 class="text-lg font-black uppercase tracking-widest">Étape 2 : Dépôt & Vérification IA</h2>
            </div>
          </div>
          
          <div class="p-8 space-y-8">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div class="space-y-6">
                <div>
                  <h3 class="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">1. Sélectionner le PDF généré</h3>
                  <p class="text-xs text-slate-500 font-medium mb-4">Après avoir cliqué sur "Générer" ci-dessus et enregistré votre PDF, déposez-le ici.</p>
                </div>

                <div class="relative group">
                  <input #fileInput type="file" class="hidden" (change)="onFileSelected($event)" accept="application/pdf">
                  <div class="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 group-hover:border-emerald-500 bg-slate-50/50 group-hover:bg-emerald-50/30 transition-all cursor-pointer"
                       (click)="fileInput.click()">
                    <div class="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                      <mat-icon class="text-slate-400 group-hover:text-emerald-600 transition-colors">attach_file</mat-icon>
                    </div>
                    <div class="text-center">
                      <p class="text-sm font-black text-slate-800">
                        {{ selectedFile() ? selectedFile()?.name : 'Cliquer pour importer le PDF' }}
                      </p>
                      <p class="text-[9px] text-slate-400 mt-1 uppercase font-bold tracking-tight">PDF UNIQUEMENT (MAX 50MB)</p>
                    </div>
                  </div>
                </div>

                <div class="flex flex-col gap-3">
                  <button type="button" (click)="onUpload()" [disabled]="!selectedFile() || isVerifying()" 
                          class="w-full bg-slate-900 text-white py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-slate-800 transition-all font-black text-sm shadow-xl shadow-slate-900/20 disabled:opacity-50">
                    @if (isVerifying()) {
                      <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ANALYSE IA EN COURS...
                    } @else {
                      <mat-icon>verified</mat-icon>
                      VÉRIFIER ET FINALISER LE DÉPÔT
                    }
                  </button>
                  <p class="text-[10px] text-center text-slate-400 font-bold uppercase tracking-tighter italic">Vérification automatique par l'agent IA de la CNSS</p>
                </div>

                @if (errorMessage()) {
                  <div class="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl text-red-700 flex items-center gap-3">
                    <mat-icon class="text-sm">error_outline</mat-icon>
                    <span class="text-[10px] font-bold uppercase">{{ errorMessage() }}</span>
                  </div>
                }
              </div>

              <!-- AI RESULTS COLUMN -->
              <div class="space-y-6">
                <h3 class="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <mat-icon class="text-emerald-600">smart_toy</mat-icon>
                  Rapport d'analyse IA
                </h3>

                @if (verificationResult()) {
                  <div class="rounded-2xl border-2 overflow-hidden shadow-sm animate-in zoom-in duration-300" 
                       [class]="verificationResult()?.valide ? 'bg-emerald-50/50 border-emerald-100' : 'bg-red-50/50 border-red-100'">
                    
                    <div class="p-4 flex items-center justify-between" [class]="verificationResult()?.valide ? 'bg-emerald-600' : 'bg-red-600'">
                      <span class="text-[10px] font-black text-white uppercase tracking-widest">{{ verificationResult()?.scoreBadge }}</span>
                      <span class="text-xs font-mono font-black text-white">SCORE: {{ verificationResult()?.score }}%</span>
                    </div>

                    <div class="p-6 space-y-6">
                      <p class="text-xs font-bold text-slate-900">{{ verificationResult()?.resume }}</p>

                      @if (verificationResult()?.champsManquants?.length) {
                        <div class="bg-white p-3 rounded-xl border border-red-100">
                          <p class="text-[9px] font-black text-red-800 uppercase tracking-widest mb-2 flex items-center gap-1">
                            <mat-icon class="text-[12px] w-3 h-3">warning</mat-icon>
                            Champs manquants
                          </p>
                          <div class="flex flex-wrap gap-1.5">
                            @for (champ of verificationResult()?.champsManquants; track champ) {
                              <span class="bg-red-50 text-red-700 px-2 py-0.5 rounded text-[9px] font-bold border border-red-100">{{ champ }}</span>
                            }
                          </div>
                        </div>
                      }

                      @if (verificationResult()?.details) {
                        <div class="grid grid-cols-1 gap-2">
                          @for (detail of verificationResult()?.details | keyvalue; track detail.key) {
                            <div class="p-3 rounded-xl bg-white border border-slate-100 flex items-center gap-3">
                              <div class="w-2 h-2 rounded-full shrink-0" [class]="getSectionDetail(detail.value).statut === 'OK' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'"></div>
                              <div class="flex-1 min-w-0">
                                <p class="text-[9px] font-black uppercase text-slate-400 tracking-tighter truncate">{{ detail.key }}</p>
                                <p class="text-[10px] text-slate-700 font-medium truncate">{{ getSectionDetail(detail.value).commentaire }}</p>
                              </div>
                            </div>
                          }
                        </div>
                      }
                    </div>
                  </div>
                } @else {
                  <div class="h-full flex flex-col items-center justify-center py-12 text-slate-400 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100 italic">
                    <mat-icon class="text-4xl mb-3 opacity-20">insights</mat-icon>
                    <p class="text-[11px] font-medium tracking-tight uppercase">En attente d'une analyse...</p>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Information Box (Screen Only) -->
      <div class="max-w-[210mm] mx-auto mt-12 p-8 bg-white border border-gray-200 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] print:hidden">
        <div class="flex gap-6 items-start">
          <div class="p-4 bg-emerald-50 rounded-2xl">
            <mat-icon class="text-emerald-600 text-3xl h-auto w-auto">verified_user</mat-icon>
          </div>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-xl font-bold text-gray-900 font-sans tracking-tight">Comment obtenir 100/100 à la vérification ?</h3>
              <span class="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">Guide de conformité</span>
            </div>
            <p class="text-sm text-gray-600 leading-relaxed max-w-2xl">
              Votre dossier sera analysé par une IA de la CNSS. Pour garantir une validation immédiate, suivez scrupuleusement ces étapes :
            </p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div class="flex gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/30 group hover:bg-white hover:shadow-md transition-all">
                <span class="w-8 h-8 shrink-0 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-sm">1</span>
                <div>
                  <p class="font-bold text-sm text-gray-800 mb-1">Complétude</p>
                  <p class="text-xs text-gray-500 leading-normal">Remplissez tous les champs avec des informations réelles et vérifiables.</p>
                </div>
              </div>
              <div class="flex gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/30 group hover:bg-white hover:shadow-md transition-all">
                <span class="w-8 h-8 shrink-0 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-sm">2</span>
                <div>
                  <p class="font-bold text-sm text-gray-800 mb-1">Génération</p>
                  <p class="text-xs text-gray-500 leading-normal">Utilisez le bouton <strong>"GÉNÉRER LE PDF"</strong> pour ouvrir l'interface d'impression système.</p>
                </div>
              </div>
              <div class="flex gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/30 group hover:bg-white hover:shadow-md transition-all">
                <span class="w-8 h-8 shrink-0 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-sm">3</span>
                <div>
                  <p class="font-bold text-sm text-gray-800 mb-1">Sauvegarde</p>
                  <p class="text-xs text-gray-500 leading-normal">Dans le menu Destination, choisissez <strong>"Enregistrer au format PDF"</strong>. Cela permet à l'IA de lire le texte (Essentiel).</p>
                </div>
              </div>
              <div class="flex gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/30 group hover:bg-white hover:shadow-md transition-all">
                <span class="w-8 h-8 shrink-0 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-sm">4</span>
                <div>
                  <p class="font-bold text-sm text-gray-800 mb-1">Dépôt</p>
                  <p class="text-xs text-gray-500 leading-normal">Déposez le PDF généré sur votre tableau de bord dans "Nouveau Dossier".</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    input[type="date"]::-webkit-calendar-picker-indicator { cursor: pointer; opacity: 0.5; }
    input[type="date"]::-webkit-calendar-picker-indicator:hover { opacity: 1; }
    
    @media print {
      @page { 
        size: A4;
        margin: 10mm;
      }
      html, body {
        margin: 0;
        padding: 0;
        background: white !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        font-family: Arial, Helvetica, sans-serif !important;
      }
      .min-h-screen { 
        padding: 0 !important; 
        background: white !important;
        min-height: auto !important;
      }
      #official-form { 
        width: 100% !important;
        height: auto !important;
        max-width: none !important;
        margin: 0 !important;
        border: none !important;
        box-shadow: none !important;
        background: white !important;
        position: static !important;
      }
      .print\\:hidden { display: none !important; }
      
      /* Force display elements and clean for text recognition */
      * {
        box-shadow: none !important;
        text-shadow: none !important;
        filter: none !important;
      }

      input { 
        border: none !important; 
        border-bottom: 1pt solid #000 !important;
        background: transparent !important;
        padding: 0 !important;
        color: #000 !important;
        font-weight: bold !important;
        font-size: 10pt !important;
      }
      
      /* Force high contrast black on white for text extraction */
      .bg-emerald-900, .bg-slate-700, .bg-emerald-600 { 
        background-color: black !important; 
        color: white !important; 
      }
      .text-emerald-900, .text-slate-900, .text-gray-800, .text-gray-900 {
        color: black !important;
      }
      .bg-slate-50, .bg-emerald-50 { background-color: #f3f4f6 !important; }
      .border-emerald-900, .border-slate-700 { border-color: black !important; }
    }
  `]
})
export class DossierFormComponent implements OnInit {
  private authService = inject(AuthService);
  private dossierService = inject(DossierService);
  private aiVerificationService = inject(AiVerificationFrontendService);
  private fb: FormBuilder = inject(FormBuilder);
  private router: Router = inject(Router);

  user = this.authService.currentUser;
  today = new Date();
  idPreuve = Math.random().toString(36).substring(2, 11).toUpperCase();
  
  // States for upload
  selectedFile = signal<File | null>(null);
  isVerifying = signal(false);
  verificationResult = signal<AiVerificationResult | null>(null);
  errorMessage = signal<string>('');

  getSectionDetail(val: any): SectionDetail {
    if (val && (val.statut === 'VALIDE' || val.statut === 'OK' || val.statut === 'CONFORME')) {
      return { ...val, statut: 'OK' } as SectionDetail;
    }
    return val as SectionDetail;
  }
  
  // Terminologie exacte basée sur les formulaires CNSS Tunisie
  types = [
    'RETRAITE / VIEILLESSE', 
    'RÉGIME GÉNÉRAL', 
    'MALADIE PROFESSIONNELLE', 
    'ACCIDENT DE TRAVAIL', 
    'INDEMNITÉS JOURNALIÈRES', 
    'DÉCÈS / CAPITAL DÉCÈS', 
    'PENSION INVALIDITÉ'
  ];

  dossierForm: FormGroup = this.fb.group({
    dateNaissance: ['', Validators.required],
    adresse: ['', Validators.required],
    nomEmployeur: ['', Validators.required],
    codeEmployeur: ['', [Validators.required, Validators.pattern(/^[0-9]+$/)]],
    dateAffiliation: ['', Validators.required],
    typeDossier: ['', Validators.required],
    dateDebut: ['', Validators.required],
    dateFin: [''],
    ville: ['', Validators.required],
    dateSignature: [new Date().toISOString().split('T')[0], Validators.required]
  });

  ngOnInit() {
    if (!this.user()) this.router.navigate(['/login']);
  }

  generatePDF() {
    if (this.dossierForm.invalid) {
      this.dossierForm.markAllAsTouched();
      return;
    }

    const formElement = document.getElementById('official-form');
    if (!formElement) return;

    // 1. Cloner le formulaire pour ne pas toucher au DOM réel
    const clone = formElement.cloneNode(true) as HTMLElement;

    // 2. Injecter les vraies valeurs des champs texte/date dans le clone
    const realInputs = formElement.querySelectorAll('input[formcontrolname]');
    const cloneInputs = clone.querySelectorAll('input[formcontrolname]');

    realInputs.forEach((realInput, i) => {
      const real = realInput as HTMLInputElement;
      const cloneInput = cloneInputs[i] as HTMLInputElement;
      if (!cloneInput) return;

      if (real.type === 'radio') {
        cloneInput.checked = real.checked;
        if (real.checked) {
          cloneInput.setAttribute('checked', 'checked');
        }
      } else {
        cloneInput.setAttribute('value', real.value || '');
        cloneInput.value = real.value || '';
      }
    });

    // 3. Récupérer les styles Tailwind/Material déjà chargés
    const styleSheets = Array.from(document.styleSheets)
      .map(sheet => {
        try {
          return Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n');
        } catch {
          return sheet.href ? `@import url("${sheet.href}");` : '';
        }
      })
      .join('\n');

    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      alert("Veuillez autoriser les fenêtres pop-up pour générer le PDF.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Demande de Prestations</title>
          <style>
            ${styleSheets}
            @page { size: A4; margin: 10mm; }
            body { margin: 0; padding: 0; background: white; font-family: Arial, Helvetica, sans-serif; }
            #official-form { max-width: none !important; width: 100% !important; box-shadow: none !important; margin: 0 !important; }
            input {
              border: none !important;
              border-bottom: 1pt solid #000 !important;
              background: transparent !important;
              color: #000 !important;
              font-weight: bold !important;
            }
            input[type="radio"] { display: none !important; }
          </style>
        </head>
        <body>
          ${clone.outerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.onafterprint = () => printWindow.close();
    };
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        this.errorMessage.set('Veuillez sélectionner un fichier PDF.');
        return;
      }
      this.selectedFile.set(file);
      this.verificationResult.set(null);
      this.errorMessage.set('');
    }
  }

  async onUpload() {
    if (!this.selectedFile()) return;

    this.isVerifying.set(true);
    this.errorMessage.set('');
    this.verificationResult.set(null);

    let detectedType = '';
    
    // First, try to extract text and detect type from PDF checkbox marker or filename
    try {
      const filename = this.selectedFile()?.name;
      const text = await this.aiVerificationService.extractTextFromPdf(this.selectedFile()!);
      
      if (filename) {
        const fnUpper = filename.toUpperCase();
        if (fnUpper.includes('RETRAITE') || fnUpper.includes('VIEILLESSE')) {
          detectedType = 'Pension de Retraite Régime Général (Vieillesse)';
        } else if (fnUpper.includes('MALADIE') && (fnUpper.includes('PROF') || fnUpper.includes('PRO'))) {
          detectedType = 'Indemnités pour Maladie Professionnelle';
        } else if (fnUpper.includes('ACCIDENT') || fnUpper.includes('TRAVAIL')) {
          detectedType = 'Rente pour Accident de Travail';
        } else if (fnUpper.includes('INDEMNITE') || fnUpper.includes('JOURNALI')) {
          detectedType = 'Indemnités Journalières de Maladie';
        } else if (fnUpper.includes('DECES') || fnUpper.includes('CAPITAL') || fnUpper.includes('SURVIVANT')) {
          detectedType = 'Capital Décès de Survivants';
        } else if (fnUpper.includes('INVALID')) {
          detectedType = 'Pension d\'Invalidité';
        } else if (fnUpper.includes('GENERAL') || fnUpper.includes('REGIME')) {
          detectedType = 'Régime Général';
        }
      }

      if (!detectedType && text) {
        // Find all checkbox matches with their associated labels
        const regex = /(\\[[\\sXx]*\\]|☒|☑|☐)\\s*([^\\[☒☑☐\\n\\r]+)/gi;
        let match;
        
        while ((match = regex.exec(text)) !== null) {
          const marker = match[1];
          const label = match[2].toUpperCase();
          
          // Determine if checkmark is set
          const isChecked = marker.includes('X') || marker.includes('x') || marker === '☒' || marker === '☑';
          
          if (isChecked) {
            if (label.includes('RETRAITE') || label.includes('VIEILLESSE')) {
              detectedType = 'Pension de Retraite Régime Général (Vieillesse)';
              break;
            }
            if (label.includes('MALADIE PROFESSIONNELLE') || label.includes('MALADIE PROF')) {
              detectedType = 'Indemnités pour Maladie Professionnelle';
              break;
            }
            if (label.includes('ACCIDENT')) {
              detectedType = 'Rente pour Accident de Travail';
              break;
            }
            if (label.includes('INDEMNITÉ') || label.includes('INDEMNITE') || label.includes('JOURNALI')) {
              detectedType = 'Indemnités Journalières de Maladie';
              break;
            }
            if (label.includes('DÉCÈS') || label.includes('DECES') || label.includes('CAPITAL')) {
              detectedType = 'Capital Décès de Survivants';
              break;
            }
            if (label.includes('INVALIDITÉ') || label.includes('INVALIDITE')) {
              detectedType = 'Pension d\'Invalidité';
              break;
            }
            if (label.includes('RÉGIME GÉNÉRAL') || label.includes('REGIME GENERAL') || label.includes('GENERAL')) {
              detectedType = 'Régime Général';
              break;
            }
          }
        }

        // Secondary fallback checking: Do keyword matching ONLY if no checkboxes matched
        if (!detectedType) {
          const textUpper = text.toUpperCase();
          if (textUpper.includes('MALADIE PROFESSIONNELLE')) {
            detectedType = 'Indemnités pour Maladie Professionnelle';
          } else if (textUpper.includes('ACCIDENT DE TRAVAIL')) {
            detectedType = 'Rente pour Accident de Travail';
          } else if (textUpper.includes('INDEMNITÉS JOURNALIÈRES')) {
            detectedType = 'Indemnités Journalières de Maladie';
          } else if (textUpper.includes('DÉCÈS / CAPITAL DÉCÈS')) {
            detectedType = 'Capital Décès de Survivants';
          } else if (textUpper.includes('PENSION INVALIDITÉ')) {
            detectedType = 'Pension d\'Invalidité';
          } else if (textUpper.includes('RETRAITE / VIEILLESSE')) {
            detectedType = 'Pension de Retraite Régime Général (Vieillesse)';
          }
        }
      }
    } catch (e) {
      console.warn('Could not extract text locally from form uploader:', e);
    }

    // Secondary fallback: if still not detected, fallback to current form control value (since it's the current form)
    if (!detectedType) {
      const formVal = this.dossierForm.get('typeDossier')?.value;
      if (formVal) {
        if (formVal.includes('RETRAITE') || formVal.includes('VIEILLESSE')) {
          detectedType = 'Pension de Retraite Régime Général (Vieillesse)';
        } else if (formVal.includes('MALADIE')) {
          detectedType = 'Indemnités pour Maladie Professionnelle';
        } else if (formVal.includes('ACCIDENT')) {
          detectedType = 'Rente pour Accident de Travail';
        } else if (formVal.includes('INDEMNITÉ') || formVal.includes('JOURNALI')) {
          detectedType = 'Indemnités Journalières de Maladie';
        } else if (formVal.includes('DÉCÈS')) {
          detectedType = 'Capital Décès de Survivants';
        } else if (formVal.includes('INVALIDITÉ')) {
          detectedType = 'Pension d\'Invalidité';
        } else if (formVal.includes('RÉGIME')) {
          detectedType = 'Régime Général';
        } else {
          detectedType = formVal;
        }
      }
    }

    // Final Upload to Backend - let the backend handle IA verification
    this.dossierService.uploadDossier(this.selectedFile()!, 0, false, detectedType).subscribe({
      next: (response) => {
        this.verificationResult.set(response.aiVerification);
        this.isVerifying.set(false);
        // Success notification or redirection
        setTimeout(() => this.router.navigate(['/dashboard']), 3000);
      },
      error: (error: HttpErrorResponse) => {
        this.isVerifying.set(false);
        if (error.status === 400 && error.error?.erreur === 'FORMULAIRE_INVALIDE') {
          // The backend returns the verification report in the error body
          this.verificationResult.set(error.error.aiVerification);
          this.errorMessage.set(error.error.message);
        } else {
          this.errorMessage.set(error.error?.message || 'Erreur lors de l\'envoi du dossier.');
        }
      }
    });
  }
}