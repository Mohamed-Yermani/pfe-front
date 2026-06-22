import { UserDto } from './user.model';

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface AuthResponse {
  accessToken: string;
  user?: UserDto;
}

export interface RegisterRequest {
  prenom: string;
  nom: string;
  email: string;
  password?: string;
  numeroAssure?: string;
  cin?: string;
  telephone?: string;
}

export interface RegistrationResponse {
  message: string;
  success?: boolean;
  user?: UserDto;
}

export interface PasswordResetRequest {
  email: string;
}

export interface NewPasswordRequest {
  token: string;
  newPassword?: string;
}

export interface CreateAgentRequest {
  prenom: string;
  nom: string;
  email: string;
  password?: string;
}

export interface UpdateAgentRequest {
  prenom: string;
  nom: string;
  email: string;
}

export interface ChangePasswordRequest {
  oldPassword?: string;
  newPassword?: string;
}
