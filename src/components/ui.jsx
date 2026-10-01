export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-(--color-petrol-100) shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const variants = {
    primary: 'bg-(--color-petrol-600) text-white hover:bg-(--color-petrol-700) shadow-md shadow-(--color-petrol-600)/20 hover:shadow-lg hover:shadow-(--color-petrol-600)/30',
    amber: 'bg-(--color-amber-400) text-(--color-petrol-900) hover:bg-(--color-amber-500) shadow-md shadow-(--color-amber-400)/30 hover:shadow-lg hover:shadow-(--color-amber-400)/40',
    ghost: 'bg-transparent text-(--color-petrol-600) hover:bg-(--color-petrol-50)',
    danger: 'bg-(--color-clay-100) text-(--color-clay-500) hover:bg-(--color-clay-100)/70',
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

const STATUT_STYLES = {
  EN_ATTENTE: 'bg-(--color-amber-400)/20 text-(--color-amber-500)',
  CONFIRME: 'bg-(--color-sage-100) text-(--color-sage-500)',
  ANNULE: 'bg-(--color-clay-100) text-(--color-clay-500)',
  TERMINE: 'bg-(--color-petrol-100) text-(--color-petrol-600)',
  NO_SHOW: 'bg-(--color-clay-100) text-(--color-clay-500)',
  REFUSE: 'bg-(--color-clay-100) text-(--color-clay-500)',
};

const STATUT_LABELS = {
  EN_ATTENTE: 'En attente du médecin',
  CONFIRME: 'Confirmé',
  ANNULE: 'Annulé',
  TERMINE: 'Terminé',
  NO_SHOW: 'Absence',
  REFUSE: 'Refusé',
};

export function StatutBadge({ statut }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${STATUT_STYLES[statut] || 'bg-(--color-petrol-50) text-(--color-ink-600)'}`}>
      {STATUT_LABELS[statut] || statut}
    </span>
  );
}

export function Spinner({ className = '' }) {
  return (
    <div className={`animate-spin rounded-full border-2 border-(--color-petrol-200) border-t-(--color-petrol-600) ${className}`} />
  );
}

export function FieldLabel({ children }) {
  return <label className="block text-sm font-medium text-(--color-ink-600) mb-1.5">{children}</label>;
}

export function TextInput(props) {
  return (
    <input
      className="w-full px-3.5 py-2.5 rounded-xl border border-(--color-petrol-100) bg-white text-(--color-ink-900) placeholder:text-(--color-ink-300) focus:border-(--color-petrol-400) focus:ring-2 focus:ring-(--color-petrol-100) outline-none transition-shadow"
      {...props}
    />
  );
}

export function Select(props) {
  return (
    <select
      className="w-full px-3.5 py-2.5 rounded-xl border border-(--color-petrol-100) bg-white text-(--color-ink-900) focus:border-(--color-petrol-400) focus:ring-2 focus:ring-(--color-petrol-100) outline-none transition-shadow"
      {...props}
    />
  );
}

const STATUT_COMPTE_STYLES = {
  EN_ATTENTE: 'bg-(--color-amber-400)/20 text-(--color-amber-500)',
  APPROUVE: 'bg-(--color-sage-100) text-(--color-sage-500)',
  REJETE: 'bg-(--color-clay-100) text-(--color-clay-500)',
};

const STATUT_COMPTE_LABELS = {
  EN_ATTENTE: 'En attente',
  APPROUVE: 'Approuvé',
  REJETE: 'Rejeté',
};

export function StatutCompteBadge({ statut }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${STATUT_COMPTE_STYLES[statut] || 'bg-(--color-petrol-50) text-(--color-ink-600)'}`}>
      {STATUT_COMPTE_LABELS[statut] || statut}
    </span>
  );
}

const ROLE_LABELS = {
  PATIENT: 'Patient',
  MEDECIN: 'Médecin',
  ADMIN: 'Administrateur',
  DIRECTEUR: 'Directeur',
  INFIRMIER: 'Infirmier(e)',
  PHARMACIEN: 'Pharmacien(ne)',
};

export function RoleBadge({ role }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-(--color-petrol-50) text-(--color-petrol-600)">
      {ROLE_LABELS[role] || role}
    </span>
  );
}

export function Textarea(props) {
  return (
    <textarea
      className="w-full px-3.5 py-2.5 rounded-xl border border-(--color-petrol-100) bg-white text-(--color-ink-900) placeholder:text-(--color-ink-300) focus:border-(--color-petrol-400) focus:ring-2 focus:ring-(--color-petrol-100) outline-none transition-shadow resize-none"
      {...props}
    />
  );
}

export function PageHeader({ title, description, action }) {
  return (
    <div className="flex items-start justify-between flex-wrap gap-3">
      <div>
        <h1 className="font-display font-bold text-2xl text-(--color-petrol-700)">{title}</h1>
        {description && <p className="text-(--color-ink-600) mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-(--color-petrol-50) flex items-center justify-center mb-4">
          <Icon size={22} className="text-(--color-petrol-400)" strokeWidth={1.75} />
        </div>
      )}
      <h3 className="font-display font-semibold text-(--color-ink-900) mb-1">{title}</h3>
      {description && <p className="text-sm text-(--color-ink-600) max-w-sm mb-4">{description}</p>}
      {action}
    </div>
  );
}

/** Note sur 5 en etoiles (lecture seule, ou saisie si onChange est fourni). */
export function Etoiles({ valeur = 0, onChange, taille = 16 }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${valeur} sur 5`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const pleine = n <= Math.round(valeur);
        const etoile = (
          <svg width={taille} height={taille} viewBox="0 0 24 24" aria-hidden="true"
            className={pleine ? 'fill-(--color-amber-400) text-(--color-amber-400)' : 'fill-transparent text-(--color-ink-300)'}>
            <path stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"
              d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z" />
          </svg>
        );
        return onChange ? (
          <button key={n} type="button" onClick={() => onChange(n)} className="p-0.5" aria-label={`${n} étoile${n > 1 ? 's' : ''}`}>{etoile}</button>
        ) : <span key={n}>{etoile}</span>;
      })}
    </span>
  );
}
