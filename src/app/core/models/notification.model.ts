export interface AppNotification {
  id: number;
  userId?: string | number;
  titre: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER';
  lue: boolean;
  dateCreation: string;
  dossierId?: number;
  typeAvantage?: string;
  userEmail?: string;
  link?: string;
}
