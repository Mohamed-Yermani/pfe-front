import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Dossier, DossierStatistics, AiVerificationResult, DossierUploadResponse } from '../models/dossier.model';

@Injectable({
  providedIn: 'root'
})
export class DossierService {
  private http = inject(HttpClient);
  private apiUrl = '/api/dossiers';

  telechargerFormulaire(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/formulaire`, { responseType: 'blob' });
  }

  uploadDossier(file: File, aiScore: number = 0, aiValide: boolean = false, typeAvantage?: string): Observable<DossierUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('aiScore', aiScore.toString());
    formData.append('aiValide', aiValide.toString());
    if (typeAvantage) {
      formData.append('typeAvantage', typeAvantage);
    }
    return this.http.post<DossierUploadResponse>(`${this.apiUrl}/upload`, formData);
  }

  preVerifier(file: File): Observable<AiVerificationResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<AiVerificationResult>(`${this.apiUrl}/pre-verifier`, formData);
  }

  getUserDossiers(): Observable<Dossier[]> {
    return this.http.get<Dossier[]>(`${this.apiUrl}/my-dossiers`);
  }

  getAllDossiers(): Observable<Dossier[]> {
    return this.http.get<Dossier[]>(`${this.apiUrl}/all`);
  }

  getDossiersEnAttente(): Observable<Dossier[]> {
    return this.http.get<Dossier[]>(`${this.apiUrl}/en-attente`);
  }

  getDossiersValidesLocal(): Observable<Dossier[]> {
    return this.http.get<Dossier[]>(`${this.apiUrl}/valides-local`);
  }

  validerLocal(id: number): Observable<Dossier> {
    return this.http.put<Dossier>(`${this.apiUrl}/${id}/valider-local`, {});
  }

  validerGlobal(id: number): Observable<Dossier> {
    return this.http.put<Dossier>(`${this.apiUrl}/${id}/valider-global`, {});
  }

  refuserDossier(id: number, motif: string): Observable<Dossier> {
    const params = new HttpParams().set('motif', motif);
    return this.http.put<Dossier>(`${this.apiUrl}/${id}/refuser`, {}, { params });
  }

  downloadDossier(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/download`, { responseType: 'blob' });
  }

  deleteDossier(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getStatistics(): Observable<DossierStatistics> {
    return this.http.get<DossierStatistics>(`${this.apiUrl}/statistics`);
  }
}
