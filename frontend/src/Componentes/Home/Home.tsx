import "./Home.css";
import { useRef, useState, useEffect } from "react";
import ScrollIndicator from "../ScrollIndicator/ScrollIndicator";
import ScrollReveal from "../ScrollReveal/ScrollReveal";
import { sendContactEmail, validateFormData } from "../../services/emailService.ts";

export default function Home() {
  const containerRef = useRef(null);
  const [showContent, setShowContent] = useState(false);
  const [hideScrollIndicator, setHideScrollIndicator] = useState(false);
  const [typewriterText1, setTypewriterText1] = useState('');
  const [typewriterText2, setTypewriterText2] = useState('');
  const [showCursor1, setShowCursor1] = useState(true);
  const [showCursor2, setShowCursor2] = useState(false);
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    speed: number;
    opacity: number;
  }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    level: '',
    reason: '',
    source: '',
    contactMethod: ''
  });

  // Efecto typewriter
  useEffect(() => {
    const text1 = 'ENGLISH THAT TRANSFORMS';
    const text2 = 'YOUR FUTURE';
    let index1 = 0;
    let index2 = 0;

    const typeFirstLine = () => {
      if (index1 < text1.length) {
        setTypewriterText1(text1.slice(0, index1 + 1));
        index1++;
        setTimeout(typeFirstLine, 150);
      } else {
        setTimeout(() => {
          setShowCursor1(false);
          setShowCursor2(true);
          typeSecondLine();
        }, 500);
      }
    };

    const typeSecondLine = () => {
      if (index2 < text2.length) {
        setTypewriterText2(text2.slice(0, index2 + 1));
        index2++;
        setTimeout(typeSecondLine, 150);
      } else {
        setTimeout(() => setShowCursor2(false), 1000);
      }
    };

    const startAnimation = setTimeout(typeFirstLine, 500);
    return () => clearTimeout(startAnimation);
  }, []);

  // Generar partículas
  useEffect(() => {
    const generateParticles = () => {
      const newParticles = [];
      for (let i = 0; i < 20; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 4 + 2,
          speed: Math.random() * 2 + 1,
          opacity: Math.random() * 0.5 + 0.2
        });
      }
      setParticles(newParticles);
    };

    generateParticles();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const triggerPoint = window.innerHeight * 0.1;
      
      if (scrollPosition > triggerPoint && !showContent) {
        setShowContent(true);
        setHideScrollIndicator(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showContent]);

  const handleScrollIndicatorClick = () => {
    setShowContent(true);
    setHideScrollIndicator(true);
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar datos del formulario
    const validation = validateFormData(formData);
    if (!validation.isValid) {
      setSubmitMessage(validation.message || 'Error de validación');
      setSubmitStatus('error');
      setTimeout(() => {
        setSubmitMessage('');
        setSubmitStatus('idle');
      }, 3000);
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');
    setSubmitStatus('idle');

    try {
      // Enviar email usando EmailJS
      const result = await sendContactEmail(formData);
      
      if (result.success) {
        setSubmitMessage('¡Gracias! Tu mensaje ha sido enviado correctamente. Te contactaremos pronto.');
        setSubmitStatus('success');
        // Limpiar formulario después del éxito
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          country: '',
          city: '',
          level: '',
          reason: '',
          source: '',
          contactMethod: ''
        });
      } else {
        setSubmitMessage(result.message);
        setSubmitStatus('error');
      }
    } catch (error) {
      setSubmitMessage('Error inesperado. Por favor, intenta nuevamente.');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="home-container" ref={containerRef}>
      {/* Partículas de fondo */}
      <div className="particles-container">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="particle"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
              animationDuration: `${particle.speed * 10}s`,
              animationDelay: `${particle.id * 0.2}s`
            }}
          />
        ))}
      </div>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              <span className="title-3d typewriter">
                {typewriterText1}
                {showCursor1 && <span className="cursor">|</span>}
              </span>
              <span className="title-trend typewriter">
                {typewriterText2}
                {showCursor2 && <span className="cursor">|</span>}
              </span>
            </h1>
            <div className="workshop-info staggered-animation" style={{animationDelay: '2.5s'}}>
              <h2>Develop the skills you need</h2>
              <h2>for study, work, and everyday life</h2>
              <h3 className="free-text">through our level-based programs</h3>
            </div>
            <p className="description staggered-animation" style={{animationDelay: '3s'}}>
            "Learn English in a practical and dynamic way. Step by step, 
you’ll build the skills and confidence to study, work, 
and live without limits."

            </p>
          </div>
          <div className="hero-image">
            <img
              src="/Lengua-logo.png"
              alt="La Lengua"
              className="character-img hero-lengua-logo"
            />
          </div>
        </div>
      </section>
      
      {/* Scroll Progress Indicator */}
      <div 
        className={`scroll-indicator-wrapper ${hideScrollIndicator ? 'fade-out' : 'fade-in'}`}
        onClick={handleScrollIndicatorClick}
      >
        <ScrollIndicator />
      </div>

      {/* Programs Section - Con animación scroll reveal */}
      <div className="content-sections">
        <section 
          id="info" 
          className="programs-section"
        >
          <ScrollReveal delay={0.1}>
            <div className="programs-header">
              <h2 className="section-subtitle staggered-animation" style={{animationDelay: '0.2s'}}>The future starts here</h2>
              <h1 className="programs-title staggered-animation" style={{animationDelay: '0.5s'}}>
                KNOW OUR<br />
                <span className="programs-highlight">PROGRAMS BY LEVEL</span>
              </h1>
            </div>

            <div className="programs-content">
              <div className="programs-text">
                <div className="program-info staggered-animation" style={{animationDelay: '0.8s'}}>
                  <h3 className="program-name">
                  ENGLISH<br />
                    <span className="program-highlight">PROGRAM</span>
                    <br />
                    LEVEL 
                  </h3>
                  <div className="program-number">1</div>
                </div>

                <p className="program-description staggered-animation" style={{animationDelay: '1.1s'}}>
                "Start your English journey with our Level 1 program. Designed for complete beginners or learners with a basic foundation, This course can focus your professionals and personal goals, following international standers but also connecting your real life situations  (CEFR A2–B1)."
                </p>

                <button className="info-button shimmer-button staggered-animation" style={{animationDelay: '1.4s'}}>Request Information</button>
              </div>

              <img
                src="/Image/Relajado.jpg"
                alt="Student relaxing"
                className="student-img staggered-animation"
                style={{animationDelay: '1.7s'}}
              />
            </div>
          </ScrollReveal>
        </section>

        {/* Program Level 2 Section */}
        <section className="program-level2-section">
          <ScrollReveal delay={0.2}>
            <div className="program-level2-content">
              <img
                src="/Image/Chicarompecabezas.jpg"
                alt="Chica con rompecabezas"
                className="puzzle-img staggered-animation"
                style={{animationDelay: '0.2s'}}
              />

              <div className="program-level2-text">
                <div className="program-level2-info staggered-animation" style={{animationDelay: '0.5s'}}>
                  <h3 className="program-level2-name">
                    ENGLISH<br />
                    <span className="program-highlight">PROGRAM </span>
                    <br />
                    LEVEL 
                  </h3>
                  <div className="program-level2-number">2</div>
                </div>

                <p className="program-level2-description staggered-animation" style={{animationDelay: '0.8s'}}>
                "Level 2 is ideal for learners who already have some knowledge of English and want to improve their fluency. Through interactive lessons and real-life practice, you will expand your vocabulary, strengthen grammar, and gain confidence in expressing yourself in more complex situations."
                </p>

                <button className="info-button shimmer-button staggered-animation" style={{animationDelay: '1.1s'}}>Request Information</button>
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* Program Level 3 Section */}
        <section className="program-level3-section">
          <ScrollReveal delay={0.3}>
            <div className="program-level3-content">
              <div className="program-level3-text">
                <div className="program-level3-info staggered-animation" style={{animationDelay: '0.2s'}}>
                  <h3 className="program-level3-name">
                    ENGLISH<br />
                    <span className="program-highlight">PROGRAM</span>
                    <br />
                    LEVEL 
                  </h3>
                  <div className="program-level3-number">3</div>
                </div>

                <p className="program-level3-description staggered-animation" style={{animationDelay: '0.5s'}}>
                "Level 3 prepares you to achieve advanced communication skills. You will focus on mastering professional and academic English, participate in debates, write structured texts, and understand more complex materials. This program is designed to help you succeed in work, study, and international environments."
                </p>

                <button className="info-button shimmer-button staggered-animation" style={{animationDelay: '0.8s'}}>Request Information</button>
              </div>

              <img
                src="/Image/Exito.jpg"
                alt="Imagen de éxito"
                className="success-img staggered-animation"
                style={{animationDelay: '1.1s'}}
              />
            </div>
          </ScrollReveal>
        </section>

        {/* Contact Form Section */}
        <section 
          id="contact" 
          className="contact-form-section"
        >
          <ScrollReveal delay={0.4}>
            <div className="contact-form-container">
              <h1 className="contact-title staggered-animation" style={{animationDelay: '0.2s'}}>
                DO YOU WANT TO
                <br />
                <span className="contact-highlight">
                  TRANSFORM YOUR
                  <br />
                  LIFE?
                </span>
              </h1>

              <div className="form-card staggered-animation" style={{animationDelay: '0.5s'}}>
                <h2 className="form-title">Request Information</h2>
                <p className="form-subtitle">¡Leave us your data!</p>

                <form className="contact-form" onSubmit={handleSubmit}>
                  <div className="form-row names-row">
                    <div className="form-group">
                      <input
                        type="text"
                        name="firstName"
                        placeholder="Nombres*"
                        className="form-input"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <input
                        type="text"
                        name="lastName"
                        placeholder="Apellidos*"
                        className="form-input"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <input
                        type="tel"
                        name="phone"
                        placeholder="+57 321 1234567"
                        className="form-input"
                        value={formData.phone}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-group">
                      <input
                        type="email"
                        name="email"
                        placeholder="Ingresa tu email*"
                        className="form-input"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <select 
                        name="level"
                        className="form-select"
                        value={formData.level}
                        onChange={handleInputChange}
                      >
                        <option value="">Elige el programa que más se adapte a ti</option>
                        <option value="nivel1">Programa English Nivel 1</option>
                        <option value="nivel2">Programa English Nivel 2</option>
                        <option value="nivel3">Programa English Nivel 3</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <select 
                        name="reason"
                        className="form-select"
                        value={formData.reason}
                        onChange={handleInputChange}
                      >
                        <option value="">Quiero aprender inglés por tema de:</option>
                        <option value="trabajo">Trabajo</option>
                        <option value="estudios">Estudios</option>
                        <option value="viajes">Viajes</option>
                        <option value="desarrollo">Desarrollo personal</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <select 
                        name="source"
                        className="form-select"
                        value={formData.source}
                        onChange={handleInputChange}
                      >
                        <option value="">¿Por cuál medio te enteraste de nosotros?</option>
                        <option value="redes">Redes sociales</option>
                        <option value="recomendacion">Recomendación</option>
                        <option value="google">Búsqueda en Google</option>
                        <option value="publicidad">Publicidad</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <select 
                        name="contactMethod"
                        className="form-select"
                        value={formData.contactMethod}
                        onChange={handleInputChange}
                      >
                        <option value="">¿Te contactamos por?</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="llamada">Llamada</option>
                        <option value="email">Email</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row country-city-row">
                    <div className="form-group">
                      <input
                        type="text"
                        name="country"
                        placeholder="País*"
                        className="form-input"
                        value={formData.country}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <input
                        type="text"
                        name="city"
                        placeholder="Ciudad*"
                        className="form-input"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  {/* Mensaje de estado */}
                  {submitMessage && (
                    <div className={`submit-message ${submitStatus}`}>
                      {submitMessage}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    className="submit-button"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Enviando...' : '¡Empezar hoy!'}
                  </button>
                </form>
              </div>
            </div>
          </ScrollReveal>
        </section>
      </div>
      
      {/* WhatsApp Floating Button */}
      <div 
        className="whatsapp-float"
        onClick={() => window.open('https://wa.me/3164844819?text=Hola,%20me%20interesa%20información%20sobre%20los%20cursos%20de%20inglés.%20Mi%20nombre%20es%20[escribe%20tu%20nombre],%20soy%20de%20[escribe%20tu%20ciudad%20y%20país]%20y%20quiero%20estudiar%20inglés%20porque%20[escribe%20tu%20razón].', '_blank')}
        title="Contáctanos por WhatsApp"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.097"/>
        </svg>
      </div>
    </div>
  );
}
