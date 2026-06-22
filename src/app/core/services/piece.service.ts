import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PieceJustificative, PiecesRequisesResponse, TypePiece } from '../models/dossier.model';

@Injectable({
  providedIn: 'root'
})
export class PieceService {
  private http = inject(HttpClient);
  private apiUrl = '/api/pieces';

  uploadPiece(dossierId: number, file: File, typePiece: TypePiece): Observable<PieceJustificative> {
    const formData = new FormData();
    formData.append('dossierId', dossierId.toString());
    formData.append('file', file);
    formData.append('typePiece', typePiece);
    return this.http.post<PieceJustificative>(`${this.apiUrl}/upload`, formData);
  }

  getPiecesByDossier(dossierId: number): Observable<PieceJustificative[]> {
    return this.http.get<PieceJustificative[]>(`${this.apiUrl}/dossier/${dossierId}`);
  }

  getPiecesRequises(typeAvantage: string): Observable<PiecesRequisesResponse> {
    return this.http.get<PiecesRequisesResponse>(`${this.apiUrl}/requises`, {
      params: { type: typeAvantage }
    });
  }

  downloadPiece(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/download`, { responseType: 'blob' });
  }

  validerPiece(id: number, valide: boolean, motif?: string): Observable<PieceJustificative> {
    return this.http.put<PieceJustificative>(`${this.apiUrl}/${id}/valider`, {}, {
      params: { valide, motif: motif || '' }
    });
  }
}
