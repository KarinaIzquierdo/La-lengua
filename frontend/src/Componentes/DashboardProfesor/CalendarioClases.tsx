import { useState, useEffect } from 'react';
import './CalendarioClases.css';

interface ClaseCalendario {
  id: number;
  titulo: string;
  estudiante: string;
  fecha: Date;
  hora: string;
  tipo: 'individual' | 'grupal' | 'evaluacion';
  estado: 'programada' | 'completada' | 'cancelada';
}

export default function CalendarioClases() {
  const [fechaActual, setFechaActual] = useState(new Date());
  const [vistaActual, setVistaActual] = useState<'mes' | 'semana'>('mes');
  const [clases, setClases] = useState<ClaseCalendario[]>([]);

  useEffect(() => {
    const hoy = new Date();
    const clasesEjemplo: ClaseCalendario[] = [
      {
        id: 1,
        titulo: "Conversación Avanzada",
        estudiante: "Ana García",
        fecha: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1, 10, 0),
        hora: "10:00",
        tipo: 'individual',
        estado: 'programada'
      },
      {
        id: 2,
        titulo: "Gramática Intermedia", 
        estudiante: "Carlos López",
        fecha: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 2, 14, 0),
        hora: "14:00",
        tipo: 'individual',
        estado: 'programada'
      },
      {
        id: 3,
        titulo: "Clase Grupal - Pronunciación",
        estudiante: "Grupo A",
        fecha: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 3, 16, 0),
        hora: "16:00",
        tipo: 'grupal',
        estado: 'programada'
      },
      {
        id: 4,
        titulo: "Evaluación Oral",
        estudiante: "María Rodríguez",
        fecha: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 5, 11, 0),
        hora: "11:00",
        tipo: 'evaluacion',
        estado: 'programada'
      },
      {
        id: 5,
        titulo: "Conversación Básica",
        estudiante: "Pedro Martín",
        fecha: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 1, 15, 30),
        hora: "15:30",
        tipo: 'individual',
        estado: 'completada'
      }
    ];
    setClases(clasesEjemplo);
  }, []);

  const navegarMes = (direccion: 'anterior' | 'siguiente') => {
    const nuevaFecha = new Date(fechaActual);
    if (vistaActual === 'mes') {
      if (direccion === 'anterior') {
        nuevaFecha.setMonth(nuevaFecha.getMonth() - 1);
      } else {
        nuevaFecha.setMonth(nuevaFecha.getMonth() + 1);
      }
    } else {
      // Vista semanal
      if (direccion === 'anterior') {
        nuevaFecha.setDate(nuevaFecha.getDate() - 7);
      } else {
        nuevaFecha.setDate(nuevaFecha.getDate() + 7);
      }
    }
    setFechaActual(nuevaFecha);
  };

  const obtenerSemanaActual = () => {
    const inicioSemana = new Date(fechaActual);
    const diaSemana = inicioSemana.getDay();
    inicioSemana.setDate(inicioSemana.getDate() - diaSemana);
    
    const diasSemana = [];
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(inicioSemana);
      fecha.setDate(inicioSemana.getDate() + i);
      diasSemana.push(fecha);
    }
    return diasSemana;
  };

  const obtenerClasesDelDia = (fecha: Date) => {
    return clases.filter(clase => {
      const fechaClase = new Date(clase.fecha);
      return fechaClase.toDateString() === fecha.toDateString();
    });
  };

  return (
    <div className="calendario-clases">
      <div className="calendario-header">
        <h2>📅 Calendario de Clases</h2>
        <div className="calendario-controles">
          <div className="vista-selector">
            <button 
              className={vistaActual === 'mes' ? 'active' : ''}
              onClick={() => setVistaActual('mes')}
            >
              Mes
            </button>
            <button 
              className={vistaActual === 'semana' ? 'active' : ''}
              onClick={() => setVistaActual('semana')}
            >
              Semana
            </button>
          </div>
          
          <div className="navegacion-fecha">
            <button onClick={() => navegarMes('anterior')}>‹</button>
            <span className="fecha-actual">
              {vistaActual === 'mes' 
                ? fechaActual.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
                : `Semana del ${obtenerSemanaActual()[0].toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - ${obtenerSemanaActual()[6].toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`
              }
            </span>
            <button onClick={() => navegarMes('siguiente')}>›</button>
          </div>
        </div>
      </div>

      {vistaActual === 'mes' && (
        <div className="calendario-mes">
          <div className="dias-semana">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(dia => (
              <div key={dia} className="dia-semana-header">{dia}</div>
            ))}
          </div>
          
          <div className="dias-grid">
            {(() => {
              const año = fechaActual.getFullYear();
              const mes = fechaActual.getMonth();
              const primerDia = new Date(año, mes, 1);
              const ultimoDia = new Date(año, mes + 1, 0);
              const diasEnMes = ultimoDia.getDate();
              const diaSemanaInicio = primerDia.getDay();
              
              const dias = [];
              
              // Días del mes anterior
              for (let i = diaSemanaInicio - 1; i >= 0; i--) {
                const fecha = new Date(año, mes, -i);
                dias.push({ fecha, esDelMesActual: false });
              }
              
              // Días del mes actual
              for (let dia = 1; dia <= diasEnMes; dia++) {
                const fecha = new Date(año, mes, dia);
                dias.push({ fecha, esDelMesActual: true });
              }
              
              // Días del siguiente mes
              const diasRestantes = 42 - dias.length;
              for (let dia = 1; dia <= diasRestantes; dia++) {
                const fecha = new Date(año, mes + 1, dia);
                dias.push({ fecha, esDelMesActual: false });
              }
              
              return dias.map((diaInfo, i) => {
                const clasesDelDia = obtenerClasesDelDia(diaInfo.fecha);
                const esHoy = diaInfo.fecha.toDateString() === new Date().toDateString();
                
                return (
                  <div key={i} className={`dia-celda ${esHoy ? 'hoy' : ''} ${!diaInfo.esDelMesActual ? 'otro-mes' : ''}`}>
                    <span className="dia-numero">{diaInfo.fecha.getDate()}</span>
                    <div className="clases-dia">
                      {clasesDelDia.map(clase => (
                        <div key={clase.id} className={`clase-item ${clase.tipo} ${clase.estado}`}>
                          <span className="clase-hora">{clase.hora}</span>
                          <span className="clase-titulo">{clase.titulo}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {vistaActual === 'semana' && (
        <div className="calendario-semana">
          <div className="semana-header">
            <div className="hora-header"></div>
            {obtenerSemanaActual().map((fecha, i) => {
              const esHoy = fecha.toDateString() === new Date().toDateString();
              return (
                <div key={i} className={`dia-semana-col ${esHoy ? 'hoy' : ''}`}>
                  <div className="dia-nombre">{fecha.toLocaleDateString('es-ES', { weekday: 'short' })}</div>
                  <div className="dia-numero">{fecha.getDate()}</div>
                </div>
              );
            })}
          </div>
          
          <div className="semana-contenido">
            <div className="horas-columna">
              {Array.from({ length: 12 }, (_, i) => (
                <div key={i} className="hora-slot">{8 + i}:00</div>
              ))}
            </div>
            
            <div className="dias-columnas">
              {obtenerSemanaActual().map((fecha, diaIndex) => {
                const clasesDelDia = obtenerClasesDelDia(fecha);
                return (
                  <div key={diaIndex} className="dia-columna">
                    {Array.from({ length: 12 }, (_, horaIndex) => {
                      const hora = 8 + horaIndex;
                      const claseEnHora = clasesDelDia.find(clase => {
                        const horaClase = parseInt(clase.hora.split(':')[0]);
                        return horaClase === hora;
                      });
                      
                      return (
                        <div key={horaIndex} className="hora-celda">
                          {claseEnHora && (
                            <div className={`clase-semanal ${claseEnHora.tipo} ${claseEnHora.estado}`}>
                              <div className="clase-hora-semanal">{claseEnHora.hora}</div>
                              <div className="clase-titulo-semanal">{claseEnHora.titulo}</div>
                              <div className="clase-estudiante-semanal">{claseEnHora.estudiante}</div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
