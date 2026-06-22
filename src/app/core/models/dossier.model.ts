export interface Dossier {
  id: number;
  cin: string;
  fileName: string;
  alfrescoNodeId: string;
  statut: 'EN_ATTENTE' | 'VALIDATION_LOCALE' | 'VALIDE' | 'REFUSE';
  motifRefus?: string;
  agentEmail?: string;
  userId: number;
  dateUpload: string;
  dateTraitement?: string;
  typeAvantage?: string;
  // AI Results
  aiScore?: number;
  aiValide?: boolean;
  aiResume?: string;
  aiDetailsJson?: string;
  user?: {
    id: number;
    email: string;
    nom: string;
    prenom: string;
    cin: string;
    numeroAssure: string;
    telephone?: string;
  };
}

export interface SectionDetail {
  statut: string;
  commentaire: string;
}

export type TypePiece = 
  | 'CIN' 
  | 'EXTRAIT_NAISSANCE' 
  | 'ATTESTATION_TRAVAIL' 
  | 'ATTESTATION_SALAIRE' 
  | 'FORMULAIRE_SIGNE' 
  | 'CERTIFICAT_MEDICAL' 
  | 'AUTRE';

export interface PieceJustificative {
  id: number;
  dossierId?: number;
  typePiece: TypePiece;
  libelle?: string;
  fileName: string;
  minioPath?: string;
  statut: 'EN_ATTENTE' | 'VALIDE' | 'REFUSE';
  motifRefus?: string;
  dateUpload: string;
}

export interface PiecesRequisesResponse {
  typeAvantage: string;
  totalPieces: number;
  piecesObligatoires: number;
  pieces: RequiredPieceInfo[];
}

export interface RequiredPieceInfo {
  type: TypePiece;
  libelle: string;
  obligatoire: boolean;
  formatsAcceptes: string[];
}

export interface AiVerificationResult {
  valide: boolean;
  score: number;
  scoreBadge: 'EXCELLENT' | 'BON' | 'MOYEN' | 'FAIBLE';
  resume: string;
  champsManquants: string[];
  champsInvalides: string[];
  message?: string;
  details?: {
    identiteAssure?: SectionDetail;
    informationsEmployeur?: SectionDetail;
    typeDossier?: SectionDetail;
    periode?: SectionDetail;
    signature?: SectionDetail;
    coherenceGlobale?: SectionDetail;
  };
}

export interface DossierUploadResponse {
  id: number;
  fileName: string;
  statut: string;
  dateUpload: string;
  aiVerification: AiVerificationResult;
}

export interface DossierStatistics {
  total: number;
  enAttente: number;
  validationLocale: number;
  valides: number;
  refuses: number;
  avgAiScore?: number;
  aiValidated?: number;
}
