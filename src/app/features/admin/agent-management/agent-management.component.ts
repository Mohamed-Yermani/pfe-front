import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AgentService } from '../../../core/services/agent.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-agent-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <!-- Header CNSS Institutionnel -->
      <div class="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-2xl p-6 text-white shadow-md border-b-4 border-amber-500">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
              <mat-icon class="scale-125 !w-8 !h-8 text-amber-400">admin_panel_settings</mat-icon>
            </div>
            <div>
              <span class="text-xs font-semibold uppercase tracking-wider text-blue-200">Royaume du Maroc</span>
              <h1 class="text-2xl font-bold tracking-tight">Caisse Nationale de Sécurité Sociale (CNSS)</h1>
              <p class="text-sm text-blue-100 mt-1">Espace Administration — Registre Officiel de Gestion des Agents</p>
            </div>
          </div>
          <div>
            <button (click)="openAddForm()" class="bg-amber-500 text-blue-950 font-bold px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-amber-400 active:scale-95 transition-all shadow-lg shadow-amber-500/20 border border-amber-300">
              <mat-icon class="font-bold">add_circle</mat-icon>
              Créer un nouvel Agent
            </button>
          </div>
        </div>
      </div>

      <!-- Statistiques des Habilitations -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div class="p-3 bg-blue-50 text-blue-900 rounded-lg">
            <mat-icon class="!w-6 !h-6">people</mat-icon>
          </div>
          <div>
            <span class="text-xs text-gray-500 font-medium uppercase">Total des Agents</span>
            <p class="text-2xl font-bold text-gray-900">{{ agents().length }}</p>
          </div>
        </div>

        <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div class="p-3 bg-emerald-50 text-emerald-700 rounded-lg">
            <mat-icon class="!w-6 !h-6">check_circle</mat-icon>
          </div>
          <div>
            <span class="text-xs text-gray-500 font-medium uppercase">Comptes Actifs</span>
            <p class="text-2xl font-bold text-emerald-700">{{ activeCount() }}</p>
          </div>
        </div>

        <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div class="p-3 bg-rose-50 text-rose-700 rounded-lg">
            <mat-icon class="!w-6 !h-6">block</mat-icon>
          </div>
          <div>
            <span class="text-xs text-gray-500 font-medium uppercase">Comptes Inactifs</span>
            <p class="text-2xl font-bold text-rose-700">{{ inactiveCount() }}</p>
          </div>
        </div>

        <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div class="p-3 bg-amber-50 text-amber-700 rounded-lg">
            <mat-icon class="!w-6 !h-6">security</mat-icon>
          </div>
          <div>
            <span class="text-xs text-gray-500 font-medium uppercase">Administrateurs</span>
            <p class="text-2xl font-bold text-amber-700">{{ adminCount() }}</p>
          </div>
        </div>
      </div>

      <!-- Formulaire de Saisie (Créer / Modifier) -->
      @if (showAddForm()) {
        <div class="bg-white p-6 rounded-2xl shadow-md border-t-4 border-blue-900 border-x border-b border-gray-200 animate-fadeIn">
          <div class="flex justify-between items-center pb-4 mb-6 border-b border-gray-100">
            <div class="flex items-center gap-2">
              <mat-icon class="text-blue-900">badge</mat-icon>
              <h2 class="text-lg font-bold text-gray-900">
                {{ getFormTitle() }}
              </h2>
            </div>
            <button (click)="cancelEdit()" class="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          @if (errorMessage()) {
            <div class="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm font-medium flex items-center gap-2">
              <mat-icon class="!w-5 !h-5 text-rose-600">error_outline</mat-icon>
              {{ errorMessage() }}
            </div>
          }

          <form [formGroup]="agentForm" (ngSubmit)="onSubmit()" class="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            <!-- Nom -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-gray-700 uppercase tracking-wider block">Nom de famille</label>
              <div class="relative">
                <mat-icon class="absolute left-3 top-2.5 text-gray-400 !w-5 !h-5 text-sm">person</mat-icon>
                <input formControlName="nom" type="text" placeholder="ex. El Alami" 
                       class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-950 focus:border-blue-950 outline-none transition-all text-sm font-medium text-gray-900">
              </div>
              @if (agentForm.get('nom')?.invalid && agentForm.get('nom')?.touched) {
                <span class="text-xs text-red-600 font-medium block">Le nom est obligatoire.</span>
              }
            </div>

            <!-- Prénom -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-gray-700 uppercase tracking-wider block">Prénom</label>
              <div class="relative">
                <mat-icon class="absolute left-3 top-2.5 text-gray-400 !w-5 !h-5 text-sm">person_outline</mat-icon>
                <input formControlName="prenom" type="text" placeholder="ex. Youssef" 
                       class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-950 focus:border-blue-950 outline-none transition-all text-sm font-medium text-gray-900">
              </div>
              @if (agentForm.get('prenom')?.invalid && agentForm.get('prenom')?.touched) {
                <span class="text-xs text-red-600 font-medium block">Le prénom est obligatoire.</span>
              }
            </div>

            <!-- Email -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-gray-700 uppercase tracking-wider block">Adresse Email Professionnelle</label>
              <div class="relative">
                <mat-icon class="absolute left-3 top-2.5 text-gray-400 !w-5 !h-5 text-sm">email</mat-icon>
                <input formControlName="email" type="email" placeholder="y.elalami@cnss.ma" 
                       class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-950 focus:border-blue-950 outline-none transition-all text-sm font-medium text-gray-900">
              </div>
              @if (agentForm.get('email')?.invalid && agentForm.get('email')?.touched) {
                <span class="text-xs text-red-600 font-medium block">Veuillez renseigner un email valide.</span>
              }
            </div>

            <!-- CIN -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-gray-700 uppercase tracking-wider block">Numéro de CIN</label>
              <div class="relative">
                <mat-icon class="absolute left-3 top-2.5 text-gray-400 !w-5 !h-5 text-sm">fingerprint</mat-icon>
                <input formControlName="cin" type="text" placeholder="ex. AB123456" 
                       class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-950 focus:border-blue-950 outline-none transition-all text-sm font-medium text-gray-900">
              </div>
              @if (agentForm.get('cin')?.invalid && agentForm.get('cin')?.touched) {
                <span class="text-xs text-red-600 font-medium block">La carte d'identité (CIN) est obligatoire.</span>
              }
            </div>

            <!-- Numéro Assuré -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-gray-700 uppercase tracking-wider block">Numéro d'Immatriculation Assuré</label>
              <div class="relative">
                <mat-icon class="absolute left-3 top-2.5 text-gray-400 !w-5 !h-5 text-sm">assignment_ind</mat-icon>
                <input formControlName="numeroAssure" type="text" placeholder="ex. 1029384756" 
                       class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-950 focus:border-blue-950 outline-none transition-all text-sm font-medium text-gray-900">
              </div>
              @if (agentForm.get('numeroAssure')?.invalid && agentForm.get('numeroAssure')?.touched) {
                <span class="text-xs text-red-600 font-medium block">Le numéro d'assuré est obligatoire.</span>
              }
            </div>

            <!-- Téléphone -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-gray-700 uppercase tracking-wider block">Numéro de Téléphone</label>
              <div class="relative">
                <mat-icon class="absolute left-3 top-2.5 text-gray-400 !w-5 !h-5 text-sm">phone</mat-icon>
                <input formControlName="telephone" type="text" placeholder="ex. +212600000000" 
                       class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-950 focus:border-blue-950 outline-none transition-all text-sm font-medium text-gray-900">
              </div>
              <span class="text-xs text-gray-500 block font-medium">Format attendu : chiffres uniquement (8 à 15), avec ou sans + initial. Pas d'espaces ni de tirets.</span>
              @if (agentForm.get('telephone')?.invalid && agentForm.get('telephone')?.touched) {
                <span class="text-xs text-red-600 font-medium block">Le numéro de téléphone est obligatoire et doit être au format valide (ex. +212600000000).</span>
              }
            </div>

            <!-- Sélection du Rôle / Habilitation -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-gray-700 uppercase tracking-wider block">Rôle & Habilitation</label>
              <div class="relative">
                <mat-icon class="absolute left-3 top-2.5 text-gray-400 !w-5 !h-5 text-sm">admin_panel_settings</mat-icon>
                <select formControlName="role" 
                        class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-950 focus:border-blue-950 outline-none transition-all text-sm font-medium text-gray-900 bg-white cursor-pointer">
                  <option value="ROLE_AGENT_CNSS">Agent CNSS - Validation Générale</option>
                  <option value="ROLE_AGENT_BUREAU">Agent Bureau - Liquidation & Pièces</option>
                  <option value="ROLE_AGENT_DIRECTION">Agent Direction - Décisions de Liquidation</option>
                  <option value="ROLE_ADMIN">Administrateur du Système CNSS</option>
                </select>
              </div>
            </div>

            <!-- Mot de passe (Uniquement à la création) -->
            @if (!editingAgent()) {
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-gray-700 uppercase tracking-wider block">Mot de passe de Connexion</label>
                <div class="relative">
                  <mat-icon class="absolute left-3 top-2.5 text-gray-400 !w-5 !h-5 text-sm">lock</mat-icon>
                  <input formControlName="password" type="password" placeholder="••••••••" 
                         class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-950 focus:border-blue-950 outline-none transition-all text-sm font-medium text-gray-900">
                </div>
                <span class="text-xs text-gray-500 block font-medium">Exigence de sécurité : au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.</span>
                @if (agentForm.get('password')?.invalid && agentForm.get('password')?.touched) {
                  <span class="text-xs text-red-600 font-medium block">
                    Mot de passe requis et doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.
                  </span>
                }
              </div>
            }

            <!-- Boutons de Soumission -->
            <div class="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button type="button" (click)="cancelEdit()" 
                      class="px-5 py-2.5 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg active:scale-95 transition-all flex items-center gap-1">
                <mat-icon class="text-sm">cancel</mat-icon>
                Annuler
              </button>
              <button type="submit" [disabled]="agentForm.invalid" 
                      class="px-6 py-2.5 text-sm font-bold text-white bg-blue-900 hover:bg-blue-950 disabled:bg-gray-300 disabled:opacity-60 rounded-lg shadow-md active:scale-95 transition-all flex items-center gap-1.5">
                <mat-icon class="text-sm">save</mat-icon>
                {{ getSubmitButtonText() }}
              </button>
            </div>
          </form>
        </div>
      }

      <!-- Registre Officiel des Agents (Tableau) -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="p-5 border-b border-gray-100 bg-gray-50/55 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 class="text-lg font-bold text-gray-900">Registre Officiel des Agents CNSS</h3>
            <p class="text-xs text-gray-500 mt-0.5">Liste des agents de sécurité sociale et leurs privilèges d'accès</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-gray-500 uppercase">Filtre Rapide :</span>
            <div class="relative">
              <mat-icon class="absolute left-3 top-2 text-gray-400 !w-4 !h-4 text-xs">search</mat-icon>
              <input type="text" (input)="onSearch($any($event.target).value)" placeholder="Rechercher par nom, email..." 
                     class="pl-9 pr-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-950 outline-none w-64 bg-white">
            </div>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-blue-950 text-white uppercase text-xs tracking-wider font-semibold">
                <th class="px-6 py-4">Nom complet & Coordonnées</th>
                <th class="px-6 py-4">Identifiants Officiels</th>
                <th class="px-6 py-4">Habilitations & Rôles</th>
                <th class="px-6 py-4">Statut d'Activité</th>
                <th class="px-6 py-4 text-right">Actions de Sécurité</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 text-sm">
              @for (agent of filteredAgents(); track agent.id) {
                <tr class="hover:bg-blue-50/20 transition-all">
                  <!-- Nom et Email -->
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center font-bold text-sm shadow-inner">
                        {{ agent.prenom.charAt(0) }}{{ agent.nom.charAt(0) }}
                      </div>
                      <div class="flex flex-col">
                        <span class="font-bold text-gray-900 text-base">{{ agent.prenom }} {{ agent.nom }}</span>
                        <span class="text-xs text-gray-500 font-medium flex items-center gap-1 mt-0.5">
                          <mat-icon class="!w-4 !h-4 text-xs text-gray-400">email</mat-icon>
                          {{ agent.email }}
                        </span>
                      </div>
                    </div>
                  </td>

                  <!-- CIN & Numéro Assuré -->
                  <td class="px-6 py-4">
                    <div class="flex flex-col text-xs font-semibold text-gray-700 gap-1">
                      <span class="bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200 w-max flex items-center gap-1">
                        <mat-icon class="!w-4 !h-4 text-xs text-slate-500">fingerprint</mat-icon>
                        CIN: {{ agent.cin }}
                      </span>
                      <span class="bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200 w-max flex items-center gap-1">
                        <mat-icon class="!w-4 !h-4 text-xs text-slate-500">assignment_ind</mat-icon>
                        Assuré: {{ agent.numeroAssure }}
                      </span>
                    </div>
                  </td>

                  <!-- Rôles -->
                  <td class="px-6 py-4">
                    <div class="flex flex-wrap gap-1.5">
                      @for (role of getAgentRoles(agent); track role) {
                        @let cleanRole = getRoleName(role);
                        <span class="px-3 py-1 text-xs font-bold rounded-full shadow-sm border flex items-center gap-1"
                              [class.bg-blue-50]="cleanRole === 'AGENT_CNSS'"
                              [class.text-blue-900]="cleanRole === 'AGENT_CNSS'"
                              [class.border-blue-200]="cleanRole === 'AGENT_CNSS'"
                              
                              [class.bg-amber-50]="cleanRole === 'AGENT_BUREAU'"
                              [class.text-amber-900]="cleanRole === 'AGENT_BUREAU'"
                              [class.border-amber-200]="cleanRole === 'AGENT_BUREAU'"
                              
                              [class.bg-purple-50]="cleanRole === 'AGENT_DIRECTION'"
                              [class.text-purple-900]="cleanRole === 'AGENT_DIRECTION'"
                              [class.border-purple-200]="cleanRole === 'AGENT_DIRECTION'"
                              
                              [class.bg-rose-50]="cleanRole === 'ADMIN'"
                              [class.text-rose-900]="cleanRole === 'ADMIN'"
                              [class.border-rose-200]="cleanRole === 'ADMIN'"
                              
                              [class.bg-slate-50]="cleanRole !== 'AGENT_CNSS' && cleanRole !== 'AGENT_BUREAU' && cleanRole !== 'AGENT_DIRECTION' && cleanRole !== 'ADMIN'"
                              [class.text-slate-900]="cleanRole !== 'AGENT_CNSS' && cleanRole !== 'AGENT_BUREAU' && cleanRole !== 'AGENT_DIRECTION' && cleanRole !== 'ADMIN'"
                              [class.border-slate-200]="cleanRole !== 'AGENT_CNSS' && cleanRole !== 'AGENT_BUREAU' && cleanRole !== 'AGENT_DIRECTION' && cleanRole !== 'ADMIN'">
                          <mat-icon class="!w-4 !h-4 text-xs">
                            {{ cleanRole === 'ADMIN' ? 'security' : cleanRole === 'AGENT_DIRECTION' ? 'gavel' : cleanRole === 'AGENT_BUREAU' ? 'article' : 'account_balance' }}
                          </mat-icon>
                          {{ cleanRole === 'ADMIN' ? 'Administrateur' : cleanRole === 'AGENT_DIRECTION' ? 'Agent Direction' : cleanRole === 'AGENT_BUREAU' ? 'Agent Bureau' : 'Agent CNSS' }}
                        </span>
                      }
                    </div>
                  </td>

                  <!-- Statut -->
                  <td class="px-6 py-4">
                    <span [class]="agent.enabled ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'" 
                          class="px-3 py-1 text-xs font-bold rounded-full border shadow-inner inline-flex items-center gap-1">
                      <span class="w-1.5 h-1.5 rounded-full" [class]="agent.enabled ? 'bg-emerald-600' : 'bg-rose-600'"></span>
                      {{ agent.enabled ? 'Compte Actif' : 'Désactivé' }}
                    </span>
                  </td>

                  <!-- Actions -->
                  <td class="px-6 py-4 text-right">
                    <div class="flex justify-end items-center gap-2">
                      <!-- Bouton de modification -->
                      <button (click)="editAgent(agent)" 
                              class="px-3 py-1.5 text-xs font-bold text-blue-900 hover:bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-1 active:scale-95 transition-all shadow-sm cursor-pointer" 
                              title="Modifier les informations">
                        <mat-icon class="!w-4 !h-4 text-xs font-bold">edit</mat-icon>
                        Modifier
                      </button>

                      <!-- Bouton de blocage / réactivation -->
                      @if (agent.enabled) {
                        <button (click)="toggleAgentStatus(agent)" 
                                class="px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-1 active:scale-95 transition-all shadow-sm cursor-pointer" 
                                title="Bloquer cet agent">
                          <mat-icon class="!w-4 !h-4 text-xs font-bold">block</mat-icon>
                          Bloquer
                        </button>
                      } @else {
                        <button (click)="toggleAgentStatus(agent)" 
                                class="px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-1 active:scale-95 transition-all shadow-sm cursor-pointer" 
                                title="Réactiver cet agent">
                          <mat-icon class="!w-4 !h-4 text-xs font-bold">check_circle</mat-icon>
                          Réactiver
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="px-6 py-12 text-center text-gray-500">
                    <div class="flex flex-col items-center justify-center gap-2">
                      <mat-icon class="scale-150 text-gray-300">search_off</mat-icon>
                      <span class="font-semibold text-gray-600 mt-2">Aucun agent trouvé</span>
                      <p class="text-xs text-gray-400">Essayez de modifier vos critères de recherche ou ajoutez un agent.</p>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fadeIn {
      animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `]
})
export class AgentManagementComponent implements OnInit {
  private agentService = inject(AgentService);
  private fb = inject(FormBuilder);

  agents = signal<any[]>([]);
  searchQuery = signal<string>('');
  showAddForm = signal(false);
  editingAgent = signal<any | null>(null);
  errorMessage = signal<string>('');

  // ✅ Regex alignée avec le backend (@Pattern sur telephone)
  private readonly TELEPHONE_PATTERN = /^\+?[0-9]{8,15}$/;

  getFormTitle() {
    return this.editingAgent() ? "Modification du Profil de l'Agent" : "Enregistrement d'un Nouvel Agent";
  }

  getSubmitButtonText() {
    return this.editingAgent() ? "Sauvegarder les modifications" : "Confirmer l'Enregistrement";
  }

  getAgentRoles(agent: any): any[] {
    if (!agent) return [];
    if (agent.roles && agent.roles.length > 0) {
      return Array.isArray(agent.roles) ? agent.roles : Array.from(agent.roles);
    }
    if (agent.authorities && agent.authorities.length > 0) {
      return Array.isArray(agent.authorities) ? agent.authorities : Array.from(agent.authorities);
    }
    if (agent.role) {
      return [agent.role];
    }
    return [];
  }

  getRoleName(role: any): string {
    if (!role) return '';
    if (typeof role === 'string') {
      return role.replace('ROLE_', '');
    }
    if (typeof role === 'object') {
      const name = role.name || role.authority || '';
      return typeof name === 'string' ? name.replace('ROLE_', '') : '';
    }
    return '';
  }

  // Stats computed on the signal
  activeCount = () => this.agents().filter(u => u.enabled).length;
  inactiveCount = () => this.agents().filter(u => !u.enabled).length;
  adminCount = () => this.agents().filter(u => {
    const roles = this.getAgentRoles(u);
    return roles.some((r: any) => {
      const name = typeof r === 'string' ? r : (r?.name || r?.authority || '');
      return name === 'ROLE_ADMIN';
    });
  }).length;

  filteredAgents = () => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) {
      return this.agents();
    }
    return this.agents().filter(u => 
      (u.nom && u.nom.toLowerCase().includes(query)) ||
      (u.prenom && u.prenom.toLowerCase().includes(query)) ||
      (u.email && u.email.toLowerCase().includes(query)) ||
      (u.cin && u.cin.toLowerCase().includes(query)) ||
      (u.numeroAssure && u.numeroAssure.toLowerCase().includes(query))
    );
  };

  agentForm = this.fb.group({
    nom: ['', Validators.required],
    prenom: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    cin: ['', Validators.required],
    numeroAssure: ['', Validators.required],
    // ✅ Pattern alignée avec le backend dès le formulaire
    telephone: ['', [Validators.required, Validators.pattern(this.TELEPHONE_PATTERN)]],
    password: [''],
    role: ['', Validators.required]
  });

  ngOnInit() {
    this.loadAgents();
  }

  loadAgents() {
    this.agentService.getAllAgents().subscribe({
      next: (agents) => {
        this.agents.set(agents);
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement des agents:', err);
      }
    });
  }

  openAddForm() {
    this.editingAgent.set(null);
    this.errorMessage.set('');

    // ✅ setValue() explicite plutôt que reset() pour le select
    this.agentForm.setValue({
      nom: '',
      prenom: '',
      email: '',
      cin: '',
      numeroAssure: '',
      telephone: '',
      password: '',
      role: 'ROLE_AGENT_CNSS'   // ← valeur initiale explicite
    });

    this.agentForm.get('password')?.setValidators([
      Validators.required,
      Validators.minLength(8),
      Validators.maxLength(40),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    ]);
    this.agentForm.get('password')?.updateValueAndValidity();

    this.agentForm.get('telephone')?.setValidators([
      Validators.required,
      Validators.pattern(this.TELEPHONE_PATTERN)
    ]);
    this.agentForm.get('telephone')?.updateValueAndValidity();

    this.showAddForm.set(true);
  }

  // ✅ Nettoie le téléphone (retire espaces / tirets / points) avant envoi
  private sanitizePhone(value: string | null | undefined): string {
    if (!value) return '';
    return value.replace(/[\s.-]/g, '');
  }

  onSubmit() {
    if (this.agentForm.invalid) return;
    this.errorMessage.set('');

    const formValue = this.agentForm.getRawValue();
    const agentId = this.editingAgent()?.id;
    const cleanedTelephone = this.sanitizePhone(formValue.telephone);

    if (agentId) {
      // ✅ Payload propre pour update : pas de champ "password" envoyé inutilement,
      // téléphone nettoyé pour respecter le @Pattern backend
      const updatePayload = {
        nom: formValue.nom,
        prenom: formValue.prenom,
        email: formValue.email,
        cin: formValue.cin,
        numeroAssure: formValue.numeroAssure,
        telephone: cleanedTelephone,
        role: formValue.role
      };

      console.log('▶ updatePayload:', updatePayload);

      this.agentService.updateAgent(Number(agentId), updatePayload as any).subscribe({
        next: () => { this.loadAgents(); this.cancelEdit(); },
        error: (err: any) => {
          console.error('Erreur update:', err);
          console.error('Détail backend:', err.error);
          this.errorMessage.set(this.extractErrorMessage(err));
        }
      });
    } else {
      const roleToAgentType: Record<string, string> = {
        'ROLE_AGENT_CNSS':      'CNSS',
        'ROLE_AGENT_BUREAU':    'BUREAU',
        'ROLE_AGENT_DIRECTION': 'DIRECTION',
        'ROLE_ADMIN':           'ADMIN'
      };

      const selectedRole = formValue.role ?? 'ROLE_AGENT_CNSS';
      const agentType = roleToAgentType[selectedRole] ?? 'CNSS';

      // ✅ role inclus dans le body + agentType dans l'URL + téléphone nettoyé
      const createPayload = {
        nom:          formValue.nom,
        prenom:       formValue.prenom,
        email:        formValue.email,
        cin:          formValue.cin,
        numeroAssure: formValue.numeroAssure,
        telephone:    cleanedTelephone,
        password:     formValue.password,
        role:         selectedRole
      };

      console.log('▶ selectedRole:', selectedRole);
      console.log('▶ agentType:', agentType);
      console.log('▶ payload:', createPayload);

      this.agentService.createAgent(createPayload, agentType).subscribe({
        next: () => { this.loadAgents(); this.cancelEdit(); },
        error: (err: any) => {
          console.error('Erreur création:', err);
          console.error('Détail backend:', err.error);
          this.errorMessage.set(this.extractErrorMessage(err));
        }
      });
    }
  }

  editAgent(agent: any) {
    this.editingAgent.set(agent);
    this.showAddForm.set(true);
    this.errorMessage.set('');

    let determinedRole = 'ROLE_AGENT_CNSS';
    const roles = this.getAgentRoles(agent);
    if (roles.length > 0) {
      const firstRole = roles[0];
      determinedRole = typeof firstRole === 'string' ? firstRole : (firstRole?.name || firstRole?.authority || 'ROLE_AGENT_CNSS');
    }

    this.agentForm.patchValue({
      nom: agent.nom,
      prenom: agent.prenom,
      email: agent.email,
      cin: agent.cin,
      numeroAssure: agent.numeroAssure,
      telephone: agent.telephone,
      password: '',
      role: determinedRole
    });

    // En modification : pas de mot de passe requis
    this.agentForm.get('password')?.clearValidators();
    this.agentForm.get('password')?.updateValueAndValidity();

    // ✅ Le téléphone reste requis + pattern, même en modification
    this.agentForm.get('telephone')?.setValidators([
      Validators.required,
      Validators.pattern(this.TELEPHONE_PATTERN)
    ]);
    this.agentForm.get('telephone')?.updateValueAndValidity();
  }

  cancelEdit() {
    this.showAddForm.set(false);
    this.editingAgent.set(null);
    this.errorMessage.set('');
    this.agentForm.reset({ role: 'ROLE_AGENT_CNSS' });
  }

  toggleAgentStatus(agent: any) {
    const action = agent.enabled ? 
      this.agentService.deactivateAgent(Number(agent.id)) : 
      this.agentService.reactivateAgent(Number(agent.id));
    
    action.subscribe({
      next: () => {
        this.loadAgents();
      },
      error: (err: any) => {
        console.error('Erreur lors de la modification du statut:', err);
      }
    });
  }

  onSearch(value: string) {
    this.searchQuery.set(value);
  }

  // ✅ Extrait un message d'erreur lisible depuis la réponse backend
  private extractErrorMessage(err: any): string {
    const body = err?.error;
    if (!body) return "Une erreur est survenue lors de l'enregistrement.";

    if (typeof body === 'string') return body;
    if (body.message) return body.message;

    // Cas Spring validation: { errors: [{ field, message }, ...] } ou { fieldErrors: {...} }
    if (Array.isArray(body.errors)) {
      return body.errors.map((e: any) => e.message || `${e.field}: invalide`).join(' / ');
    }
    if (body.fieldErrors) {
      return Object.entries(body.fieldErrors)
        .map(([field, msg]) => `${field}: ${msg}`)
        .join(' / ');
    }

    return "Une erreur est survenue lors de l'enregistrement. Vérifiez les champs du formulaire.";
  }
}