import React from 'react';
import './Blog.css';
import Header from '../Layout/Encabezado';
import Footer from '../Layout/PiePagina';
import { galleryService, type MediaItem } from '../../services/galleryService';

// Función para obtener los medios desde el backend
const getStoredMedia = async (): Promise<MediaItem[]> => {
  try {
    return await galleryService.getAllMedia();
  } catch (error) {
    console.error('Error loading media from backend:', error);
    // Fallback a datos por defecto
    return [
      {
        id: 1,
        type: 'video',
        title: "Clase de Pronunciación - Sonidos Vocálicos",
        description: "En esta clase trabajamos los sonidos vocálicos más difíciles para hispanohablantes. Aprende a diferenciar entre /i/ e /ɪ/ con ejercicios prácticos.",
        url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        thumbnail: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=250&fit=crop",
        author: "Prof. María González",
        created_at: "2024-03-15T00:00:00Z",
        category: "Videos"
      },
      {
        id: 2,
        type: 'image',
        title: "Infografía: Tiempos Verbales",
        description: "Guía visual completa de todos los tiempos verbales en inglés con ejemplos y usos específicos. Perfecta para estudiar y repasar.",
        url: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&h=400&fit=crop",
        author: "Prof. John Smith",
        created_at: "2024-03-12T00:00:00Z",
        category: "Infografías"
      },
      {
        id: 3,
        type: 'video',
        title: "Conversación Real - En el Aeropuerto",
        description: "Simulación de conversaciones típicas en el aeropuerto. Vocabulario esencial y frases útiles para viajeros.",
        url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        thumbnail: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=250&fit=crop",
        author: "Prof. Sarah Johnson",
        created_at: "2024-03-10T00:00:00Z",
        category: "Videos"
      },
      {
        id: 4,
        type: 'image',
        title: "Phrasal Verbs Más Comunes",
        description: "Colección visual de los phrasal verbs más utilizados en inglés cotidiano con ejemplos contextualizados.",
        url: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&h=400&fit=crop",
        author: "Prof. Michael Brown",
        created_at: "2024-03-08T00:00:00Z",
        category: "Infografías"
      },
      {
        id: 5,
        type: 'video',
        title: "Técnicas de Listening - Nivel Intermedio",
        description: "Estrategias avanzadas para mejorar tu comprensión auditiva. Incluye ejercicios con diferentes acentos del inglés.",
        url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=250&fit=crop",
        author: "Prof. Emma Wilson",
        created_at: "2024-03-15T00:00:00Z",
        category: "Videos"
      },
      {
        id: 6,
        type: 'image',
        title: "Vocabulario de Negocios",
        description: "Términos esenciales para el inglés empresarial. Ideal para profesionales que trabajan en entornos internacionales.",
        url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop",
        author: "Prof. David Lee",
        created_at: "2024-03-03T00:00:00Z",
        category: "Infografías"
      }
    ];
  }
};

const categories = ["Todos", "Videos", "Infografías", "Fotos"];

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = React.useState("Todos");
  const [selectedMedia, setSelectedMedia] = React.useState<MediaItem | null>(null);
  const [mediaItems, setMediaItems] = React.useState<MediaItem[]>([]);

  // Cargar medios al montar el componente
  React.useEffect(() => {
    const loadMedia = async () => {
      const media = await getStoredMedia();
      setMediaItems(media);
    };
    loadMedia();
  }, []);

  const filteredMedia = selectedCategory === "Todos" 
    ? mediaItems 
    : mediaItems.filter((item: MediaItem) => item.category === selectedCategory);

  const handleLoginClick = () => {
    // Abrir el modal directamente usando el estado global
    const event = new CustomEvent('openLoginModal');
    window.dispatchEvent(event);
  };

  if (selectedMedia) {
    return (
      <div className="blog-container">
        <Header onLoginClick={handleLoginClick} />
        <main className="blog-main">
          <div className="media-detail">
            <button 
              className="back-button"
              onClick={() => setSelectedMedia(null)}
            >
              ← Volver a la Galería
            </button>
            
            <article className="media-article">
              <div className="media-header">
                <span className="media-category">{selectedMedia.category}</span>
                <h1 className="media-title">{selectedMedia.title}</h1>
                <div className="media-meta">
                  <span className="media-author">Por {selectedMedia.author}</span>
                  <span className="media-date">{new Date(selectedMedia.created_at || '').toLocaleDateString('es-ES')}</span>
                  <span className="media-type">{selectedMedia.type === 'video' ? '🎥 Video' : '📷 Imagen'}</span>
                </div>
              </div>
              
              <div className="media-content">
                {selectedMedia.type === 'video' ? (
                  <div className="video-container">
                    <iframe 
                      src={selectedMedia.url}
                      title={selectedMedia.title}
                      frameBorder="0"
                      allowFullScreen
                    ></iframe>
                  </div>
                ) : (
                  <div className="image-container">
                    <img src={selectedMedia.url} alt={selectedMedia.title} />
                  </div>
                )}
              </div>
              
              <div className="media-description">
                <h3>Descripción</h3>
                <p>{selectedMedia.description}</p>
              </div>
            </article>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="blog-container">
      <Header onLoginClick={handleLoginClick} />
      <main className="blog-main">
        {/* Hero Section */}
        <section className="blog-hero">
          <div className="hero-content">
            <h1 className="hero-title">Galería de La Lengua</h1>
            <p className="hero-subtitle">
              Videos educativos, infografías y contenido visual para mejorar tu inglés
            </p>
          </div>
          <div className="hero-decoration">
            <div className="floating-element">🎥</div>
            <div className="floating-element">📷</div>
            <div className="floating-element">📚</div>
          </div>
        </section>


        {/* Categories Filter */}
        <section className="categories-section">
          <div className="categories-container">
            <h2 className="categories-title">Categorías</h2>
            <div className="categories-filter">
              {categories.map(category => (
                <button
                  key={category}
                  className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Media Gallery Grid */}
        <section className="media-section">
          <div className="media-container">
            <div className="media-grid">
              {filteredMedia.map((item: MediaItem) => (
                <article key={item.id} className="media-card">
                  <div className="media-thumbnail">
                    {item.type === 'video' ? (
                      <div className="video-thumbnail">
                        <img src={item.thumbnail || item.url} alt={item.title} />
                        <div className="play-overlay">
                          <div className="play-button">▶</div>
                        </div>
                      </div>
                    ) : (
                      <img src={item.url} alt={item.title} />
                    )}
                    <div className="media-type-badge">
                      {item.category}
                    </div>
                  </div>
                  
                  <div className="media-card-content">
                    <h3 className="media-card-title">{item.title}</h3>
                    <p className="media-description">{item.description}</p>
                    
                    <div className="media-card-meta">
                      <span className="media-author">{item.author}</span>
                      <span className="media-date">{new Date(item.created_at || '').toLocaleDateString('es-ES')}</span>
                    </div>
                    
                    <button 
                      className="view-btn"
                      onClick={() => setSelectedMedia(item)}
                    >
                      {item.type === 'video' ? '▶ Ver Video' : '👁 Ver Imagen'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section removida por solicitud */}
      </main>
      <Footer />
      
      {/* WhatsApp Floating Button */}
      <div 
        className="whatsapp-float"
        onClick={() => window.open('https://wa.me/573164844819?text=Hola,%20me%20interesa%20información%20sobre%20los%20cursos%20de%20inglés.%20Mi%20nombre%20es%20[escribe%20tu%20nombre],%20soy%20de%20[escribe%20tu%20ciudad%20y%20país]%20y%20quiero%20estudiar%20inglés%20porque%20[escribe%20tu%20razón].', '_blank')}
        title="Contáctanos por WhatsApp"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.097"/>
        </svg>
      </div>
    </div>
  );
}
