import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { createInitialBloques } from './utils/createBloques.js'

// Inicializa bloques en localStorage solo si aún no existen
if (typeof window !== 'undefined') {
  try {
    const existingStr = localStorage.getItem('bloques_data')
    if (!existingStr) {
      // No hay bloques: crear por primera vez
      createInitialBloques()
    } else {
      // Hay bloques pero quizá incompletos: fusionar si faltan
      const existing = JSON.parse(existingStr)
      const EXPECTED_MIN = 18 // 3 turnos por 6 niveles (A1–C2)
      if (Array.isArray(existing) && existing.length < EXPECTED_MIN) {
        const before = existing
        // Crear defaults (esta llamada escribe defaults en storage)
        const defaults = createInitialBloques()
        // Fusionar: mantener existentes y añadir los que falten de defaults
        const byId = new Map<string, any>()
        ;[...defaults, ...before].forEach((b: any) => {
          if (b && b.id) byId.set(b.id, b)
        })
        const merged = Array.from(byId.values())
        localStorage.setItem('bloques_data', JSON.stringify(merged))
      }
    }
  } catch (err) {
    console.error('No se pudo inicializar bloques:', err)
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
