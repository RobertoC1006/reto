import { useEffect, useState } from 'react';
import { NavLink, Outlet, Link, useLocation, useNavigate } from 'react-router';
import {
  Bell,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronDown,
  House,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  Settings,
  Users,
  X,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../shared/api/services';
import { Avatar, BrandLeaves, Button, Logo, Modal } from '../shared/components/ui';
import { useAuth } from '../app/auth';
const links = [
  { to: '/app/dashboard', label: 'Dashboard', icon: House },
  { to: '/app/leads', label: 'Leads / Pacientes', icon: Users },
  { to: '/app/citas', label: 'Citas', icon: CalendarDays },
  { to: '/app/mensajes', label: 'Mensajes', icon: MessageSquare },
  { to: '/app/reportes', label: 'Reportes', icon: ChartNoAxesCombined },
];
export default function AdminLayout() {
  const [mobile, setMobile] = useState(false),
    [notifications, setNotifications] = useState(false),
    [search, setSearch] = useState('');
  const location = useLocation(),
    navigate = useNavigate(),
    auth = useAuth(),
    client = useQueryClient();
  const conversations = useQuery({
    queryKey: ['conversations'],
    queryFn: api.conversations,
    refetchInterval: 10000,
  });
  useEffect(() => {
    const refresh = () => {
      void client.invalidateQueries();
    };
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, [client]);
  return (
    <div className="admin-shell">
      <a className="skip-link" href="#main-content">
        Ir al contenido
      </a>
      {mobile && (
        <button
          className="sidebar-backdrop"
          aria-label="Cerrar menú"
          onClick={() => setMobile(false)}
        />
      )}
      <aside className={`sidebar ${mobile ? 'sidebar-open' : ''}`}>
        <Link to="/" className="sidebar-logo">
          <Logo light />
        </Link>
        <button
          className="icon-btn sidebar-close"
          aria-label="Cerrar menú"
          onClick={() => setMobile(false)}
        >
          <X />
        </button>
        <div className="sidebar-caption">TU CONSULTORIO</div>
        <nav aria-label="Navegación principal">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} onClick={() => setMobile(false)}>
              <Icon size={19} />
              <span>{label}</span>
              {label === 'Mensajes' && (
                <span className="nav-counter">
                  {conversations.data?.filter((c) => c.unread > 0).length || 0}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <NavLink to="/app/configuracion" onClick={() => setMobile(false)}>
            <Settings size={18} />
            <span>Configuración</span>
          </NavLink>
          <BrandLeaves />
          <div className="sidebar-user">
            <Avatar name="Dr. Roberto" />
            <div>
              <strong>Dr. {auth.data?.name || 'Roberto'}</strong>
              <small>Administrador</small>
            </div>
            <button
              className="icon-btn"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              onClick={async () => {
                await auth.logout();
                navigate('/login');
              }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
      <div className="admin-workspace">
        <header className="admin-topbar">
          <div className="breadcrumbs">
            <button
              className="icon-btn mobile-menu"
              aria-label="Abrir menú"
              onClick={() => setMobile(true)}
            >
              <Menu />
            </button>
            <span>Consultorio Praxia</span>
            <span>/</span>
            <strong>
              {links.find((l) => location.pathname.startsWith(l.to))?.label || 'Configuración'}
            </strong>
          </div>
          <div className="topbar-actions">
            <form
              className="topbar-search"
              onSubmit={(e) => {
                e.preventDefault();
                navigate(`/app/leads?q=${encodeURIComponent(search)}`);
              }}
            >
              <Search size={16} />
              <input
                aria-label="Buscar pacientes"
                placeholder="Buscar pacientes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <kbd>↵</kbd>
            </form>
            <button
              className="notification-btn icon-btn"
              aria-label="Ver notificaciones"
              onClick={() => setNotifications(true)}
            >
              <Bell size={20} />
              <span />
            </button>
            <Link className="topbar-profile" to="/app/configuracion">
              <Avatar name="Dr. Roberto" size="small" />
              <ChevronDown size={13} />
            </Link>
          </div>
        </header>
        <main id="main-content" className="admin-main">
          <Outlet />
        </main>
        <footer className="admin-footer">
          <span>Praxia · Consultorios más cerca de ti</span>
          <span>Hecho para cuidar mejor.</span>
        </footer>
      </div>
      <Modal
        open={notifications}
        onClose={() => setNotifications(false)}
        title="Actividad reciente"
        description="Mensajes que necesitan tu atención."
      >
        <div className="notification-list">
          {conversations.data
            ?.filter((c) => c.unread > 0)
            .map((c) => (
              <Link
                key={c.id}
                to={`/app/mensajes?conversation=${c.id}`}
                onClick={() => setNotifications(false)}
              >
                <MessageSquare size={20} />
                <span>{c.messages.at(-1)?.text}</span>
              </Link>
            ))}
          {!conversations.data?.some((c) => c.unread > 0) && <p>No tienes mensajes nuevos.</p>}
          <Button
            variant="secondary"
            onClick={() => {
              navigate('/app/mensajes');
              setNotifications(false);
            }}
          >
            Ir a mensajes
          </Button>
        </div>
      </Modal>
    </div>
  );
}
