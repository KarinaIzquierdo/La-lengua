import './Header.css';
import { Link, useLocation } from 'react-router-dom';

interface HeaderProps {
  onLoginClick: () => void;
}

export default function Header({ onLoginClick }: HeaderProps) {
  const location = useLocation();
  
  return (
    <header className="header-home">
      {/* Logo */}
      <div className="logo">
        <div className="logo-brand">
          <img src="/Lengua-logo.png" alt="La Lengua" className="logo-image" />
          <span 
            className="logo-text" 
            style={{ 
              opacity: 1, 
              visibility: 'visible', 
              color: '#5a67d8',
              fontSize: '1.1rem',
              fontWeight: 900
            }}
          >
            La Lengua
          </span>
        </div>
      </div>

      {/* Navegación */}
      <nav className="nav">
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link>
        <a href="/#info" onClick={(e) => {
          e.preventDefault();
          window.location.href = '/#info';
          setTimeout(() => {
            const element = document.getElementById('info');
            if (element) element.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}>Info</a>
        <a href="/#contact" onClick={(e) => {
          e.preventDefault();
          window.location.href = '/#contact';
          setTimeout(() => {
            const element = document.getElementById('contact');
            if (element) element.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}>Contact</a>
        <Link to="/blog" className={location.pathname === '/blog' ? 'active blog-link' : 'blog-link'}>Blog</Link>
        <Link 
          to="/planes" 
          className={location.pathname === '/planes' ? 'active' : ''}
        >
          Planes
        </Link>
        <button onClick={onLoginClick} className="login-btn">
          <span className="btn-text">La Lengua</span>
          <span className="btn-hover">Login</span>
        </button>
      </nav>
    </header>
  );
}
