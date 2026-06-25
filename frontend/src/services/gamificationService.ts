import { getAuthHeaders } from '../config/api';

// En producción, la gamificación se maneja por el backend PHP legacy
// usando el router index.php, igual que misiones y suscripciones.
const PHP_API_BASE_URL = 'https://lalenguacolombia.co/api/index.php';

interface GamificacionEstadoResponse {
  success: boolean;
  data?: {
    total_dulces: number;
    total_xp: number;
    reto_racha_actual: number;
    reto_mejor_racha: number;
    reto_ultima_fecha: string | null;
    reto_completados_total?: number;
    reto_fallidos_total?: number;
    title?: string;
    title_code?: string;
    next_title_xp?: number | null;
    achievements?: any[];
  };
  message?: string;
}

interface GamificacionAccionResponse {
  success: boolean;
  message?: string;
  data?: {
    total_dulces: number;
    total_xp: number;
    reto_racha_actual?: number;
    reto_mejor_racha?: number;
    reto_ultima_fecha?: string | null;
    dulces_ganados?: number;
    xp_ganado?: number;
    bonus_aplicado?: boolean;
    title?: string;
    title_code?: string;
    next_title_xp?: number | null;
    achievements?: any[];
    new_achievements?: any[];
  };
}

export const gamificationService = {
  async getEstado(): Promise<GamificacionEstadoResponse> {
    const res = await fetch(`${PHP_API_BASE_URL}/gamificacion/estado/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const json = (await res.json()) as GamificacionEstadoResponse;
    if (!res.ok) {
      throw new Error(json.message || 'Error al obtener estado de gamificación');
    }
    return json;
  },

  async claimDailyChallenge(): Promise<GamificacionAccionResponse> {
    const res = await fetch(`${PHP_API_BASE_URL}/gamificacion/reto-diario/`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    const json = (await res.json()) as GamificacionAccionResponse;
    // El backend puede devolver success=false pero 200 si ya reclamó hoy
    if (!res.ok) {
      throw new Error(json.message || 'Error al reclamar recompensa de reto diario');
    }
    return json;
  },

  async registerDailyChallengeFailure(): Promise<GamificacionAccionResponse> {
    const res = await fetch(`${PHP_API_BASE_URL}/gamificacion/reto-diario-fallo/`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    const json = (await res.json()) as GamificacionAccionResponse;
    if (!res.ok) {
      throw new Error(json.message || 'Error al registrar fallo de reto diario');
    }
    return json;
  },

  async claimMissionReward(): Promise<GamificacionAccionResponse> {
    const res = await fetch(`${PHP_API_BASE_URL}/gamificacion/mision/`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    const json = (await res.json()) as GamificacionAccionResponse;
    if (!res.ok) {
      throw new Error(json.message || 'Error al registrar recompensa de misión');
    }
    return json;
  },
};
