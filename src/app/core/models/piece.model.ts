export enum TypePiece {
  CIN = 'CIN',
  RELEVE_CARRIERE = 'RELEVE_CARRIERE',
  FORMULAIRE_ASSURANCE = 'FORMULAIRE_ASSURANCE',
  RIB = 'RIB',
  CERTIFICAT_MEDICAL = 'CERTIFICAT_MEDICAL',
  AUTRE = 'AUTRE'
}

export interface PieceJustificative {
  id: number;
  dossierId: number;
  typePiece: TypePiece;
  fileName: string;
  alfrescoNodeId: string;
  valide: boolean;
  motifRefus?: string;
  dateCreation?: string;
}
