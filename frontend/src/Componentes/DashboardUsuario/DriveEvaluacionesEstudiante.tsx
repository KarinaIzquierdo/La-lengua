import './DriveEvaluacionesEstudiante.css';

export default function DriveEvaluacionesEstudiante() {
  // URL del Google Drive - puedes cambiarla según necesites
  const driveUrl = 'https://drive.google.com/drive/folders/YOUR_FOLDER_ID';

  const handleOpenDrive = () => {
    window.open(driveUrl, '_blank');
  };

  return (
    <div className="drive-evaluaciones-estudiante">
      <div className="drive-header-estudiante">
        <h2>📝 Evaluaciones y Calificaciones</h2>
        <p>Accede a Google Drive para ver tus evaluaciones y calificaciones</p>
      </div>

      <div className="drive-card-estudiante">
        <div className="drive-icon-estudiante">
          <svg viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
            <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
            <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
            <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
            <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
            <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
            <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
          </svg>
        </div>

        <div className="drive-content-estudiante">
          <h3>Ver mis Evaluaciones</h3>
          <p>
            Todas tus evaluaciones, quizzes y calificaciones están disponibles en Google Drive.
            Haz clic en el botón para acceder.
          </p>

          <div className="drive-features-estudiante">
            <div className="feature-item-estudiante">
              <span className="feature-icon-estudiante">📄</span>
              <span>Ver evaluaciones asignadas</span>
            </div>
            <div className="feature-item-estudiante">
              <span className="feature-icon-estudiante">✅</span>
              <span>Revisar calificaciones</span>
            </div>
            <div className="feature-item-estudiante">
              <span className="feature-icon-estudiante">📊</span>
              <span>Seguimiento de progreso</span>
            </div>
            <div className="feature-item-estudiante">
              <span className="feature-icon-estudiante">💬</span>
              <span>Comentarios del profesor</span>
            </div>
          </div>

          <button className="btn-open-drive-estudiante" onClick={handleOpenDrive}>
            <svg width="20" height="20" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
              <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
              <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
              <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
              <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
              <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
              <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
            </svg>
            Abrir Google Drive
          </button>
        </div>
      </div>
    </div>
  );
}
