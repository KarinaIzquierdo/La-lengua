import { authService } from './authService';

const API_BASE_URL = 'https://lalenguacolombia.co/api/index.php';

export type MissionLink = {
  id: number;
  mission_key: string;
  platform: 'gimkit' | 'kahoot' | 'quizizz' | 'custom';
  url: string;
  start_at?: string | null;
  expires_at?: string | null;
  is_active: boolean;
  notes?: string | null;
  audience_type?: 'global' | 'bloque' | 'student';
  audience_value?: string | null;
  user?: number | null;
  status: 'active' | 'upcoming' | 'expired' | 'inactive';
  created_at: string;
  updated_at: string;
};

export const missionService = {
  getAuthHeaders() {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    } as HeadersInit;
  },
  async list(mission_key?: string): Promise<MissionLink[]> {
    const q = mission_key ? `?mission_key=${encodeURIComponent(mission_key)}` : '';
    const res = await fetch(`${API_BASE_URL}/missions/links/${q}`, {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error('No se pudieron cargar las misiones');
    return res.json();
  },
  async create(payload: Partial<MissionLink>): Promise<MissionLink> {
    const res = await fetch(`${API_BASE_URL}/missions/links/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('No se pudo crear el enlace');
    return res.json();
  },
  async update(id: number, payload: Partial<MissionLink>): Promise<MissionLink> {
    const res = await fetch(`${API_BASE_URL}/missions/links/${id}/`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('No se pudo actualizar el enlace');
    return res.json();
  },
  async remove(id: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/missions/links/${id}/`, { method: 'DELETE', headers: this.getAuthHeaders() });
    if (!res.ok) throw new Error('No se pudo eliminar el enlace');
  },
};
