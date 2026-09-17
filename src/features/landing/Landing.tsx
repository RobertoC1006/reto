import { useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Heart,
  HeartPulse,
  MapPin,
  Menu,
  ShieldCheck,
  Stethoscope,
  UserRoundCheck,
  X,
} from 'lucide-react';
import { api } from '../../shared/api/services';
import { BrandLeaves, Button, Logo, WhatsAppIcon } from '../../shared/components/ui';
import WhatsAppChat from '../whatsapp/WhatsAppChat';
export default function Landing() {
  const [chat, setChat] = useState(false),
    [nav, setNav] = useState(false);
  const settings = useQuery({ queryKey: ['public-settings'], queryFn: api.publicSettings });
  return (
    <div className="landing-page">
      <a className="skip-link" href="#inicio">
        Ir al contenido
      </a>
      <header className="landing-header">
        <Link to="/" aria-label="Praxia, inicio">
          <Logo />
        </Link>
        <nav
          className={nav ? 'landing-nav nav-open' : 'landing-nav'}
          aria-label="Navegación pública"
        >
          {[
            ['Inicio', '#inicio'],
            ['Servicios', '#servicios'],
            ['Sobre nosotros', '#nosotros'],
            ['Contacto', '#contacto'],
          ].map(([label, href]) => (
            <a href={href} key={label} onClick={() => setNav(false)}>
              {label}
            </a>
          ))}
          <Link to="/login" className="staff-link">
            Acceso al sistema <ArrowRight size={14} />
          </Link>
        </nav>
        <Button variant="teal" onClick={() => setChat(true)}>
          Agendar cita <ArrowRight size={16} />
        </Button>
        <button
          className="icon-btn mobile-menu"
          aria-label={nav ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setNav(!nav)}
        >
          {nav ? <X /> : <Menu />}
        </button>
      </header>
      <main>
        <section className="landing-hero" id="inicio">
          <div className="hero-copy">
            <span className="hero-eyebrow">
              <span /> Cuidado más cerca de ti
            </span>
            <h1>
              Tu salud,
              <br />
              nuestra <span>prioridad.</span>
            </h1>
            <p className="hero-description">
              Agenda tu cita de forma rápida y sencilla desde WhatsApp. Sin llamadas, sin
              complicaciones.
            </p>
            <Button variant="teal" className="hero-cta" onClick={() => setChat(true)}>
              <WhatsAppIcon /> Agendar por WhatsApp <ArrowRight size={18} />
            </Button>
            <div className="hero-benefits">
              <div>
                <span>
                  <UserRoundCheck size={21} />
                </span>
                <p>
                  Atención
                  <br />
                  <strong>personalizada</strong>
                </p>
              </div>
              <div>
                <span>
                  <Clock3 size={21} />
                </span>
                <p>
                  Horarios
                  <br />
                  <strong>flexibles</strong>
                </p>
              </div>
              <div>
                <span>
                  <ShieldCheck size={21} />
                </span>
                <p>
                  Profesionales
                  <br />
                  <strong>calificados</strong>
                </p>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-photo-shape">
              <img
                src="/images/praxia-doctor.png"
                alt="Profesional de Praxia preparada para atenderte"
                width="1122"
                height="1402"
                fetchPriority="high"
              />
            </div>
            <div className="hero-floating-care">
              <span>
                <Heart size={19} />
              </span>
              <strong>
                Cuidamos
                <br />
                lo que más
                <br />
                importa.
              </strong>
            </div>
            <div className="hero-floating-status">
              <span>
                <ShieldCheck size={23} />
              </span>
              <div>
                <strong>Estás en buenas manos</strong>
                <p>Atención cercana y profesional</p>
              </div>
            </div>
            <BrandLeaves />
          </div>
        </section>
        <section className="booking-strip" aria-label="Agendar cita">
          <div className="booking-icon">
            <CalendarDays size={29} />
          </div>
          <div>
            <h2>Agenda tu cita en minutos</h2>
            <p>Escríbenos por WhatsApp y nuestro asistente virtual te ayudará.</p>
          </div>
          <button aria-label="Abrir WhatsApp para agendar" onClick={() => setChat(true)}>
            <ArrowRight size={24} />
          </button>
          <span className="booking-note">
            <Clock3 size={17} /> A tu ritmo, desde donde estés
          </span>
        </section>
        <section className="how-section" id="nosotros">
          <div className="section-intro">
            <span className="eyebrow">ASÍ DE SENCILLO</span>
            <h2>Más cerca de ti, en cada paso.</h2>
            <p>Nos encargamos de que cuidar tu salud empiece con una buena experiencia.</p>
          </div>
          <div className="steps-grid">
            {[
              {
                title: 'Escríbenos por WhatsApp',
                description: 'Abre el chat y cuéntanos cómo podemos ayudarte.',
              },
              {
                title: 'Elige tu mejor momento',
                description: 'Completa tus datos y selecciona el día y la hora.',
              },
              {
                title: 'Recibe tu confirmación',
                description: 'Consulta tu reserva y recibe el recordatorio de tu cita.',
              },
            ].map((step, i) => (
              <div className="how-step" key={step.title}>
                <span>{i + 1}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="services-section" id="servicios">
          <div className="section-intro">
            <span className="eyebrow">CUIDADO PARA CADA MOMENTO</span>
            <h2>Tu bienestar nos mueve.</h2>
            <p>Un espacio para escucharte, orientarte y acompañarte.</p>
          </div>
          <div className="services-grid">
            {[
              {
                icon: Stethoscope,
                title: 'Consulta general',
                text: 'La orientación que necesitas para dar el siguiente paso en tu bienestar.',
              },
              {
                icon: HeartPulse,
                title: 'Control médico',
                text: 'Seguimiento cercano para que continúes cuidando de ti.',
              },
              {
                icon: UserRoundCheck,
                title: 'Primera visita',
                text: 'Nos tomamos el tiempo de conocerte y escuchar tus necesidades.',
              },
            ].map(({ icon: Icon, title, text }) => (
              <article key={title}>
                <span>
                  <Icon size={26} />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
                <button className="text-button" onClick={() => setChat(true)}>
                  Agendar una cita <ArrowRight size={15} />
                </button>
              </article>
            ))}
          </div>
        </section>
        <section className="contact-section" id="contacto">
          <div>
            <span className="eyebrow">HABLEMOS DE TU BIENESTAR</span>
            <h2>Estamos para cuidarte.</h2>
            <p>
              <MapPin size={17} />
              {settings.data?.address || 'Av. Primavera 120, Lima'}
            </p>
            <p>
              <Clock3 size={17} />
              {settings.data?.opensAt || '08:00'} a {settings.data?.closesAt || '18:00'} · Hora de
              Lima
            </p>
          </div>
          <Button variant="teal" onClick={() => setChat(true)}>
            <WhatsAppIcon /> Hablar por WhatsApp <ArrowRight size={18} />
          </Button>
          <BrandLeaves />
        </section>
      </main>
      <footer className="landing-footer">
        <Logo />
        <p>Salud simple, personas primero.</p>
        <span>© {new Date().getFullYear()} Praxia · Operium</span>
      </footer>
      <button
        className="whatsapp-launcher"
        onClick={() => setChat(true)}
        aria-label="Abrir chat de WhatsApp"
      >
        <span>¿Agendamos tu cita?</span>
        <i>
          <WhatsAppIcon size={31} />
        </i>
      </button>
      <WhatsAppChat open={chat} onClose={() => setChat(false)} />
    </div>
  );
}
