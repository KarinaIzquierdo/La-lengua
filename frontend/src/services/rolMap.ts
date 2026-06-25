// Mapeo de roles frontend <-> backend
export const rolMapFrontendToBackend: Record<string, 'student' | 'profesor' | 'admin'> = {
  'Estudiante': 'student',
  'Profesor': 'profesor',
  'Admin': 'admin',
};

export const rolMapBackendToFrontend: Record<string, string> = {
  'student': 'Estudiante',
  'profesor': 'Profesor',
  'admin': 'Admin',
};
