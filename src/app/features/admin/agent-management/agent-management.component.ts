import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AgentService } from '../../../core/services/agent.service';
import { UserDto, UpdateAgentRequest, CreateAgentRequest } from '../../../core/models/api.model';
  

@Component({
  selector: 'app-agent-management',
  standalone: true,
  templateUrl: './agent-management.component.html',
  imports: [CommonModule, ReactiveFormsModule],
})
export class AgentManagementComponent implements OnInit {
  private agentService = inject(AgentService);
  // FIX: Explicitly type injected FormBuilder to avoid 'unknown' type error.
  private fb: FormBuilder = inject(FormBuilder);

  agents = signal<UserDto[]>([]);
  isModalOpen = signal(false);
  editingAgent = signal<UserDto | null>(null);

  agentForm!: FormGroup;

  ngOnInit(): void {
    this.loadAgents();
    this.agentForm = this.fb.group({
      prenom: ['', Validators.required],
      nom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      cin: ['', Validators.required],
      numeroAssure: ['', Validators.required],
      telephone: [''],
      password: [''],
    });
  }

  loadAgents(): void {
    this.agentService.getAllAgents().subscribe({
      next: (data) => this.agents.set(data),
      error: (err) => console.error('Failed to load agents', err),
    });
  }

  openCreateModal(): void {
    this.editingAgent.set(null);
    this.agentForm.reset();
    this.agentForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.agentForm.updateValueAndValidity();
    this.isModalOpen.set(true);
  }

  openEditModal(agent: UserDto): void {
    this.editingAgent.set(agent);
    this.agentForm.patchValue(agent);
    this.agentForm.get('password')?.clearValidators();
    this.agentForm.get('password')?.updateValueAndValidity();
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  onFormSubmit(): void {
    if (this.agentForm.invalid) return;

    if (this.editingAgent()) {
      const updateRequest: UpdateAgentRequest = this.agentForm.value;
      this.agentService.updateAgent(this.editingAgent()!.id, updateRequest).subscribe(() => this.onSuccess());
    } else {
      const createRequest: CreateAgentRequest = {
        ...this.agentForm.value,
        role: 'ROLE_AGENT_CNSS'
      };
      this.agentService.createAgent(createRequest).subscribe(() => this.onSuccess());
    }
  }
  
  deactivateAgent(id: number): void {
    if(confirm('Êtes-vous sûr de vouloir désactiver cet agent?')) {
      this.agentService.deactivateAgent(id).subscribe(() => this.onSuccess());
    }
  }

  reactivateAgent(id: number): void {
    if(confirm('Êtes-vous sûr de vouloir réactiver cet agent?')) {
      this.agentService.reactivateAgent(id).subscribe(() => this.onSuccess());
    }
  }

  private onSuccess(): void {
    this.loadAgents();
    this.closeModal();
  }
}