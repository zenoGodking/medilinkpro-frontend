import { Link } from 'react-router-dom';
import {
  Stethoscope, MapPin, FileHeart, CalendarCheck, QrCode, ShieldCheck,
  ArrowRight, Search, Navigation, BadgeCheck, HeartPulse, Building2,
  UserCog, ChevronRight,
} from 'lucide-react';
import { Button } from '../../components/ui';
import EtablissementsShowcase from '../../components/marketing/EtablissementsShowcase';
import Reveal from '../../components/marketing/Reveal';
import PulseDivider from '../../components/marketing/PulseDivider';

const ESPACES = [
  {
    role: 'Patient',
    icon: FileHeart,
    description: "Votre dossier medical, vos ordonnances et vos rendez-vous, toujours a portee de main.",
    accent: 'text-(--color-sage-500)',
    bg: 'bg-(--color-sage-100)',
    bar: 'bg-(--color-sage-500)',
  },
  {
    role: 'Medecin',
    icon: Stethoscope,
    description: "Gerez votre agenda, vos consultations et vos ordonnances numeriques depuis un seul espace.",
    accent: 'text-(--color-petrol-600)',
    bg: 'bg-(--color-petrol-50)',
    bar: 'bg-(--color-petrol-600)',
  },
  {
    role: 'Infirmier(e)',
    icon: HeartPulse,
    description: "Recevez les demandes de soins a domicile des patients proches de vous et guidez-vous jusqu'a eux.",
    accent: 'text-(--color-amber-500)',
    bg: 'bg-(--color-amber-400)/20',
    bar: 'bg-(--color-amber-400)',
  },
  {
    role: 'Directeur',
    icon: Building2,
    description: "Supervisez vos etablissements, vos equipes medicales et votre activite en un coup d'oeil.",
    accent: 'text-(--color-clay-500)',
    bg: 'bg-(--color-clay-100)',
    bar: 'bg-(--color-clay-500)',
  },
  {
    role: 'Administrateur',
    icon: UserCog,
    description: "Validez les inscriptions professionnelles et gardez la plateforme fiable et securisee.",
    accent: 'text-(--color-petrol-600)',
    bg: 'bg-(--color-petrol-50)',
    bar: 'bg-(--color-petrol-600)',
  },
];

const MODULES = [
  {
    icon: FileHeart,
    title: 'Dossier medical electronique',
    description: "Consultations, diagnostics et resultats d'analyses centralises et chiffres, accessibles a tout moment.",
    accent: 'text-(--color-petrol-600)',
    bg: 'from-white to-(--color-petrol-50)',
    iconBg: 'bg-(--color-petrol-600)',
  },
  {
    icon: QrCode,
    title: 'Ordonnances numeriques',
    description: 'Chaque ordonnance est verifiable en pharmacie via un code unique, sans papier a perdre.',
    accent: 'text-(--color-amber-500)',
    bg: 'from-white to-(--color-amber-400)/15',
    iconBg: 'bg-(--color-amber-500)',
  },
  {
    icon: MapPin,
    title: 'Specialistes geolocalises',
    description: 'Trouvez le bon medecin pres de chez vous, trie par specialite et par distance reelle.',
    accent: 'text-(--color-sage-500)',
    bg: 'from-white to-(--color-sage-100)',
    iconBg: 'bg-(--color-sage-500)',
  },
  {
    icon: CalendarCheck,
    title: 'Rendez-vous instantanes',
    description: 'Creneaux verifies en temps reel : plus de double reservation, confirmation immediate.',
    accent: 'text-(--color-clay-500)',
    bg: 'from-white to-(--color-clay-100)',
    iconBg: 'bg-(--color-clay-500)',
  },
];

function MockSearchCard() {
  return (
    <div className="relative bg-white rounded-2xl border border-(--color-petrol-100) shadow-xl shadow-(--color-petrol-900)/10 p-5 sm:p-6 w-full max-w-sm hover:-translate-y-1 transition-transform duration-500">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 flex items-center gap-2 bg-(--color-petrol-50) rounded-xl px-3 py-2.5">
          <Search size={15} className="text-(--color-petrol-400)" />
          <span className="text-sm text-(--color-ink-600)">Cardiologie</span>
        </div>
        <div className="w-9 h-9 rounded-xl bg-(--color-petrol-600) flex items-center justify-center shrink-0">
          <Navigation size={15} className="text-white" />
        </div>
      </div>

      <div className="space-y-2.5">
        {[
          { nom: 'Dr Ngono Paul', tag: 'Cardiologue', dist: 'Bastos', verifie: true },
          { nom: 'Dr Atangana Liz', tag: 'Cardiologue', dist: 'Mvog-Mbi', verifie: true },
          { nom: 'Dr Biloa Marc', tag: 'Cardiologue', dist: 'Essos', verifie: false },
        ].map((m) => (
          <div key={m.nom} className="flex items-center justify-between gap-3 border border-(--color-petrol-100) rounded-xl px-3.5 py-3 hover:bg-(--color-petrol-50)/50 transition-colors">
            <div>
              <p className="text-sm font-semibold text-(--color-ink-900) flex items-center gap-1.5">
                {m.nom}
                {m.verifie && (
                  <span className="relative inline-flex">
                    <BadgeCheck size={13} className="text-(--color-sage-500)" />
                    <span className="absolute inset-0 rounded-full bg-(--color-sage-500)/40 animate-pulse-dot" />
                  </span>
                )}
              </p>
              <p className="text-xs text-(--color-amber-500) font-medium">{m.tag}</p>
            </div>
            <span className="text-xs font-semibold text-(--color-petrol-600) shrink-0">{m.dist}</span>
          </div>
        ))}
      </div>

      <div className="absolute -right-4 -bottom-4 sm:-right-8 sm:-bottom-6 bg-(--color-petrol-600) text-white rounded-2xl px-4 py-3 shadow-lg shadow-(--color-petrol-900)/30 animate-float">
        <p className="text-[11px] uppercase tracking-wider text-(--color-amber-400) font-semibold">Rendez-vous</p>
        <p className="text-sm font-display font-semibold flex items-center gap-1.5 mt-0.5">
          <CalendarCheck size={14} /> Creneau confirme
        </p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="bg-(--color-ivory) text-(--color-ink-900) overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-(--color-petrol-100)/70 bg-(--color-ivory)/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-(--color-petrol-600) flex items-center justify-center text-white shadow-md shadow-(--color-petrol-600)/30">
              <Stethoscope size={18} strokeWidth={2.25} />
            </div>
            <span className="font-display font-semibold text-lg text-(--color-petrol-700) tracking-tight">
              MediLinkPro
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/connexion">
              <Button variant="ghost">Se connecter</Button>
            </Link>
            <Link to="/inscription">
              <Button variant="amber">S'inscrire</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-(--color-petrol-100)/60 blur-3xl animate-blob" />
          <div className="absolute top-10 right-0 w-72 h-72 rounded-full bg-(--color-amber-400)/20 blur-3xl animate-blob-slow" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 rounded-full bg-(--color-sage-100)/70 blur-3xl animate-blob" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-14 sm:pt-20 pb-16 sm:pb-24 grid lg:grid-cols-2 gap-12 items-center">
          <Reveal>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-(--color-petrol-600) bg-(--color-petrol-50) px-3 py-1.5 rounded-full">
              <span className="relative inline-flex w-1.5 h-1.5">
                <span className="absolute inset-0 rounded-full bg-(--color-sage-500) animate-pulse-dot" />
                <span className="w-1.5 h-1.5 rounded-full bg-(--color-sage-500)" />
              </span>
              Pensee pour le Cameroun
            </span>
            <h1 className="font-display font-bold text-4xl sm:text-5xl leading-[1.08] text-(--color-petrol-700) mt-5">
              Votre sante, vos specialistes,{' '}
              <span className="bg-gradient-to-r from-(--color-petrol-600) to-(--color-sage-500) bg-clip-text text-transparent">
                a portee de main.
              </span>
            </h1>
            <p className="text-(--color-ink-600) text-lg mt-5 max-w-md">
              MediLinkPro relie patients et professionnels de sante : dossier medical
              numerique, recherche de specialistes geolocalises et prise de rendez-vous
              en quelques clics.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-8">
              <Link to="/inscription">
                <Button variant="amber" className="text-base px-5 py-3">
                  Creer mon compte <ArrowRight size={17} />
                </Button>
              </Link>
              <Link to="/connexion">
                <Button variant="ghost" className="text-base px-5 py-3">
                  J'ai deja un compte
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-2 text-sm text-(--color-ink-600) mt-7">
              <ShieldCheck size={16} className="text-(--color-sage-500)" />
              Dossiers medicaux chiffres et confidentiels
            </div>
          </Reveal>

          <Reveal delay={150} className="flex justify-center lg:justify-end">
            <MockSearchCard />
          </Reveal>
        </div>
      </section>

      {/* Modules */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <Reveal>
          <div className="max-w-xl">
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-(--color-petrol-700)">
              Tout le parcours de soin, dans une seule application.
            </h2>
            <p className="text-(--color-ink-600) mt-3">
              De la prise de rendez-vous a l'ordonnance numerique, chaque etape est
              pensee pour vous faire gagner du temps.
            </p>
          </div>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
          {MODULES.map(({ icon: Icon, title, description, bg, iconBg }, i) => (
            <Reveal key={title} delay={i * 90}>
              <div className={`h-full bg-gradient-to-br ${bg} rounded-2xl border border-(--color-petrol-100) p-5 hover:-translate-y-1.5 hover:shadow-lg hover:shadow-(--color-petrol-900)/10 transition-all duration-300`}>
                <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-4 shadow-md shadow-(--color-ink-900)/10`}>
                  <Icon size={19} className="text-white" strokeWidth={1.75} />
                </div>
                <h3 className="font-display font-semibold text-(--color-ink-900)">{title}</h3>
                <p className="text-sm text-(--color-ink-600) mt-1.5">{description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <PulseDivider className="max-w-6xl mx-auto px-4 sm:px-6" />

      {/* Vitrine des etablissements (photos ajoutees par les Directeurs) */}
      <EtablissementsShowcase />

      {/* Espaces par role */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 border-t border-(--color-petrol-100)/70">
        <Reveal>
          <div className="max-w-xl">
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-(--color-petrol-700)">
              Un espace pense pour chaque metier de la sante.
            </h2>
            <p className="text-(--color-ink-600) mt-3">
              Patient, medecin, infirmier(e), directeur d'etablissement ou administrateur :
              chacun retrouve les outils qui lui correspondent.
            </p>
          </div>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
          {ESPACES.map(({ role, icon: Icon, description, accent, bg, bar }, i) => (
            <Reveal key={role} delay={i * 80}>
              <div className="relative h-full bg-white rounded-2xl border border-(--color-petrol-100) p-5 pt-6 flex flex-col overflow-hidden hover:-translate-y-1 hover:shadow-lg hover:shadow-(--color-petrol-900)/10 transition-all duration-300">
                <span className={`absolute top-0 left-0 right-0 h-1 ${bar}`} aria-hidden="true" />
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${bg} ${accent}`}>
                  <Icon size={19} strokeWidth={1.75} />
                </div>
                <h3 className="font-display font-semibold text-(--color-ink-900)">Espace {role}</h3>
                <p className="text-sm text-(--color-ink-600) mt-1.5 flex-1">{description}</p>
              </div>
            </Reveal>
          ))}

          <Reveal delay={ESPACES.length * 80}>
            <Link
              to="/inscription"
              className="h-full rounded-2xl border border-dashed border-(--color-petrol-200) p-5 pt-6 flex flex-col items-start justify-center gap-2 hover:border-(--color-petrol-400) hover:bg-(--color-petrol-50)/50 transition-colors group"
            >
              <span className="font-display font-semibold text-(--color-petrol-600)">Trouver mon espace</span>
              <span className="text-sm text-(--color-ink-600)">Inscrivez-vous selon votre profil</span>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-(--color-petrol-600) mt-1 group-hover:gap-2 transition-all">
                Commencer <ChevronRight size={15} />
              </span>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* CTA final */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <Reveal>
          <div className="relative overflow-hidden bg-gradient-to-br from-(--color-petrol-600) via-(--color-petrol-700) to-(--color-petrol-900) rounded-2xl px-6 sm:px-12 py-12 sm:py-16 text-center">
            <div className="absolute -left-12 -top-12 w-56 h-56 rounded-full bg-(--color-amber-400)/15 animate-blob" aria-hidden="true" />
            <div className="absolute right-0 bottom-0 w-40 h-40 rounded-full bg-(--color-sage-500)/10 animate-blob-slow" aria-hidden="true" />
            <h2 className="relative font-display font-bold text-2xl sm:text-3xl text-white">
              Pret a simplifier votre suivi medical ?
            </h2>
            <p className="relative text-white/80 mt-3 max-w-md mx-auto">
              Rejoignez MediLinkPro en quelques minutes, gratuitement.
            </p>
            <Link to="/inscription" className="relative inline-block mt-7">
              <Button variant="amber" className="text-base px-6 py-3">
                Creer mon compte <ArrowRight size={17} />
              </Button>
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="relative">
        <div className="h-px bg-gradient-to-r from-transparent via-(--color-petrol-200) to-transparent" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-(--color-ink-600)">
          <div className="flex items-center gap-2">
            <Stethoscope size={15} className="text-(--color-petrol-600)" />
            <span className="font-display font-semibold text-(--color-petrol-700)">MediLinkPro</span>
          </div>
          <p>Suivi medical et localisation des specialistes — Cameroun</p>
        </div>
      </footer>
    </div>
  );
}
