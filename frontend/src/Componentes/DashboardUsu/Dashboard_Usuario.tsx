import { useState, useEffect } from 'react';
import './Dashboard.css';
import PiePagina from '../Layout/PiePagina';
import EvaluationModal from './EvaluationModal';
import ResultsModal from './ResultsModal';
import NotesModal from './NotesModal';
import AchievementsModal from './AchievementsModal';
import AvatarModal from './AvatarModal';
import AdventureModal from './AdventureModal';
import OnboardingTour from "../Onboarding/OnboardingTour";
import ProfileModal from "../Profile/ProfileModal";
import ChallengeModal from "./ChallengeModal";
import Toast from "./Toast";
import { useDashboardEvents } from "./DashboardEvents";
import NavUsu from "./Nav_Usu";
import { EvaluationService } from '../../services/evaluationService';
import { authService } from '../../services/authService';
import { ClaseService } from '../../services/claseService';
import { clbService, type Club, type ClubMaterial } from '../../services/clbService';
import EvaluacionesEstudiante from '../DashboardUsuario/EvaluacionesEstudiante';
import { gamificationService } from '../../services/gamificationService';

interface DashboardProps {
  onLogout?: () => void;
}

export default function LingoLearn({ onLogout }: DashboardProps = {}) {
  
  const [candies, setCandies] = useState(0); // Dulces acumulados (desde backend)
  const [experience, setExperience] = useState(0); // XP acumulado (desde backend)
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [currentPrize, setCurrentPrize] = useState<{title: string, description: string, icon: string} | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [challengeProgress, setChallengeProgress] = useState(0);
  const [hasCompletedToday, setHasCompletedToday] = useState(false);
  const [streakLevel, setStreakLevel] = useState(0);
  const [currentChallenge, setCurrentChallenge] = useState<{
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  } | null>(null);
  
  // Estado para notificaciones toast
  const [showToast, setShowToast] = useState(false);
  const [toastData, setToastData] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
    rewards?: { candies?: number; xp?: number };
  }>({
    type: 'success',
    title: '',
    message: ''
  });

  // Evaluation states
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] = useState<string | null>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [evaluationResults, setEvaluationResults] = useState<any>(null);

  // Clases states
  const [clases, setClases] = useState<any[]>([]);
  const [isLoadingClases, setIsLoadingClases] = useState(true);
  const [userId, setUserId] = useState<string>('');

  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);

  // CLB (Club) states
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null);
  const [clubMaterials, setClubMaterials] = useState<ClubMaterial[]>([]);
  const [isLoadingClubMaterials, setIsLoadingClubMaterials] = useState(false);

  // Evaluaciones states
  const [evaluaciones, setEvaluaciones] = useState<any[]>([]);
  const [isLoadingEvaluaciones, setIsLoadingEvaluaciones] = useState(false);

  // Título del estudiante basado en XP (desde backend de gamificación)
  const [userTitle, setUserTitle] = useState<string>('');
  const [userTitleCode, setUserTitleCode] = useState<string | null>(null);
  const [nextTitleXp, setNextTitleXp] = useState<number | null>(null);

  // Misiones dinámicas states
  const [availableMissions, setAvailableMissions] = useState<Array<{mission_key: string; title: string; description: string; platform: string; xp: number}>>([]);
  const [isLoadingMissions, setIsLoadingMissions] = useState(true);

  // Paginación states
  const [currentPage, setCurrentPage] = useState(1);
  const clasesPerPage = 5;

  // Modal de notas y asistencia
  const [showNotesModal, setShowNotesModal] = useState(false);

  // Modal de logros
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [achievements, setAchievements] = useState<any[]>([]);

  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showAdventureModal, setShowAdventureModal] = useState(false);

  // API base para consultar enlaces de misiones (router PHP legacy)
  const PHP_API_BASE_URL = 'https://lalenguacolombia.co/api/index.php';
  // Raíz pública para construir URLs de archivos (ej: uploads/...) devueltos por PHP
  const PHP_PUBLIC_API_ROOT = PHP_API_BASE_URL.replace('/index.php', '');

  // Utilidad para crear mission_key a partir del título mostrado en la card
  const slugify = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // quitar tildes
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  };

  const downloadResource = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        window.location.href = url;
        return;
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (e) {
      window.location.href = url;
    }
  };

  // Cargar misiones disponibles desde el backend
  const loadAvailableMissions = async () => {
    try {
      setIsLoadingMissions(true);
      const params = new URLSearchParams();
      if (userId) params.append('user_id', userId);
      const url = `${PHP_API_BASE_URL}/missions/available/${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAvailableMissions(data || []);
      } else {
        setAvailableMissions([]);
      }
    } catch (e) {
      console.error('loadAvailableMissions error', e);
      setAvailableMissions([]);
    } finally {
      setIsLoadingMissions(false);
    }
  };

  // Abrir misión: consulta al backend el enlace vigente y lo abre en nueva pestaña
  const openMission = async (missionTitle: string) => {
    try {
      const missionKey = slugify(missionTitle);
      const params = new URLSearchParams();
      if (userId) params.append('user_id', userId);
      const url = `${PHP_API_BASE_URL}/missions/${missionKey}/link/${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url);
      if (res.status === 204) {
        showNotification('info', 'Misión no disponible', 'Esta misión no tiene un enlace vigente.');
        return;
      }
      if (!res.ok) {
        throw new Error('Error consultando enlace de misión');
      }
      const data = await res.json();
      if (data?.url) {
        const finalUrl: string = data.url.startsWith('http') ? data.url : `https://${data.url}`;
        window.open(finalUrl, '_blank', 'noopener');

        // Registrar recompensa de misión en el backend de gamificación
        try {
          const reward = await gamificationService.claimMissionReward();
          if (reward.success && reward.data) {
            const d = reward.data;
            const newCandies = d.total_dulces ?? candies;
            const newXp = d.total_xp ?? experience;
            setCandies(newCandies);
            setExperience(newXp);

            // Actualizar título si el backend envía nuevos datos
            if (d.title) setUserTitle(d.title);
            if (typeof d.title_code === 'string') setUserTitleCode(d.title_code);
            if (typeof d.next_title_xp !== 'undefined') setNextTitleXp(d.next_title_xp ?? null);

            // Actualizar lista de logros acumulados
            if (Array.isArray(d.achievements)) {
              setAchievements(d.achievements);
            }

            // Verificar premios por nivel de dulces usando el total actualizado
            setTimeout(() => checkForPrize(newCandies), 500);

            // Notificar nuevos logros desbloqueados (si los hay)
            if (Array.isArray(d.new_achievements) && d.new_achievements.length > 0) {
              const names = d.new_achievements.map((a: any) => a.name).join(', ');
              showNotification(
                'success',
                '🏅 Nuevo logro',
                `Has desbloqueado: ${names}`
              );
            }

            const dulcesGan = d.dulces_ganados ?? 20;
            const xpGan = d.xp_ganado ?? 30;
            showNotification(
              'success',
              '¡Misión registrada! 🎮',
              `Has ganado ${dulcesGan} dulces y ${xpGan} XP por esta misión.`,
              { candies: dulcesGan, xp: xpGan }
            );
          }
        } catch (e) {
          console.error('Error al registrar recompensa de misión:', e);
        }
      } else {
        showNotification('info', 'Misión no disponible', 'No hay enlace configurado por ahora.');
      }
    } catch (e) {
      console.error('openMission error', e);
      showNotification('error', 'Error', 'No se pudo abrir la misión. Intenta más tarde.');
    }
  };

  // Evaluation functions
  const startEvaluation = (type: string) => {
    setCurrentEvaluation(type);
    setShowEvaluationModal(true);
  };

  const viewResults = (type: string) => {
    // Mock results data
    const mockResults = {
      type,
      score: type === 'comprehension' ? 78 : 85,
      totalQuestions: type === 'comprehension' ? 8 : 10,
      correctAnswers: type === 'comprehension' ? 6 : 8,
      timeSpent: '12:34'
    };
    setEvaluationResults(mockResults);
    setShowResultsModal(true);
  };

  // Definir premios por niveles de dulces
  const prizeThresholds = [
    { candies: 50, title: "Explorador Novato", description: "¡Has comenzado tu aventura con Lingo!", icon: "🎒" },
    { candies: 100, title: "Coleccionista de Palabras", description: "¡Dominas el vocabulario básico!", icon: "📚" },
    { candies: 200, title: "Maestro de Gramática", description: "¡Las reglas gramaticales son tu fuerte!", icon: "✏️" },
    { candies: 350, title: "Conversador Experto", description: "¡Puedes mantener conversaciones fluidas!", icon: "💬" },
    { candies: 500, title: "Guía de Lingo", description: "¡Eres un verdadero compañero de viaje!", icon: "🗺️" },
    { candies: 750, title: "Leyenda del Aprendizaje", description: "¡Tu dedicación es inspiradora!", icon: "👑" }
  ];

  // Función para verificar y otorgar premios
  const checkForPrize = (newCandyCount: number) => {
    const availablePrize = prizeThresholds.find(prize => 
      newCandyCount >= prize.candies && candies < prize.candies
    );
    
    if (availablePrize) {
      setCurrentPrize(availablePrize);
      setShowPrizeModal(true);
    }
  };

  // Función para ganar dulces y experiencia
  const earnRewards = (candiesEarned: number, xpEarned: number) => {
    const newCandyCount = candies + candiesEarned;
    setCandies(newCandyCount);
    setExperience(prev => prev + xpEarned);
    
    // Verificar si se ganó un premio
    setTimeout(() => checkForPrize(newCandyCount), 500);
    
    // Mostrar notificación Toast en lugar de alert
    showNotification('success', '¡Felicidades! 🎉', `¡Recompensas ganadas!`, { candies: candiesEarned, xp: xpEarned });
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setIsNewUser(false);
    setShowOnboarding(false);
  };

  // Función para forzar onboarding (temporal para pruebas)
  const forceOnboarding = () => {
    localStorage.removeItem('hasSeenOnboarding');
    setIsNewUser(true);
    setShowOnboarding(true);
  };

  // Tipo para retos diarios (pueden venir del backend)
  interface DailyChallenge {
    id?: number;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  }

  // Banco de preguntas por defecto para retos diarios (fallback si el backend no devuelve nada)
  const DEFAULT_DAILY_CHALLENGES: DailyChallenge[] = [
    {
      question: "What is the correct way to say 'I am going to the store'?",
      options: ["I go to the store", "I am going to the store", "I going to store", "I will go store"],
      correctAnswer: 1,
      explanation: "We use 'am going' for present continuous tense to express future plans."
    },
    {
      question: "Choose the correct plural form of 'child':",
      options: ["childs", "children", "childes", "child's"],
      correctAnswer: 1,
      explanation: "'Children' is the irregular plural form of 'child'."
    },
    {
      question: "Which sentence is grammatically correct?",
      options: ["She don't like pizza", "She doesn't like pizza", "She not like pizza", "She no likes pizza"],
      correctAnswer: 1,
      explanation: "We use 'doesn't' (does not) with third person singular subjects like 'she'."
    },
    {
      question: "What does 'How are you?' mean?",
      options: ["¿Cómo estás?", "¿Qué haces?", "¿Dónde estás?", "¿Cuándo vienes?"],
      correctAnswer: 0,
      explanation: "'How are you?' is a common greeting asking about someone's well-being."
    },
    {
      question: "Complete: 'I _____ English every day.'",
      options: ["study", "studies", "studying", "studied"],
      correctAnswer: 0,
      explanation: "We use the base form 'study' with 'I' in present simple tense."
    }
  ];

  const [dailyChallenges, setDailyChallenges] = useState<DailyChallenge[]>(DEFAULT_DAILY_CHALLENGES);

  // Función para abrir modal de reto diario
  const openChallengeModal = () => {
    if (hasCompletedToday) {
      alert("⏰ Ya completaste tu reto de hoy. ¡Vuelve mañana para continuar tu racha!");
      return;
    }
    if (!dailyChallenges.length) {
      alert('No hay retos configurados por ahora. Intenta más tarde.');
      return;
    }
    const randomChallenge = dailyChallenges[Math.floor(Math.random() * dailyChallenges.length)];
    setCurrentChallenge(randomChallenge);
    setShowChallengeModal(true);
  };

  // Función para cerrar modal de reto
  const closeChallengeModal = () => {
    setShowChallengeModal(false);
    setCurrentChallenge(null);
  };

  // Función para mostrar notificación toast
  const showNotification = (type: 'success' | 'error' | 'info', title: string, message: string, rewards?: { candies?: number; xp?: number }) => {
    setToastData({ type, title, message, rewards });
    setShowToast(true);
  };

  // Usar hook de eventos DOM con función de notificación
  useDashboardEvents(showNotification);
  
  // Función para acceder a una clase
  const accederClase = (clase: any) => {
    // Verificar que la clase esté activa
    if (clase.estado !== 'activa') {
      alert('Esta clase no está disponible aún. El profesor debe iniciarla primero.');
      return;
    }
    
    // Obtener el enlace de Meet / videoconferencia
    const meetLink = clase.meet_link || clase.meetLink;

    const esLinkInvalido =
      !meetLink ||
      meetLink.trim() === '' ||
      meetLink === 'undefined' ||
      meetLink.includes('meet.google.com/new');
    
    if (esLinkInvalido) {
      alert('Esta clase aún no tiene enlace de videoconferencia configurado. Pide a tu profesor que agregue el enlace (Zoom, Meet, Teams, etc.).');
      return;
    }
    
    // Asegurar que el enlace tenga protocolo
    let enlaceCompleto = meetLink;
    if (!enlaceCompleto.startsWith('http://') && !enlaceCompleto.startsWith('https://')) {
      enlaceCompleto = 'https://' + enlaceCompleto;
    }
    window.open(enlaceCompleto, '_blank');
  };

  // Función para verificar respuesta del reto
  const checkChallengeAnswer = async (selectedAnswer: number) => {
    const todayStr = new Date().toDateString();
    setHasCompletedToday(true);
    localStorage.setItem(`lastCompletedDate_${userId}`, todayStr);

    if (currentChallenge && selectedAnswer === currentChallenge.correctAnswer) {
      // Respuesta correcta: pedir al backend que aplique la recompensa
      try {
        const resp = await gamificationService.claimDailyChallenge();

        if (!resp.success) {
          // Ya reclamó hoy u otra condición de negocio
          showNotification(
            'info',
            'Reto diario',
            resp.message || 'Ya reclamaste la recompensa del reto diario hoy.'
          );
        } else if (resp.data) {
          const d = resp.data;

          const newCandies = d.total_dulces ?? 0;
          const newXp = d.total_xp ?? 0;
          setCandies(newCandies);
          setExperience(newXp);

          // Actualizar título si el backend envía nuevos datos
          if (d.title) setUserTitle(d.title);
          if (typeof d.title_code === 'string') setUserTitleCode(d.title_code);
          if (typeof d.next_title_xp !== 'undefined') setNextTitleXp(d.next_title_xp ?? null);

          // Actualizar racha local con el valor del backend
          const serverStreak = d.reto_racha_actual ?? challengeProgress + 1;
          setChallengeProgress(serverStreak);
          localStorage.setItem(`challengeProgress_${userId}`, serverStreak.toString());

          // Si el backend indica que se aplicó bonus (15 días seguidos), subir nivel de racha visual
          if (d.bonus_aplicado) {
            const newStreakLevel = streakLevel + 1;
            setStreakLevel(newStreakLevel);
            localStorage.setItem(`streakLevel_${userId}`, newStreakLevel.toString());
          }

          // Actualizar lista de logros acumulados
          if (Array.isArray(d.achievements)) {
            setAchievements(d.achievements);
          }

          // Verificar premios por niveles de dulces usando el total actualizado
          setTimeout(() => checkForPrize(newCandies), 500);

          // Notificar nuevos logros desbloqueados (si los hay)
          if (Array.isArray(d.new_achievements) && d.new_achievements.length > 0) {
            const names = d.new_achievements.map((a: any) => a.name).join(', ');
            showNotification(
              'success',
              '🏅 Nuevo logro',
              `Has desbloqueado: ${names}`
            );
          }

          const dulcesGan = d.dulces_ganados ?? 5;
          const xpGan = d.xp_ganado ?? 15;
          showNotification(
            'success',
            '¡Correcto! ✅',
            `Has ganado ${dulcesGan} dulces y ${xpGan} XP.`,
            { candies: dulcesGan, xp: xpGan }
          );
        }
      } catch (error) {
        console.error('Error registrando reto diario:', error);
        showNotification('error', 'Error', 'No se pudo registrar tu reto diario. Intenta más tarde.');
      }

      closeChallengeModal();
    } else {
      // Respuesta incorrecta - reiniciar racha a cero, registrar fallo en backend y mostrar respuesta correcta
      setChallengeProgress(0);
      localStorage.setItem(`challengeProgress_${userId}`, '0');

      try {
        await gamificationService.registerDailyChallengeFailure();
      } catch (error) {
        console.error('Error registrando fallo de reto diario:', error);
      }

      const correctOption = currentChallenge?.options[currentChallenge.correctAnswer];
      showNotification(
        'error',
        'Respuesta incorrecta ❌',
        `Tu racha se reinicia a 0.\n\nRespuesta correcta: ${correctOption}\n\n${currentChallenge?.explanation}`
      );
      closeChallengeModal();
    }
  };

  // Función para refrescar clases (puede ser llamada desde cualquier lugar)
  const refreshClases = async () => {
    try {
      const profile = await authService.getUserProfile();
      const userIdStr = profile.id?.toString() || '';
      
      // Cargar solo las clases del usuario desde el backend
      const userIdNum = Number(userIdStr);
      const clasesDelBackend = await ClaseService.getClasesPorUsuario(userIdNum);

      // Enriquecer con algunos campos para el frontend
      const clasesUsuario = (clasesDelBackend || []).map((clase: any) => ({
        ...clase,
        profesor: clase.profesor || 'Sin asignar',
        tipo: 'profesor'
      }));

      setClases(clasesUsuario);
    } catch (error) {
      console.error('Error refrescando clases:', error);
    }
  };

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const profile = await authService.getUserProfile();
        const userIdStr = profile.id?.toString() || '';
        setUserId(userIdStr);

        if (userIdStr) {
          const storedAvatar = localStorage.getItem(`avatar_${userIdStr}`);
          if (storedAvatar) {
            setAvatarSrc(storedAvatar);
          }
        }

        // Cargar estado inicial de gamificación (dulces, XP, títulos y logros) desde PHP
        try {
          const estado = await gamificationService.getEstado();
          if (estado.success && estado.data) {
            const { total_dulces, total_xp, title, title_code, next_title_xp, achievements: allAchievements } = estado.data as any;
            setCandies(total_dulces ?? 0);
            setExperience(total_xp ?? 0);
            if (title) setUserTitle(title);
            if (typeof title_code === 'string') setUserTitleCode(title_code);
            if (typeof next_title_xp !== 'undefined') setNextTitleXp(next_title_xp);
            if (Array.isArray(allAchievements)) setAchievements(allAchievements);
          }
        } catch (e) {
          console.error('Error cargando estado de gamificación:', e);
        }
        
        // Cargar datos específicos del usuario desde localStorage
        const todayStr = new Date().toDateString();
        const lastCompleted = localStorage.getItem(`lastCompletedDate_${userIdStr}`);
        const savedProgress = localStorage.getItem(`challengeProgress_${userIdStr}`);
        const savedStreakLevel = localStorage.getItem(`streakLevel_${userIdStr}`);
        
        // SIMULACIÓN ESPECIAL PARA CAMILA - Ver animaciones de racha alta
        if (profile.email === 'camila@thelanguage.co') {
          setHasCompletedToday(false); // Permitir que haga el reto
          setChallengeProgress(6); // Día 6 de 7 (casi completa la semana)
          setStreakLevel(3); // Nivel 3 de racha para ver todas las animaciones
          setCandies(500); // Muchos dulces para ver efectos
          setExperience(2500); // Mucha experiencia
          
          // Guardar en localStorage para persistencia
          localStorage.setItem(`challengeProgress_${userIdStr}`, '6');
          localStorage.setItem(`streakLevel_${userIdStr}`, '3');
        } else {
          setHasCompletedToday(lastCompleted === todayStr);
          setChallengeProgress(savedProgress ? parseInt(savedProgress) : 0);
          setStreakLevel(savedStreakLevel ? parseInt(savedStreakLevel) : 0);
        }
        
        // El perfil se considera siempre completado para evitar modal constante
        setIsNewUser(false);
        
        // Obtener clases programadas para el usuario directamente desde el backend
        let clasesFinales: any[] = [];
        try {
          const userIdNum = Number(userIdStr);
          const clasesDelBackend = await ClaseService.getClasesPorUsuario(userIdNum);

          const clasesProfesor = (clasesDelBackend || []).map((clase: any) => {
            return {
              ...clase,
              profesor: clase.profesor || 'Sin asignar',
              tipo: 'profesor' // Identificar tipo de clase
            };
          });

          clasesFinales = [...clasesProfesor];
        } catch (error) {
          console.error('Error cargando clases del profesor:', error);
        }
        
        // 3. Filtrar y ordenar clases para mostrar solo las más relevantes
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Separar clases por fecha
        const clasesConFecha = clasesFinales.map(clase => {
          const fechaClase = new Date(clase.fecha || new Date());
          fechaClase.setHours(0, 0, 0, 0);
          return {
            ...clase,
            fechaObj: fechaClase,
            esPasada: fechaClase < today,
            esHoy: fechaClase.getTime() === today.getTime(),
            esFutura: fechaClase > today
          };
        });
        
        // Ordenar por prioridad: activas primero, programadas en medio, completadas al final
        clasesConFecha.sort((a, b) => {
          // Definir prioridad por estado
          const getPrioridad = (estado: string) => {
            switch (estado) {
              case 'activa': return 1;
              case 'programada': return 2;
              case 'completada': return 3;
              default: return 2; // Por defecto como programada
            }
          };
          
          const prioridadA = getPrioridad(a.estado);
          const prioridadB = getPrioridad(b.estado);
          
          // Si tienen la misma prioridad, ordenar por fecha
          if (prioridadA === prioridadB) {
            return a.fechaObj.getTime() - b.fechaObj.getTime();
          }
          
          return prioridadA - prioridadB;
        });
        
        // Mostrar todas las clases ordenadas por prioridad
        const clasesRelevantes = clasesConFecha;
        
        setClases(clasesRelevantes);
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoadingClases(false);
      }
    };

    loadUserData();
    
    // Cargar retos diarios desde el backend PHP (/daily-challenges/)
    const loadDailyChallenges = async () => {
      try {
        const token = authService.getToken?.() || localStorage.getItem('token');
        if (!token) return;

        const res = await fetch(`${PHP_API_BASE_URL}/daily-challenges/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          return;
        }

        const data = await res.json();
        if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
          const mapped: DailyChallenge[] = data.data.map((item: any) => ({
            id: item.id,
            question: item.question,
            options: item.options || [],
            correctAnswer: item.correct_answer,
            explanation: item.explanation || '',
          }));

          if (mapped.length > 0) {
            setDailyChallenges(mapped);
          }
        }
      } catch (e) {
        console.error('Error cargando retos diarios:', e);
      }
    };

    loadDailyChallenges();
    
    // Escuchar cambios de estado de clases en tiempo real
    const handleClaseEstadoChanged = (event: any) => {
      console.log('Evento de cambio de estado recibido en estudiante:', event.detail);
      // Recargar clases automáticamente cuando el profesor cambie el estado
      setTimeout(() => {
        loadUserData();
      }, 500);
    };
    
    window.addEventListener('claseEstadoChanged', handleClaseEstadoChanged);
    
    // Polling para actualizar clases cada 30 segundos
    const intervalId = setInterval(() => {
      refreshClases();
    }, 30000); // 30 segundos
    
    // Cleanup del event listener y polling
    return () => {
      window.removeEventListener('claseEstadoChanged', handleClaseEstadoChanged);
      clearInterval(intervalId);
    };
  }, []);

  // Cargar clubs del estudiante/profesor y materiales del club seleccionado
  useEffect(() => {
    const loadClubs = async () => {
      try {
        const userClubs = await clbService.getClubs();
        setClubs(userClubs);
        if (userClubs.length > 0) {
          setSelectedClubId(userClubs[0].id);
        }
      } catch (e) {
        console.error('Error loading clubs:', e);
        setClubs([]);
      }
    };
    loadClubs();
  }, []);

  useEffect(() => {
    const loadMaterials = async () => {
      if (!selectedClubId) {
        setClubMaterials([]);
        return;
      }
      try {
        setIsLoadingClubMaterials(true);
        const mats = await clbService.getClubMaterials(selectedClubId);
        setClubMaterials(mats);
      } catch (e) {
        console.error('Error loading club materials:', e);
        setClubMaterials([]);
      } finally {
        setIsLoadingClubMaterials(false);
      }
    };
    loadMaterials();
  }, [selectedClubId]);

  // Cargar misiones cuando userId esté disponible
  useEffect(() => {
    if (userId) {
      loadAvailableMissions();
    }
  }, [userId]);

  useEffect(() => {
    const fetchEvaluaciones = async () => {
      setIsLoadingEvaluaciones(true);
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const data = await EvaluationService.getEvaluationsForUser(token);
          setEvaluaciones(data);
        }
      } catch (err) {
        setEvaluaciones([]);
      }
      setIsLoadingEvaluaciones(false);
    };
    fetchEvaluaciones();
  }, []);

  return (
    <>
      {/* Navigation Header - Outside container for full width */}
      <NavUsu 
        candies={candies} 
        experience={experience} 
        onLogout={onLogout}
        onOpenAchievements={() => setShowAchievementsModal(true)}
      />
      
      <div className="container">
        {/* Content wrapper */}
        <div className="dashboard-content">

      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <h1>¡Bienvenido a tu aventura con la Lengua! </h1>
          <p>Acompaña a nuestra lengua en su aventura mientras aprendes inglés</p>
          <button
            className="btn-adventure"
            onClick={() => setShowAdventureModal(true)}
          >
            ¡Comenzar aventura!
          </button>
        </div>

      <div className="hero-image">
        <div className="flamingo">
          <img
            src="/Lengua-logo.png"
            alt="Lengua"
            className="flamingo-img"
          />
        </div>
      </div>
      </section>

      {/* Cards */}
      <div className="cards-grid">
        {/* Avatar Card */}
        <div className="card avatar-card">
          <div className="card-header">
            <div className="card-icon">
              <img src="/Image/usuario.png" className="icon-img" />
            </div>
            <h3>Tu Avatar</h3>
          </div>
          <div className="card-description">
            Personaliza tu avatar para acompañar a Lengua en su viaje al mundo del ingles .
          </div>

          <div className="avatar-preview">
            {avatarSrc ? (
              <img src={avatarSrc} alt="Avatar" className="avatar-preview-img" />
            ) : (
              '👤'
            )}
          </div>
          <button
            className="btn-primary personalizar"
            onClick={() => setShowAvatarModal(true)}
          >
            Personalizar
          </button>
        </div>

        {/* Progress Card */}
        <div className="card progress-card">
          <div className="card-header">
            <div className="card-icon">
              <img src="/Image/grafico-de-barras.png" className="icon-img" />
            </div>
            <h3>Tu Progreso</h3>
          </div>
          <div className="level-info">
            <div className="level-text">
              Nivel actual: {userTitle || 'Principiante'}
            </div>
            <div className="progress-container">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${(() => {
                      if (!nextTitleXp || nextTitleXp <= 0) return 100;
                      const code = userTitleCode || '';
                      let minXp = 0;
                      switch (code) {
                        case 'word_builder':
                          minXp = 100;
                          break;
                        case 'grammar_adventurer':
                          minXp = 250;
                          break;
                        case 'conversation_starter':
                          minXp = 500;
                          break;
                        case 'fluent_traveler':
                          minXp = 1000;
                          break;
                        case 'english_master':
                          minXp = 2000;
                          break;
                        default:
                          minXp = 0;
                          break;
                      }
                      const span = nextTitleXp - minXp;
                      if (span <= 0) return 100;
                      const value = ((experience - minXp) / span) * 100;
                      return Math.max(0, Math.min(100, Math.round(value)));
                    })()}%`,
                  }}
                ></div>
              </div>
              <div className="progress-percentage">
                {(() => {
                  if (!nextTitleXp || nextTitleXp <= 0) return '100%';
                  const code = userTitleCode || '';
                  let minXp = 0;
                  switch (code) {
                    case 'word_builder':
                      minXp = 100;
                      break;
                    case 'grammar_adventurer':
                      minXp = 250;
                      break;
                    case 'conversation_starter':
                      minXp = 500;
                      break;
                    case 'fluent_traveler':
                      minXp = 1000;
                      break;
                    case 'english_master':
                      minXp = 2000;
                      break;
                    default:
                      minXp = 0;
                      break;
                  }
                  const span = nextTitleXp - minXp;
                  if (span <= 0) return '100%';
                  const value = ((experience - minXp) / span) * 100;
                  const pct = Math.max(0, Math.min(100, Math.round(value)));
                  return `${pct}%`;
                })()}
              </div>
            </div>
          </div>
          <ul className="skills-list">
            <li>
              <span>Vocabulario</span>
              <div className="stars">☆⭐⭐</div>
            </li>
            <li>
              <span>Gramática</span>
              <div className="stars">☆☆⭐</div>
            </li>
            <li>
              <span>Conversación</span>
              <div className="stars">⭐⭐⭐</div>
            </li>
          </ul>
          <button
            className="btn-primary detalles"
            onClick={() => setShowNotesModal(true)}
          >
            Ver detalles
          </button>
        </div>

        {/* Daily Challenge Card */}
        <div className={`card challenge-card streak-level-${streakLevel}`}>
          <div className="star large"></div>
          <div className="star medium"></div>
          <div className="star small-left"></div>
          <div className="star small-right"></div>
          
          {/* Efectos especiales según nivel de racha */}
          {streakLevel >= 1 && (
            <>
              <div className="floating-stars">
                <div className="floating-star star-1">⭐</div>
                <div className="floating-star star-2">✨</div>
                <div className="floating-star star-3">🌟</div>
              </div>
            </>
          )}
          
          {streakLevel >= 2 && (
            <div className="magic-glow"></div>
          )}
          
          {streakLevel >= 3 && (
            <div className="rainbow-border"></div>
          )}

          <div className="card-header">
            <div className="card-icon">
              <img src="/Image/fuego.png" className="icon-img" />
            </div>
            <h3>Reto Diario</h3>
          </div>

          <div className="challenge-badge">¡En racha!</div>
          <div className="challenge-day">Día {challengeProgress} de racha</div>
          <div className="challenge-desc">
            Completa el reto de hoy para mantener tu racha invicta.
          </div>

          <div className="challenge-progress-container">
            {[...Array(7)].map((_, index) => (
              <div 
                key={index}
                className={`challenge-segment ${
                  index < challengeProgress ? 'completed' : 
                  index === challengeProgress ? 'current' : ''
                }`}
              ></div>
            ))}
          </div>

          <div className="challenge-reward">
            Próxima recompensa: 50 puntos
          </div>
          <button 
            className={`btn-challenge ${hasCompletedToday ? 'disabled' : ''}`}
            onClick={openChallengeModal}
            disabled={hasCompletedToday}
          >
            {hasCompletedToday ? 'Completado hoy ✓' : 'Completar reto de hoy'}
          </button>
        </div>
      </div>

      {/* Missions */}
      <div className="Seccion_2">
        <h1 className="section-title">Misiones Actuales</h1>
        <a href="#" className="view-all">
          Ver todas ›
        </a>
      </div>

      <div className="missions-grid">
        {isLoadingMissions ? (
          <div>Cargando misiones...</div>
        ) : availableMissions.length > 0 ? (
          availableMissions.map((mission, index) => {
            const missionTypes = ['vocabulary', 'grammar', 'conversation'];
            const missionIcons = ['📚', '✏️', '💬'];
            const missionTypeNames = ['Quiz Interactivo', 'Ejercicios Prácticos', 'Juego en Tiempo Real'];
            const currentType = missionTypes[index % missionTypes.length];
            const currentIcon = missionIcons[index % missionIcons.length];
            const currentTypeName = missionTypeNames[index % missionTypeNames.length];
            
            return (
              <div key={mission.mission_key} className={`mission-card ${currentType}`}>
                <div className="mission-header">
                  <div className="mission-icon">{currentIcon}</div>
                  <div className="mission-info">
                    <h3>{mission.title}</h3>
                    <span className="mission-type">{currentTypeName}</span>
                  </div>
                </div>
                <div className="mission-content">
                  <p>{mission.description}</p>
                  <div className="mission-stats">
                    <div className="stat">
                      <span className="stat-icon">🍬</span>
                      <span>+20 Dulces</span>
                    </div>
                    <div className="stat">
                      <span className="stat-icon">⭐</span>
                      <span>+30 XP</span>
                    </div>
                  </div>
                </div>
                <button className="mission-button" onClick={() => openMission(mission.title)}>Jugar Ahora</button>
              </div>
            );
          })
        ) : (
          <div className="no-classes-message">No hay misiones asignadas por el momento.</div>
        )}
      </div>

      {/* Material del Club */}
      <div className="club-materials-section">
        <div className="section-header-clean">
          <h2 className="section-title">Material del Club</h2>
          {clubs.length > 0 && (
            <select
              value={selectedClubId ?? ''}
              onChange={(e) => setSelectedClubId(Number(e.target.value))}
              className="club-selector"
            >
              {clubs.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
        </div>

        {clubs.length === 0 ? (
          <div className="no-classes-message">Aún no perteneces a ningún club.</div>
        ) : isLoadingClubMaterials ? (
          <div className="loading-message">Cargando material...</div>
        ) : clubMaterials.length === 0 ? (
          <div className="no-classes-message">No hay material publicado aún.</div>
        ) : (
          <div className="club-materials-grid">
            {clubMaterials.map((item) => {
              // Determinar URL del recurso según el tipo (URL externa o archivo subido)
              let resourceUrl: string | null = null;
              let isFileResource = false;
              let downloadFilename = item.title ? `${item.title}` : 'recurso';

              if (item.url && item.url.trim() !== '') {
                // Recurso tipo URL
                const trimmed = item.url.trim();
                resourceUrl = trimmed.startsWith('http://') || trimmed.startsWith('https://')
                  ? trimmed
                  : `https://${trimmed}`;
              } else if (item.file && item.file.trim() !== '') {
                // Recurso tipo archivo subido, construir URL pública a partir de la ruta relativa
                const normalizedFile = item.file.replace(/\\/g, '/');
                const rawPath = normalizedFile.startsWith('/') ? normalizedFile.slice(1) : normalizedFile;
                resourceUrl = `${PHP_PUBLIC_API_ROOT}/${rawPath}`;
                isFileResource = true;

                const base = rawPath.split('/').pop();
                if (base && base.trim() !== '') {
                  downloadFilename = base;
                }
              }

              return (
                <div key={item.id} className="club-material-card">
                  <div className="material-header">
                    <div className="material-icon">📎</div>
                    <div className="material-info">
                      <h3>{item.title}</h3>
                      <span className="material-week">Semana {item.week}</span>
                    </div>
                    <div className="material-date">{new Date(item.created_at).toLocaleDateString('es-ES')}</div>
                  </div>
                  <div className="material-content">
                    <p>{item.description || 'Recurso del club'}</p>
                  </div>
                  {resourceUrl && (
                    isFileResource ? (
                      <button
                        type="button"
                        className="material-button"
                        onClick={() => downloadResource(resourceUrl, downloadFilename)}
                      >
                        Descargar
                      </button>
                    ) : (
                      <a className="material-button" href={resourceUrl} target="_blank" rel="noreferrer">
                        Abrir recurso
                      </a>
                    )
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Evaluaciones Section */}
      <EvaluacionesEstudiante />

      {/* Classes Section */}
      <div className="classes-section">
        <div className="section-header">
          <h2 className="section-title">Clases Programadas</h2>
          <button 
            onClick={() => {
              refreshClases();
            }}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '600'
            }}
          >
            🔄 Actualizar
          </button>
        </div>

        <div className="classes-table">
          <div className="table-header">
            <div>Fecha</div>
            <div>Hora</div>
            <div>Profesor</div>
            <div>Tema</div>
            <div>Acciones</div>
          </div>

          {isLoadingClases ? (
            <div className="loading-message">Cargando clases...</div>
          ) : clases.length === 0 ? (
            <div className="no-classes-message">No hay clases programadas</div>
          ) : (
            (() => {
              // Calcular clases para la página actual
              const indexOfLastClase = currentPage * clasesPerPage;
              const indexOfFirstClase = indexOfLastClase - clasesPerPage;
              const clasesActuales = clases.slice(indexOfFirstClase, indexOfLastClase);
              
              return clasesActuales.map((clase, index) => (
                <div key={clase.id || (indexOfFirstClase + index)} className="table-row">
                  <div className="table-cell">{clase.fecha || 'Por definir'}</div>
                  <div className="table-cell">{clase.hora || 'Por definir'}</div>
                  <div className="table-cell">
                    {clase.profesor || 'Sin asignar'}
                    {clase.tipo === 'profesor' && <span className="clase-extra"> (Reprogramada)</span>}
                  </div>
                  <div className="table-cell">{clase.tema || clase.nombre}</div>
                  <div className="table-cell">
                    {clase.estado === 'activa' ? (
                      <button 
                        className="btn-acceder"
                        onClick={() => accederClase(clase)}
                      >
                        → ACCEDER
                      </button>
                    ) : clase.estado === 'programada' ? (
                      <span className="estado-clase programada">
                        📅 Programada
                      </span>
                    ) : clase.estado === 'completada' ? (
                      <span className="estado-clase completada">
                        ✅ Completada
                      </span>
                    ) : (
                      <span className="estado-clase pendiente">
                        ⏳ Pendiente
                      </span>
                    )}
                  </div>
                </div>
              ));
            })()
          )}
        </div>
        
        {/* Controles de paginación */}
        {clases.length > clasesPerPage && (
          <div className="pagination-controls">
            <button 
              className="pagination-btn"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              ← Anterior
            </button>
            
            <span className="pagination-info">
              Página {currentPage} de {Math.ceil(clases.length / clasesPerPage)} 
              ({clases.length} clases total)
            </span>
            
            <button 
              className="pagination-btn"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(clases.length / clasesPerPage)))}
              disabled={currentPage === Math.ceil(clases.length / clasesPerPage)}
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>


      {/* Prize Modal */}
      {showPrizeModal && currentPrize && (
        <div className="prize-modal-backdrop" onClick={() => setShowPrizeModal(false)}>
          <div className="prize-modal" onClick={(e) => e.stopPropagation()}>
            <div className="prize-modal-header">
              <div className="prize-icon">{currentPrize.icon}</div>
              <h2>¡Felicidades!</h2>
            </div>
            
            <div className="prize-modal-body">
              <h3 className="prize-title">{currentPrize.title}</h3>
              <p className="prize-description">{currentPrize.description}</p>
              <div className="prize-candy-count">
                <span className="candy-icon">🍬</span>
                <span>Has acumulado {candies} dulces</span>
              </div>
            </div>
            
            <div className="prize-modal-footer">
              <button 
                className="prize-close-btn" 
                onClick={() => setShowPrizeModal(false)}
              >
                ¡Continuar aventura!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Componente de Onboarding */}
      <OnboardingTour 
        isNewUser={showOnboarding} 
        onComplete={handleOnboardingComplete} 
      />

      {/* Botón flotante de ayuda */}
      <button 
        className="help-floating-btn"
        onClick={forceOnboarding}
        title="¿Necesitas ayuda? Haz clic para ver el tour guiado"
      >
        ?
      </button>

      {/* Evaluation Modal */}
      <EvaluationModal
        isVisible={showEvaluationModal}
        evaluationType={currentEvaluation || ''}
        onClose={() => setShowEvaluationModal(false)}
        onComplete={(results) => {
          setEvaluationResults(results);
          setShowEvaluationModal(false);
          setShowResultsModal(true);
        }}
      />

      {/* Results Modal */}
      <ResultsModal
        isVisible={showResultsModal}
        results={evaluationResults}
        onClose={() => setShowResultsModal(false)}
      />

      {/* Notes Modal (progreso detallado: notas y asistencia) */}
      <NotesModal
        isVisible={showNotesModal}
        onClose={() => setShowNotesModal(false)}
      />

      {/* Modal de logros */}
      <AchievementsModal
        isOpen={showAchievementsModal}
        onClose={() => setShowAchievementsModal(false)}
        achievements={achievements}
      />

      <AvatarModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        onSelect={(src: string) => {
          setAvatarSrc(src);
          if (userId) {
            localStorage.setItem(`avatar_${userId}`, src);
          }
        }}
      />

      {/* Modal de Reto Diario */}
      {showChallengeModal && currentChallenge && (
        <ChallengeModal
          isOpen={showChallengeModal}
          challenge={currentChallenge}
          onClose={closeChallengeModal}
          onAnswerSubmit={checkChallengeAnswer}
        />
      )}

        {/* Toast Notification */}
        <Toast
          isVisible={showToast}
          type={toastData.type}
          title={toastData.title}
          message={toastData.message}
          rewards={toastData.rewards}
          onClose={() => setShowToast(false)}
        />

        {/* Profile Modal para completar perfil */}
        <ProfileModal
          isOpen={showProfileModal}
          onClose={() => {
            setShowProfileModal(false);
            setIsNewUser(false);
            // Recargar datos del usuario después de completar perfil
            const loadUpdatedProfile = async () => {
              try {
                const updatedProfile = await authService.getUserProfile();
                if (updatedProfile.profile_completed) {
                  setIsNewUser(false);
                }
              } catch (error) {
                console.error('Error recargando perfil:', error);
              }
            };
            loadUpdatedProfile();
          }}
        />
        </div>
      </div>
      
      {/* Pie de Página */}
      <PiePagina />
      <AdventureModal
        isOpen={showAdventureModal}
        onClose={() => setShowAdventureModal(false)}
      />
    </>
  );
}
