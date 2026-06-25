import { authService } from './authService';

const API_BASE_URL = 'https://lalenguacolombia.co/api/index.php';

export interface Plan {
  id: number;
  nombre: string;
  tipo: 'basico' | 'especializado' | 'premium';
  descripcion: string;
  precio_base: number;
  duracion_meses: number;
  caracteristicas: string[];
  activo: boolean;
  color_tema: string;
  created_at: string;
  updated_at: string;
}

export interface Venta {
  id: number;
  estudiante: number;
  estudiante_nombre: string;
  plan: number;
  plan_nombre: string;
  especializacion?: number;
  especializacion_nombre?: string;
  precio_plan: number;
  precio_especializacion: number;
  descuento: number;
  precio_total: number;
  metodo_pago: 'efectivo' | 'tarjeta_credito' | 'tarjeta_debito' | 'transferencia' | 'paypal' | 'otro';
  referencia_pago?: string;
  estado: 'pendiente' | 'pagado' | 'cancelado' | 'reembolsado';
  notas?: string;
  vendido_por?: number;
  vendido_por_nombre?: string;
  fecha_venta: string;
  fecha_pago?: string;
  fecha_inicio_plan?: string;
  fecha_fin_plan?: string;
  created_at: string;
  updated_at: string;
}

export interface EstadisticasFinancieras {
  total_ventas: number;
  ingresos_totales: number;
  ingresos_mes: number;
  ventas_pendientes: number;
  conversion_rate: number;
  planes_populares: Array<{
    plan__nombre: string;
    count: number;
    ingresos: number;
  }>;
}

class FinancialService {
  private getAuthHeaders() {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Planes
  async getPlanes(): Promise<Plan[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/planes/`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Error fetching planes:', error);
      throw error;
    }
  }

  async createPlan(planData: Omit<Plan, 'id' | 'created_at' | 'updated_at'>): Promise<Plan> {
    try {
      const response = await fetch(`${API_BASE_URL}/planes/create/`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(planData),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Error creating plan');
      }
      return data.data;
    } catch (error) {
      console.error('Error creating plan:', error);
      throw error;
    }
  }

  async updatePlan(id: number, planData: Partial<Plan>): Promise<Plan> {
    try {
      const response = await fetch(`${API_BASE_URL}/planes/${id}/update/`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(planData),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Error updating plan');
      }
      return data.data;
    } catch (error) {
      console.error('Error updating plan:', error);
      throw error;
    }
  }

  async deletePlan(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/planes/${id}/delete/`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Error deleting plan');
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
      throw error;
    }
  }

  async togglePlan(id: number): Promise<Plan> {
    try {
      const response = await fetch(`${API_BASE_URL}/planes/${id}/toggle/`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Error toggling plan');
      }
      return data.data;
    } catch (error) {
      console.error('Error toggling plan:', error);
      throw error;
    }
  }

  // Ventas
  async getVentas(filters?: {
    estado?: string;
    metodo_pago?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<Venta[]> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
      }

      const url = `${API_BASE_URL}/ventas/${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Error fetching ventas:', error);
      throw error;
    }
  }

  async createVenta(ventaData: Omit<Venta, 'id' | 'created_at' | 'updated_at' | 'estudiante_nombre' | 'plan_nombre' | 'especializacion_nombre' | 'vendido_por_nombre'>): Promise<Venta> {
    try {
      const response = await fetch(`${API_BASE_URL}/ventas/create/`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(ventaData),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Error creating venta');
      }
      return data.data;
    } catch (error) {
      console.error('Error creating venta:', error);
      throw error;
    }
  }

  async updateVenta(id: number, ventaData: Partial<Venta>): Promise<Venta> {
    try {
      const response = await fetch(`${API_BASE_URL}/ventas/${id}/update/`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(ventaData),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Error updating venta');
      }
      return data.data;
    } catch (error) {
      console.error('Error updating venta:', error);
      throw error;
    }
  }

  // Estadísticas
  async getEstadisticasFinancieras(): Promise<EstadisticasFinancieras> {
    try {
      const response = await fetch(`${API_BASE_URL}/estadisticas/financieras/`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.success ? data.data : {
        total_ventas: 0,
        ingresos_totales: 0,
        ingresos_mes: 0,
        ventas_pendientes: 0,
        conversion_rate: 0,
        planes_populares: []
      };
    } catch (error) {
      console.error('Error fetching estadisticas:', error);
      throw error;
    }
  }
}

export const financialService = new FinancialService();
