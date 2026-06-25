export interface Bloque {
  id: string;
  nivel: string;
  turno: string;
  profesores: string[];
  clases: string[];
  misiones: string[];
  horarios: string[];
  fechasClases: string[];
  meetLinks: string[];
}

export interface BloqueData {
  nivel: string;
  turno: string;
  profesores: string;
  clases: string;
  misiones: string;
  horarios: string;
  fechasClases: string;
  meetLinks: string;
}

class BloqueService {
  private readonly STORAGE_KEY = 'bloques_data';
  private readonly USER_BLOCKS_KEY = 'user_blocks_assignment';

  // Obtener todos los bloques
  getBloques(): Bloque[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  // Guardar bloque
  saveBloque(bloqueData: BloqueData): Bloque {
    const bloques = this.getBloques();
    const nuevoBloque: Bloque = {
      id: `${bloqueData.nivel}_${bloqueData.turno}`,
      nivel: bloqueData.nivel,
      turno: bloqueData.turno,
      profesores: bloqueData.profesores.split(',').map(p => p.trim()),
      clases: bloqueData.clases.split(',').map(c => c.trim()),
      misiones: bloqueData.misiones.split(',').map(m => m.trim()),
      horarios: bloqueData.horarios.split(',').map(h => h.trim()),
      fechasClases: bloqueData.fechasClases.split(',').map(f => f.trim()),
      meetLinks: bloqueData.meetLinks ? bloqueData.meetLinks.split(',').map(m => m.trim()) : []
    };

    // Verificar si ya existe y actualizar, o agregar nuevo
    const existingIndex = bloques.findIndex(b => b.id === nuevoBloque.id);
    if (existingIndex >= 0) {
      bloques[existingIndex] = nuevoBloque;
    } else {
      bloques.push(nuevoBloque);
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(bloques));
    return nuevoBloque;
  }

  // Obtener bloque específico
  getBloqueById(id: string): Bloque | null {
    const bloques = this.getBloques();
    return bloques.find(b => b.id === id) || null;
  }

  // Asignar bloque a usuario
  assignBloqueToUser(userId: string, bloqueId: string): void {
    const assignments = this.getUserBlockAssignments();
    assignments[userId] = bloqueId;
    localStorage.setItem(this.USER_BLOCKS_KEY, JSON.stringify(assignments));
  }

  // Obtener asignaciones de bloques a usuarios
  getUserBlockAssignments(): Record<string, string> {
    const data = localStorage.getItem(this.USER_BLOCKS_KEY);
    return data ? JSON.parse(data) : {};
  }

  // Obtener bloque asignado a un usuario específico
  getUserAssignedBloque(userId: string): Bloque | null {
    const assignments = this.getUserBlockAssignments();
    const bloqueId = assignments[userId];
    return bloqueId ? this.getBloqueById(bloqueId) : null;
  }

  // Obtener clases del bloque del usuario
  getUserClases(userId: string): string[] {
    const bloque = this.getUserAssignedBloque(userId);
    return bloque ? bloque.clases : [];
  }

  // Obtener misiones del bloque del usuario
  getUserMisiones(userId: string): string[] {
    const bloque = this.getUserAssignedBloque(userId);
    return bloque ? bloque.misiones : [];
  }

  // Obtener profesores del bloque del usuario
  getUserProfesores(userId: string): string[] {
    const bloque = this.getUserAssignedBloque(userId);
    return bloque ? bloque.profesores : [];
  }

  // Obtener horarios del bloque del usuario
  getUserHorarios(userId: string): string[] {
    const bloque = this.getUserAssignedBloque(userId);
    return bloque ? bloque.horarios : [];
  }

  // Obtener información completa del bloque del usuario
  getUserBloqueInfo(userId: string): {
    bloque: Bloque | null;
    clases: string[];
    misiones: string[];
    profesores: string[];
    horarios: string[];
    meetLinks: string[];
    fechasClases: string[];
  } {
    const bloque = this.getUserAssignedBloque(userId);
    return {
      bloque,
      clases: bloque ? bloque.clases : [],
      misiones: bloque ? bloque.misiones : [],
      profesores: bloque ? bloque.profesores : [],
      horarios: bloque ? bloque.horarios : [],
      meetLinks: bloque ? bloque.meetLinks || [] : [],
      fechasClases: bloque ? bloque.fechasClases || [] : []
    };
  }

  // Eliminar bloque
  deleteBloque(bloqueId: string): boolean {
    const bloques = this.getBloques();
    const index = bloques.findIndex(b => b.id === bloqueId);
    if (index >= 0) {
      bloques.splice(index, 1);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(bloques));
      return true;
    }
    return false;
  }

  // Convertir bloque a formato de edición
  bloqueToData(bloque: Bloque): BloqueData {
    return {
      nivel: bloque.nivel,
      turno: bloque.turno,
      profesores: bloque.profesores.join(', '),
      clases: bloque.clases.join(', '),
      misiones: bloque.misiones.join(', '),
      horarios: bloque.horarios.join(', '),
      fechasClases: (bloque.fechasClases || []).join(', '),
      meetLinks: (bloque.meetLinks || []).join(', ')
    };
  }

  // Obtener niveles disponibles
  getNivelesDisponibles(): string[] {
    return ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  }

  // Obtener turnos disponibles
  getTurnosDisponibles(): string[] {
    return ['Mañana', 'Tarde', 'Noche'];
  }
}

export const bloqueService = new BloqueService();