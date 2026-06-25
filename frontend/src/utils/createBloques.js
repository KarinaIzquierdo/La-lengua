// Script para crear los bloques iniciales con datos completos
export const createInitialBloques = () => {
  const bloques = [
    // A1
    { id: 'A1_Mañana', nivel: 'A1', turno: 'Mañana', profesores: ['María García', 'Carlos Rodríguez'], clases: ['Basic Greetings', 'Numbers 1-100', 'Family Members', 'Colors and Shapes'], misiones: ['Vocabulario Básico', 'Saludos y Presentaciones', 'Mi Familia'], horarios: ['8:00 AM - 9:30 AM', '10:00 AM - 11:30 AM'] },
    { id: 'A1_Tarde', nivel: 'A1', turno: 'Tarde', profesores: ['Laura Martínez', 'John Smith'], clases: ['Basic Greetings', 'Daily Routines', 'Food and Drinks', 'Time and Days'], misiones: ['Vocabulario Básico', 'Rutinas Diarias', 'La Hora'], horarios: ['2:00 PM - 3:30 PM', '4:00 PM - 5:30 PM'] },
    { id: 'A1_Noche', nivel: 'A1', turno: 'Noche', profesores: ['Elena Torres', 'Mark Wilson'], clases: ['Basic Greetings', 'Weather', 'Clothing', 'House and Home'], misiones: ['Vocabulario Básico', 'El Clima', 'Ropa y Casa'], horarios: ['7:00 PM - 8:30 PM', '8:45 PM - 10:15 PM'] },
    // A2
    { id: 'A2_Mañana', nivel: 'A2', turno: 'Mañana', profesores: ['Ana López', 'David Wilson'], clases: ['Past Tense', 'Future Plans', 'Shopping Vocabulary', 'Describing People'], misiones: ['Gramática Pasado', 'Planes Futuros', 'Ir de Compras'], horarios: ['8:00 AM - 9:30 AM', '10:00 AM - 11:30 AM'] },
    { id: 'A2_Tarde', nivel: 'A2', turno: 'Tarde', profesores: ['Patricia Silva', 'Michael Brown'], clases: ['Present Perfect', 'Comparatives', 'Travel Vocabulary', 'Health and Body'], misiones: ['Gramática Intermedia', 'Comparaciones', 'Viajes y Salud'], horarios: ['2:00 PM - 3:30 PM', '4:00 PM - 5:30 PM'] },
    { id: 'A2_Noche', nivel: 'A2', turno: 'Noche', profesores: ['Francisco Morales', 'Lisa Anderson'], clases: ['Modal Verbs', 'Hobbies', 'Technology', 'Work and Jobs'], misiones: ['Verbos Modales', 'Pasatiempos', 'Trabajo'], horarios: ['7:00 PM - 8:30 PM', '8:45 PM - 10:15 PM'] },
    // B1
    { id: 'B1_Mañana', nivel: 'B1', turno: 'Mañana', profesores: ['Roberto Fernández', 'Sarah Johnson'], clases: ['Conditional Sentences', 'Business English', 'Presentations', 'Debates'], misiones: ['Inglés de Negocios', 'Presentaciones', 'Debates y Opiniones'], horarios: ['9:00 AM - 10:30 AM', '11:00 AM - 12:30 PM'] },
    { id: 'B1_Tarde', nivel: 'B1', turno: 'Tarde', profesores: ['Carmen Ruiz', 'James Davis'], clases: ['Advanced Grammar', 'Listening Skills', 'Writing Essays', 'Conversation Practice'], misiones: ['Gramática Avanzada', 'Comprensión Auditiva', 'Escritura Académica'], horarios: ['3:00 PM - 4:30 PM', '5:00 PM - 6:30 PM'] },
    { id: 'B1_Noche', nivel: 'B1', turno: 'Noche', profesores: ['Alejandra Vega', 'Thomas White'], clases: ['Phrasal Verbs', 'Culture and Society', 'Media and News', 'Problem Solving'], misiones: ['Verbos Compuestos', 'Cultura y Sociedad', 'Medios de Comunicación'], horarios: ['7:00 PM - 8:30 PM', '8:45 PM - 10:15 PM'] },
    // B2
    { id: 'B2_Mañana', nivel: 'B2', turno: 'Mañana', profesores: ['Isabella Moreno', 'Richard Taylor'], clases: ['Complex Grammar', 'Academic Writing', 'Critical Thinking', 'Professional Communication'], misiones: ['Gramática Compleja', 'Escritura Académica', 'Pensamiento Crítico'], horarios: ['9:00 AM - 10:30 AM', '11:00 AM - 12:30 PM'] },
    { id: 'B2_Tarde', nivel: 'B2', turno: 'Tarde', profesores: ['Sebastián Castro', 'Jennifer Miller'], clases: ['Advanced Listening', 'Formal Presentations', 'Research Skills', 'Argumentation'], misiones: ['Comprensión Avanzada', 'Presentaciones Formales', 'Investigación'], horarios: ['3:00 PM - 4:30 PM', '5:00 PM - 6:30 PM'] },
    { id: 'B2_Noche', nivel: 'B2', turno: 'Noche', profesores: ['Natalia Herrera', 'Christopher Lee'], clases: ['Business Communication', 'Negotiation Skills', 'Report Writing', 'Case Studies'], misiones: ['Comunicación Empresarial', 'Negociación', 'Informes'], horarios: ['7:00 PM - 8:30 PM', '8:45 PM - 10:15 PM'] },
    // C1
    { id: 'C1_Mañana', nivel: 'C1', turno: 'Mañana', profesores: ['Victoria Ramírez', 'Alexander Clark'], clases: ['Advanced Discourse', 'Literary Analysis', 'Professional Writing', 'Leadership Communication'], misiones: ['Análisis Literario', 'Escritura Profesional', 'Comunicación de Liderazgo'], horarios: ['9:00 AM - 10:30 AM', '11:00 AM - 12:30 PM'] },
    { id: 'C1_Tarde', nivel: 'C1', turno: 'Tarde', profesores: ['Andrés Delgado', 'Catherine Moore'], clases: ['Academic Research', 'Complex Presentations', 'Cultural Studies', 'Advanced Debate'], misiones: ['Investigación Académica', 'Estudios Culturales', 'Debate Avanzado'], horarios: ['3:00 PM - 4:30 PM', '5:00 PM - 6:30 PM'] },
    { id: 'C1_Noche', nivel: 'C1', turno: 'Noche', profesores: ['Gabriela Sánchez', 'William Harris'], clases: ['Executive Communication', 'Strategic Thinking', 'International Relations', 'Advanced Writing'], misiones: ['Comunicación Ejecutiva', 'Pensamiento Estratégico', 'Relaciones Internacionales'], horarios: ['7:00 PM - 8:30 PM', '8:45 PM - 10:15 PM'] },
    // C2
    { id: 'C2_Mañana', nivel: 'C2', turno: 'Mañana', profesores: ['Esperanza Jiménez', 'Jonathan Adams'], clases: ['Mastery Communication', 'Advanced Literature', 'Philosophical Discourse', 'Expert Presentations'], misiones: ['Comunicación Magistral', 'Literatura Avanzada', 'Discurso Filosófico'], horarios: ['9:00 AM - 10:30 AM', '11:00 AM - 12:30 PM'] },
    { id: 'C2_Tarde', nivel: 'C2', turno: 'Tarde', profesores: ['Maximiliano Torres', 'Elizabeth Wright'], clases: ['Academic Excellence', 'Research Methodology', 'Critical Analysis', 'Expert Writing'], misiones: ['Excelencia Académica', 'Metodología de Investigación', 'Análisis Crítico'], horarios: ['3:00 PM - 4:30 PM', '5:00 PM - 6:30 PM'] },
    { id: 'C2_Noche', nivel: 'C2', turno: 'Noche', profesores: ['Valentina Rojas', 'Benjamin King'], clases: ['Professional Mastery', 'International Standards', 'Expert Consultation', 'Advanced Linguistics'], misiones: ['Maestría Profesional', 'Estándares Internacionales', 'Consultoría Experta'], horarios: ['7:00 PM - 8:30 PM', '8:45 PM - 10:15 PM'] },
  ];

  // Guardar bloques en localStorage
  localStorage.setItem('bloques_data', JSON.stringify(bloques));
  
  return bloques;
};
// Nota: ya no auto-ejecutamos aquí para evitar sobreescrituras.
// La inicialización se hará explícitamente desde main.tsx si el storage está vacío.
