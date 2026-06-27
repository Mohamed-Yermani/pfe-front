import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserDto, CreateAgentRequest, UpdateAgentRequest } from '../models/api.model';

@Injectable({ providedIn: 'root' })
export class AgentService {
  private http = inject(HttpClient);
  private apiUrl = '/api/admin/agents';

  createAgent(payload: any, agentType: string): Observable<any> {
    // ✅ agentType en query param ET role dans le body
    return this.http.post(
      `${this.apiUrl}/create?agentType=${agentType}`,
      payload
    );
  }

  getAgentById(id: number): Observable<UserDto> {
    return this.http.get<UserDto>(`${this.apiUrl}/${id}`);
  }

  getActiveAgents(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(`${this.apiUrl}/active`);
  }

  getAllAgents(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(this.apiUrl);
  }

  updateAgent(id: number, request: UpdateAgentRequest): Observable<UserDto> {
    return this.http.put<UserDto>(`${this.apiUrl}/${id}`, request);
  }

  deactivateAgent(id: number): Observable<UserDto> {
    return this.http.patch<UserDto>(`${this.apiUrl}/${id}/deactivate`, {});
  }

  reactivateAgent(id: number): Observable<UserDto> {
    return this.http.patch<UserDto>(`${this.apiUrl}/${id}/reactivate`, {});
  }

  // changeAgentPassword non implémenté pour l'instant
}