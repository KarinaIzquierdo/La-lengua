const API_BASE_URL = 'https://lalenguacolombia.co/api/index.php';

export interface Club {
  id: number;
  name: string;
  description?: string;
  profesor: number;
  profesor_name?: string;
}

export interface ClubMaterial {
  id: number;
  club: number;
  week: string;
  title: string;
  description?: string;
  resource_type: 'url' | 'file';
  url?: string;
  file?: string;
  created_at: string;
}

function getToken(): string | null {
  return localStorage.getItem('authToken') || localStorage.getItem('token');
}

function jsonHeaders(): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

function authHeaders(): HeadersInit {
  const headers: HeadersInit = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export const clbService = {
  async getClubs(): Promise<Club[]> {
    const res = await fetch(`${API_BASE_URL}/clubs/`, { headers: jsonHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(data)}`);
    // Si data ya es un array, devolverlo directamente
    if (Array.isArray(data)) return data as Club[];
    // Si no, intentar con data.clubs o data.data
    return (data.clubs || data.data || []) as Club[];
  },
  async createClub(payload: { name: string; description?: string }): Promise<Club> {
    const res = await fetch(`${API_BASE_URL}/clubs/create/`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
    const data = JSON.parse(text);
    return data.data as Club;
  },

  async updateClub(clubId: number, payload: { name?: string; description?: string }): Promise<Club> {
    const res = await fetch(`${API_BASE_URL}/clubs/${clubId}/update/`, {
      method: 'PUT',
      headers: jsonHeaders(),
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
    const data = JSON.parse(text);
    return (data.data || data) as Club;
  },

  async deleteClub(clubId: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/clubs/${clubId}/delete/`, {
      method: 'DELETE',
      headers: jsonHeaders(),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
  },

  async getClubMaterials(clubId: number): Promise<ClubMaterial[]> {
    const res = await fetch(`${API_BASE_URL}/clubs/${clubId}/materials/`, { headers: jsonHeaders() });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
    const data = JSON.parse(text);
    return data.data as ClubMaterial[];
  },

  async createClubMaterial(clubId: number, payload: { week: string; title: string; description?: string; resource_type: 'url' | 'file'; url?: string; file?: File; }): Promise<ClubMaterial> {
    const isFile = payload.resource_type === 'file' && payload.file instanceof File;
    const body: BodyInit = isFile ? (() => { const fd = new FormData(); fd.append('week', payload.week); fd.append('title', payload.title); if (payload.description) fd.append('description', payload.description); fd.append('resource_type', 'file'); if (payload.file) fd.append('file', payload.file); return fd; })() : JSON.stringify({ week: payload.week, title: payload.title, description: payload.description, resource_type: 'url', url: payload.url });

    const res = await fetch(`${API_BASE_URL}/clubs/${clubId}/materials/create/`, {
      method: 'POST',
      headers: isFile ? authHeaders() : jsonHeaders(),
      body,
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
    const data = JSON.parse(text);
    return data.data as ClubMaterial;
  },

  async updateClubMaterial(materialId: number, payload: { week?: string; title?: string; description?: string; url?: string; }): Promise<ClubMaterial> {
    const res = await fetch(`${API_BASE_URL}/clubs/materials/${materialId}/update/`, {
      method: 'PUT',
      headers: jsonHeaders(),
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
    const data = JSON.parse(text);
    return (data.data || data) as ClubMaterial;
  },

  async deleteClubMaterial(materialId: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/clubs/materials/${materialId}/delete/`, {
      method: 'DELETE',
      headers: jsonHeaders(),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
  },

  async listStudents(clubId: number): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/clubs/${clubId}/students/`, { headers: jsonHeaders() });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
    const data = JSON.parse(text);
    return data.data as any[];
  },

  async addStudentByEmail(clubId: number, email: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/clubs/${clubId}/students/add/`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ email }),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
  },

  async removeStudent(clubId: number, userId: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/clubs/${clubId}/students/${userId}/remove/`, {
      method: 'DELETE',
      headers: jsonHeaders(),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
  },

  async listAllUsers(): Promise<any[]> {
    // Lista todos los usuarios usando el mismo endpoint que userService (/api/users/)
    const res = await fetch(`${API_BASE_URL}/users/`, { headers: jsonHeaders() });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
    const data = JSON.parse(text);

    // El backend PHP devuelve { success, message, users: [...] }
    if (Array.isArray(data)) {
      return data as any[];
    }
    if (Array.isArray(data.users)) {
      return data.users as any[];
    }
    if (Array.isArray(data.data)) {
      return data.data as any[];
    }
    // Si por alguna razón no viene en ninguno de esos campos, devolver array vacío para no romper la vista
    return [];
  },

  async addStudentById(clubId: number, userId: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/clubs/${clubId}/students/add/`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ user_id: userId }),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
  },
};
