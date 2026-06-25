import { useTheme } from '../hooks/useTheme';
import './ThemeToggleButton.css';

export const ThemeToggleButton = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button onClick={toggleTheme} className="theme-toggle-button">
      {theme === 'light' ? '🌤️' : '🌔'}
    </button>
  );
};
