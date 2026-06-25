// Servicio para registrar usuarios desde el frontend
import { API_BASE_URL } from '../config/api';

export interface RegisterData {
  first_name: string;
  last_name: string;
  email?: string;  // Ahora es opcional, se genera automáticamente si no se proporciona
  correo_personal: string;  // Ahora es obligatorio - correo personal del usuario
  role: string;
  password: string;
  bloque_asignado?: string;
  especializacion?: number | null;
}

export interface RegisterResponse {
  success: boolean;
  user?: any;
  message?: string;
  errors?: any;
}

export const userService = {
  async register(data: RegisterData): Promise<RegisterResponse> {
    try {
      // Ya no modificamos el correo_personal, se envía tal cual
      // El backend generará el email institucional automáticamente si no se proporciona
      const response = await fetch(`${API_BASE_URL}/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      return result;
    } catch (error) {
      return { success: false, message: 'Error de conexión' };
    }
  },

  async getAll(): Promise<any[]> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/users/`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      if (!response.ok) return [];
      const data = await response.json();

      // El backend devuelve { success, message, users: [...] }
      const users = Array.isArray(data) ? data : (data.users || []);

      // Mapear campos del backend a los nombres esperados por el frontend
      return users.map((user: any) => {
        // Determinar correo personal sin mostrar cuentas institucionales @thelanguage.co
        const rawPersonal = user.correo_personal || null;
        const rawEmail = user.email || null;
        const isInstitutional = (email: string | null) => !!email && email.toLowerCase().includes('@thelanguage.co');

        const correo_personal = rawPersonal
          ? (isInstitutional(rawPersonal) ? null : rawPersonal)
          : (isInstitutional(rawEmail) ? null : rawEmail);

        return {
          id: user.id,
          nombres: user.first_name,
          apellidos: user.last_name,
          correo: user.email,
          correo_personal,
          rol: user.role,
          activo: user.is_active,
          is_active: user.is_active,
          bloque_asignado: user.bloque_asignado,
          especializacion_id: user.especializacion_id ?? null,
          especializacion: user.especializacion ?? null,
          date_joined: user.date_joined,
          nivel: user.english_level || null,
        };
      });
    } catch (error) {
      return [];
    }
  },

  async toggleActive(userId: number): Promise<any> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/users/${userId}/toggle-active/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Error de conexión' };
    }
  },

  async update(userId: number, data: Partial<any>): Promise<any> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/users/${userId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Error de conexión' };
    }
  },

  async deleteUser(userId: number): Promise<any> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/users/${userId}/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Error de conexión' };
    }
  },

  async getCurrentUser(): Promise<{
    success: boolean;
    user?: any;
    error?: string;
  }> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return { success: false, error: 'No token found' };
      }

      const response = await fetch(`${API_BASE_URL}/auth/profile/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return { success: false, error: 'Failed to fetch user profile' };
      }

      const userData = await response.json();
      return {
        success: true,
        user: {
          id: userData.id,
          first_name: userData.first_name,
          last_name: userData.last_name,
          email: userData.email,
          role: userData.role,
          full_name: `${userData.first_name} ${userData.last_name}`.trim(),
          initials: `${userData.first_name?.charAt(0) || ''}${userData.last_name?.charAt(0) || ''}`.toUpperCase()
        }
      };
    } catch (error) {
      console.error('Error fetching current user:', error);
      return { success: false, error: 'Error de conexión' };
    }
  },
};
