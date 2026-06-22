import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as pdfjsLib from 'pdfjs-dist';
import { firstValueFrom } from 'rxjs';
import { AiVerificationResult } from '../models/dossier.model';

// Set worker path for pdfjs in a way that Vite can analyze
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

@Injectable({
  providedIn: 'root'
})
export class AiVerificationFrontendService {
  private http = inject(HttpClient);

  async extractTextFromPdf(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    try {
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');

        fullText += pageText + '\n';
      }

      const trimmedText = fullText.trim();
      if (!trimmedText) {
        throw new Error("Impossible d'extraire du texte de ce PDF. Il s'agit probablement d'une image ou d'un document scanné.");
      }

      return trimmedText;
    } catch (error) {
      console.error('Text extraction failed:', error);
      if (error instanceof Error && error.message.includes('Impossible d\'extraire')) {
        throw error;
      }
      throw new Error("Erreur technique lors de la lecture du PDF. Assurez-vous que le fichier n'est pas corrompu.");
    }
  }

  /**
   * Envoie le fichier PDF directement au backend pour vérification IA,
   * en passant par la route existante POST /api/dossiers/pre-verifier
   * (multipart/form-data), au lieu d'une route JSON /api/ai/verify
   * qui n'existe pas côté serveur.
   */
  async verifyDossier(file: File): Promise<AiVerificationResult> {
    try {
      console.log('Sending PDF file to server for AI analysis...', { fileName: file.name });

      const formData = new FormData();
      formData.append('file', file);

      const response: any = await firstValueFrom(
        this.http.post('/api/dossiers/pre-verifier', formData)
      );

      console.log('Server AI verification response:', response);

      return {
        ...response,
        scoreBadge: response.scoreBadge || this.getBadge(response.score || 0),
        details: response.details || {}
      };
    } catch (error: any) {
      console.error('Server-side AI verification failed:', error);
      let errMsg = 'Erreur lors de la vérification AI. Vérifiez la connexion avec le serveur.';
      if (error && error.error && error.error.message) {
        errMsg = `Erreur de vérification AI: ${error.error.message}`;
        if (error.error.error) {
          errMsg += ` (${error.error.error})`;
        }
      }
      throw new Error(errMsg);
    }
  }

  private getBadge(score: number): 'EXCELLENT' | 'BON' | 'MOYEN' | 'FAIBLE' {
    if (score >= 90) return 'EXCELLENT';
    if (score >= 70) return 'BON';
    if (score >= 50) return 'MOYEN';
    return 'FAIBLE';
  }
}