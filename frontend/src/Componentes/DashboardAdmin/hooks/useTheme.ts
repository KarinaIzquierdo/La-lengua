import { useState } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    // Aquí podrías agregar lógica para cambiar clases en body, guardar en localStorage, etc.
  };

  return { theme, toggleTheme };
}
