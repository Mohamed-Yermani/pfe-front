import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserDto } from '../models/api.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = '/api/users';

  getCurrentUser(): Observable<UserDto> {
    return this.http.get<UserDto>(`${this.apiUrl}/me`);
  }

  getUserById(id: number): Observable<UserDto> {
    return this.http.get<UserDto>(`${this.apiUrl}/${id}`);
  }

  getAllUsers(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(this.apiUrl);
  }

  getUserByEmail(email: string): Observable<UserDto> {
    return this.http.get<UserDto>(`${this.apiUrl}/email/${email}`);
  }

  toggleUserStatus(id: number, enabled: boolean): Observable<UserDto> {
    return this.http.patch<UserDto>(
      `${this.apiUrl}/${id}/status`,
      { enabled }
    );
  }

  // ✅ Mise à jour du profil de l'utilisateur connecté
  updateProfile(payload: { prenom: string; nom: string; telephone: string }): Observable<UserDto> {
    return this.http.put<UserDto>(`${this.apiUrl}/me`, payload);
  }
}