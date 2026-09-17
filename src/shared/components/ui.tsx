import {
  createContext,
  cloneElement,
  isValidElement,
  useContext,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
  type InputHTMLAttributes,
} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  MessageCircle,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { Link } from 'react-router';
import { initials, statusConfig, timeLabel } from '../utils';
import type { Message } from '../types';
export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className={`brand ${light ? 'brand-light' : ''}`}>
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <path
          d="M16 4h8v12h12v8H24v12h-8V24H4v-8h12z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
      </svg>
      <span>
        Praxia<span className="brand-dot">.</span>
      </span>
    </span>
  );
}
export function WhatsAppIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20.5 11.6a8.5 8.5 0 0 1-12.7 7.4L3 20.5l1.5-4.6A8.5 8.5 0 1 1 20.5 11.6Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M8.2 7.3c-.8.2-1 1.4-.6 2.4 1 2.5 2.8 4.2 5.4 5.2 1.3.4 2.1-.1 2.6-1.1l-2.2-1.5-.8 1c-1.4-.6-2.5-1.6-3.1-3l.9-.8-1.2-2.2Z"
        fill="currentColor"
      />
    </svg>
  );
}
export function Button({
  variant = 'primary',
  loading,
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'teal' | 'whatsapp';
  loading?: boolean;
}) {
  return (
    <button
      {...props}
      className={`btn btn-${variant} ${className}`}
      disabled={props.disabled || loading}
    >
      {loading && <LoaderCircle className="spin" size={17} />} {children}
    </button>
  );
}
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>;
}
export function Avatar({
  name,
  size = 'normal',
}: {
  name: string;
  size?: 'small' | 'normal' | 'large';
}) {
  const color = name.charCodeAt(0) % 5;
  return (
    <span className={`avatar avatar-${size} avatar-color-${color}`} aria-hidden="true">
      {initials(name)}
    </span>
  );
}
export function Badge({ status }: { status: keyof typeof statusConfig }) {
  const config = statusConfig[status];
  return (
    <span className={`badge badge-${config.tone}`}>
      <span className="status-dot" />
      {config.label}
    </span>
  );
}
export function PageHeader({
  title,
  subtitle,
  action,
  back,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  back?: string;
}) {
  return (
    <header className="page-header">
      <div>
        {back && (
          <Link className="back-link" to={back}>
            <ArrowLeft size={15} /> Volver
          </Link>
        )}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action && <div className="page-actions">{action}</div>}
    </header>
  );
}
export function Field({
  label,
  required,
  error,
  children,
  htmlFor,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className={`field ${error ? 'field-error' : ''}`}>
      <label htmlFor={htmlFor}>
        {label} {required && <span className="required" aria-hidden="true">*</span>}
      </label>
      {isValidElement<InputHTMLAttributes<HTMLInputElement>>(children) &&
      typeof children.type === 'string' && ['input', 'select', 'textarea'].includes(children.type)
        ? cloneElement(children, { 'aria-label': label, 'aria-required': required, 'aria-invalid': !!error, 'aria-describedby': error ? `${htmlFor}-error` : undefined })
        : children}
      {error && (
        <span role="alert" className="field-message" id={`${htmlFor}-error`}>
          {error}
        </span>
      )}
    </div>
  );
}
export function SearchInput({
  value,
  onChange,
  placeholder = 'Buscar por nombre, teléfono o email...',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="search-field">
      <Search size={18} />
      <input
        aria-label={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <button className="icon-btn" aria-label="Limpiar búsqueda" onClick={() => onChange('')}>
          <X size={15} />
        </button>
      )}
    </div>
  );
}
export function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="skeleton-wrap" aria-label="Cargando" role="status">
      {Array.from({ length: rows }, (_, i) => (
        <div className="skeleton" key={i} />
      ))}
    </div>
  );
}
export function EmptyState({
  title = 'Todavía no hay resultados',
  message = 'Prueba con otros filtros o agrega tu primer registro.',
  action,
}: {
  title?: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Search size={27} />
      </span>
      <h3>{title}</h3>
      <p>{message}</p>
      {action}
    </div>
  );
}
export function ErrorState({ error, retry }: { error: Error; retry?: () => void }) {
  return (
    <div className="error-state" role="alert">
      <AlertCircle size={21} />
      <div>
        <strong>No pudimos cargar la información</strong>
        <p>{error.message}</p>
        {retry && (
          <Button variant="secondary" onClick={retry}>
            Reintentar
          </Button>
        )}
      </div>
    </div>
  );
}
export function Alert({ children }: { children: ReactNode }) {
  return (
    <div className="inline-alert" role="alert">
      <AlertCircle size={18} />
      <span>{children}</span>
    </div>
  );
}
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content
          className="modal-content"
          aria-describedby={description ? undefined : undefined}
        >
          <div className="modal-heading">
            <div>
              <Dialog.Title>{title}</Dialog.Title>
              {description && <Dialog.Description>{description}</Dialog.Description>}
            </div>
            <Dialog.Close className="icon-btn" aria-label="Cerrar ventana">
              <X size={21} />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  loading,
  danger = true,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  loading?: boolean;
  danger?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} description={message}>
      <div className="form-actions">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Volver
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
          Sí, continuar
        </Button>
      </div>
    </Modal>
  );
}
export function Pagination({
  page,
  pageSize,
  total,
  onChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onChange: (n: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="pagination">
      <span>
        Mostrando {total ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, total)} de{' '}
        {total} resultados
      </span>
      <div>
        <button
          aria-label="Página anterior"
          className="page-btn"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft size={16} />
        </button>
        {Array.from({ length: pages }, (_, i) => i + 1)
          .filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1)
          .map((n) => (
            <button
              className={`page-btn ${n === page ? 'active' : ''}`}
              aria-current={n === page ? 'page' : undefined}
              onClick={() => onChange(n)}
              key={n}
            >
              {n}
            </button>
          ))}
        <button
          aria-label="Página siguiente"
          className="page-btn"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
export function SectionHeading({
  title,
  to,
  children,
}: {
  title: string;
  to?: string;
  children?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <h2>{title}</h2>
      {to ? (
        <Link to={to}>
          Ver todos <ArrowRight size={14} />
        </Link>
      ) : (
        children
      )}
    </div>
  );
}
export function MessageBubble({
  item,
  audience = 'admin',
}: {
  item: Message;
  audience?: 'admin' | 'patient';
}) {
  const own = item.direction === (audience === 'admin' ? 'outbound' : 'inbound');
  return (
    <div className={`message-bubble ${own ? 'message-own' : ''}`}>
      <p>{item.text}</p>
      <span>
        {timeLabel(item.createdAt)} {own && <CheckCheck size={13} />}
      </span>
    </div>
  );
}
export function BrandLeaves() {
  return (
    <svg className="brand-leaves" viewBox="0 0 160 180" fill="none" aria-hidden="true">
      <path
        d="M73 170C74 113 104 61 137 21C160 91 117 143 73 170Z"
        fill="currentColor"
        opacity=".3"
      />
      <path d="M74 168C31 140 21 106 25 72C75 90 94 126 74 168Z" fill="currentColor" opacity=".5" />
      <path
        d="M76 174C94 139 122 124 155 122C144 162 107 186 76 174Z"
        fill="currentColor"
        opacity=".55"
      />
    </svg>
  );
}
const ToastContext = createContext<(text: string) => void>(() => {});
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<{ id: number; text: string }[]>([]);
  const add = (text: string) => {
    const id = Date.now() + Math.random();
    setItems((p) => [...p, { id, text }]);
    window.setTimeout(() => setItems((p) => p.filter((i) => i.id !== id)), 4500);
  };
  return (
    <ToastContext.Provider value={add}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {items.map((item) => (
          <div className="toast" key={item.id}>
            <span>
              <Check size={16} />
            </span>
            {item.text}
            <button
              className="icon-btn"
              aria-label="Cerrar notificación"
              onClick={() => setItems((p) => p.filter((i) => i.id !== item.id))}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
export const useToast = () => useContext(ToastContext);
export const AddIcon = Plus;
export const ChatIcon = MessageCircle;
