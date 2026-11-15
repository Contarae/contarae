import { useEffect, useRef, useState } from 'react';
import './HomeHero.css';

const services = [
  { id: 'certification', label: 'Certificaciones', category: 'RESPALDO PROFESIONAL', title: 'Certificación de ingresos', description: 'Solicite su certificado firmado por Contador Público.', href: '#certificacion' },
  { id: 'automation', label: 'Automatización', category: 'SOLUCIONES DIGITALES', title: 'Automatización de procesos', description: 'Conecte sus herramientas. Simplifique su día a día.', href: '/servicios-contables#automatizacion-procesos' },
  { id: 'web', label: 'Desarrollo web', category: 'SOLUCIONES DIGITALES', title: 'Desarrollo web con IA aplicada', description: 'Una página pensada para sus clientes y conectada con su negocio.', href: '/servicios-contables#desarrollo-web-ia' },
  { id: 'accounting', label: 'Contabilidad', category: 'ACOMPAÑAMIENTO CONTABLE', title: 'Claridad para sus finanzas', description: 'Contabilidad, impuestos y orientación para tomar decisiones.', href: '#planes' },
];

export default function HomeHero() {
  // Start with the approved automation card; certification remains a permanent CTA.
  const [active, setActive] = useState(1);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const carousel = useRef(null);

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const updateMotion = () => setReducedMotion(media ? media.matches : true);
    const updateVisibility = () => setPageVisible(!document.hidden);
    updateMotion();
    updateVisibility();
    media?.addEventListener?.('change', updateMotion);
    document.addEventListener('visibilitychange', updateVisibility);
    const observer = typeof IntersectionObserver === 'function'
      ? new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.2 })
      : null;
    if (observer) observer.observe(carousel.current);
    else setVisible(true);
    return () => {
      media?.removeEventListener?.('change', updateMotion);
      document.removeEventListener('visibilitychange', updateVisibility);
      observer?.disconnect();
    };
  }, []);

  const rotating = !paused && !hovered && !reducedMotion && visible && pageVisible;
  useEffect(() => {
    if (!rotating) return undefined;
    const timer = window.setInterval(() => setActive(current => (current + 1) % services.length), 6500);
    return () => window.clearInterval(timer);
  }, [rotating]);

  const select = index => {
    setPaused(true);
    setActive((index + services.length) % services.length);
  };

  return (
    <section id="inicio" className="home-hero" aria-labelledby="home-heading">
      <div className="home-hero__layout">
        <div className="home-hero__copy">
          <h1 id="home-heading">Contabilidad y <span>tecnología</span> para su negocio.</h1>
          <p className="home-hero__intro">Servicios contables, automatización de procesos y desarrollo de páginas web con IA aplicada.</p>
          <div className="home-hero__actions">
            <a className="home-hero__primary" href="#certificacion">Solicitar certificación de ingresos</a>
            <a className="home-hero__all" href="#servicios">Ver todos los servicios <span aria-hidden="true">→</span></a>
          </div>
          <div className="home-hero__digital">
            <p>Soluciones digitales</p>
            <div>
              <a href="/servicios-contables#automatizacion-procesos">Automatización de procesos <span aria-hidden="true">↗</span></a>
              <a href="/servicios-contables#desarrollo-web-ia">Desarrollo web con IA <span aria-hidden="true">↗</span></a>
            </div>
          </div>
          <div className="home-hero__accounting-links">
            <a href="#planes">Planes contables</a><span aria-hidden="true">·</span><a href="/declaracion-de-renta-personas-naturales">Declaración de renta</a>
          </div>
        </div>

        <div ref={carousel} className={`home-carousel${rotating ? ' is-playing' : ''}`} role="region" aria-roledescription="carrusel" aria-label="Servicios destacados"
          onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
          onFocusCapture={event => { if (!event.target.closest('[data-rotation-control]')) setPaused(true); }}
          onTouchStart={event => { if (!event.target.closest('[data-rotation-control]')) setPaused(true); }}>
          <div className="home-carousel__stage" aria-live={paused || reducedMotion ? 'polite' : 'off'}>
            {services.map((service, index) => (
              <article key={service.id} id={`home-slide-${service.id}`} className="home-carousel__card" hidden={index !== active}
                role="group" aria-roledescription="diapositiva" aria-label={`${index + 1} de ${services.length}: ${service.label}`}>
                <p className="home-carousel__category">{service.category}</p>
                <div className="home-carousel__art">
                  <img src={`/images/home/${service.id}.webp`} alt="" width="800" height="500" decoding="async" loading={index === 1 ? 'eager' : 'lazy'} />
                </div>
                <h2>{service.title}</h2>
                <p className="home-carousel__description">{service.description}</p>
                <a href={service.href}>Conocer el servicio <span aria-hidden="true">→</span></a>
              </article>
            ))}
          </div>
          <div className="home-carousel__controls">
            <button type="button" onClick={() => select(active - 1)} aria-label="Servicio anterior">←</button>
            <span aria-hidden="true"><strong>{String(active + 1).padStart(2, '0')}</strong> / 04</span>
            <button type="button" onClick={() => select(active + 1)} aria-label="Servicio siguiente">→</button>
            {!reducedMotion && <button type="button" data-rotation-control onClick={() => setPaused(current => !current)} aria-label={paused ? 'Reanudar presentación' : 'Pausar presentación'}>{paused ? '▷' : 'Ⅱ'}</button>}
          </div>
          <div className="home-carousel__selectors" role="group" aria-label="Elegir un servicio">
            {services.map((service, index) => <button key={service.id} type="button" aria-pressed={index === active} aria-controls={`home-slide-${service.id}`} onClick={() => select(index)}>{service.label}</button>)}
          </div>
        </div>
      </div>
    </section>
  );
}
