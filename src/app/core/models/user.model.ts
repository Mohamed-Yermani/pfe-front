export enum ERole {
  ROLE_ASSURE = 'ROLE_ASSURE',
  ROLE_AGENT_CNSS = 'ROLE_AGENT_CNSS',
  ROLE_AGENT_BUREAU = 'ROLE_AGENT_BUREAU',
  ROLE_AGENT_DIRECTION = 'ROLE_AGENT_DIRECTION',
  ROLE_ADMIN = 'ROLE_ADMIN'
}

export interface Role {
  id: number;
  name: ERole;
  authority: string;
}

export interface User {
  id: number;
  email: string;
  numeroAssure?: string;
  nom: string;
  prenom: string;
  cin?: string;
  telephone?: string;
  roles: Role[];
  enabled: boolean;
}

export interface UserDto {
  id: number;
  email: string;
  numeroAssure?: string;
  nom: string;
  prenom: string;
  cin?: string;
  telephone?: string;
  roles: string[];
  enabled: boolean;
}
