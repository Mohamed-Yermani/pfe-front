
export interface UserDto {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    numeroAssure?: string;
    cin?: string;
    telephone?: string;
    enabled: boolean;
    roles: string[];
}
  
export interface AuthResponse {
    token: string;
    email: string;
    role: string;
    id: number;
}

export interface RegisterRequest {
    nom: string;
    prenom: string;
    email: string;
    password?: string;
    cin: string;
    numeroAssure: string;
    telephone?: string;
    role: 'ROLE_ASSURE' | 'ROLE_AGENT_CNSS';
}

export interface CreateAgentRequest extends RegisterRequest {
    role: 'ROLE_AGENT_CNSS';
}

export interface UpdateAgentRequest {
    email: string;
    numeroAssure: string;
    nom: string;
    prenom: string;
    cin: string;
    telephone: string;
}

export interface AuditLog {
    id: number;
    action: string;
    entityType: string;
    entityId: number;
    performedBy: string;
    timestamp: string;
    details?: string;
}

export interface DashboardStats {
    totalUsers: number;
    totalAgents: number;
    activeAgents: number;
    recentLogins: number;
}
