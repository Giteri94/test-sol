import { type ReactNode, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Clock3, Globe2, MapPin } from 'lucide-react';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

function Home() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    document.title = 'Heure locale — Sol';
    const description = "Une horloge affichant l'heure locale en temps réel.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description);

    let intervalId: number | undefined;
    const timeoutId = window.setTimeout(() => {
      setNow(new Date());
      intervalId = window.setInterval(() => setNow(new Date()), 1000);
    }, 1000 - (Date.now() % 1000));

    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId) window.clearInterval(intervalId);
    };
  }, []);

  const locale =
    typeof navigator !== 'undefined' && navigator.language?.startsWith('fr')
      ? navigator.language
      : 'fr-FR';
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local time';
  const timeZoneName =
    new Intl.DateTimeFormat(locale, { timeZoneName: 'long' })
      .formatToParts(now)
      .find((part) => part.type === 'timeZoneName')?.value || timeZone;
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const dateLabel = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(now);
  const offsetMinutes = -now.getTimezoneOffset();
  const offsetSign = offsetMinutes >= 0 ? '+' : '−';
  const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
  const offsetRemainder = Math.abs(offsetMinutes) % 60;
  const utcOffset = `UTC${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetRemainder).padStart(2, '0')}`;

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-background text-foreground">
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full border border-accent/15" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full border border-accent/10" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-[-12rem] right-[-8rem] h-[28rem] w-[28rem] rounded-full border border-secondary/60" />

      <header className="sol-rise relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-7 sm:px-10 lg:px-14" data-testid="header-app">
        <div className="flex items-center gap-3" data-testid="brand-sol">
          <span className="sun-mark shrink-0" aria-hidden="true" />
          <div className="leading-none">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.28em] text-foreground">Sol</p>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Local time</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border/80 bg-card/60 px-3 py-2 shadow-sm backdrop-blur-sm" data-testid="status-timezone">
          <Globe2 className="h-3.5 w-3.5 text-accent" strokeWidth={1.7} aria-hidden="true" />
          <span className="max-w-[9rem] truncate font-mono text-[10px] uppercase tracking-[0.13em] text-muted-foreground sm:max-w-none">
            {timeZone}
          </span>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center px-5 pb-10 pt-10 sm:px-10 sm:pt-16 lg:px-14 lg:pt-20">
        <section className="w-full text-center" aria-labelledby="page-title">
          <p className="sol-rise sol-rise-delay-1 font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-accent" data-testid="text-eyebrow">
            Horloge locale
          </p>
          <h1 id="page-title" className="sol-rise sol-rise-delay-1 mx-auto mt-5 max-w-2xl font-serif text-5xl leading-[.92] tracking-[-0.045em] text-primary sm:text-7xl lg:text-[6.6rem]" data-testid="text-page-title">
            L'heure, <em className="text-accent">simplement.</em>
          </h1>
          <p className="sol-rise sol-rise-delay-2 mx-auto mt-6 max-w-md text-sm leading-6 text-muted-foreground sm:text-base" data-testid="text-intro">
            Une petite pause pour regarder l'heure. Votre temps local, clair et proche.
          </p>
        </section>

        <section className="sol-rise sol-rise-delay-2 clock-face mt-12 w-full max-w-4xl overflow-hidden rounded-[1.75rem] border border-card-border px-5 py-7 sm:mt-16 sm:px-12 sm:py-11" aria-labelledby="clock-heading">
          <div className="relative z-10 flex items-center justify-between gap-4 border-b border-border/70 px-1 pb-5">
            <div className="flex items-center gap-2.5">
              <Clock3 className="h-4 w-4 text-accent" strokeWidth={1.7} aria-hidden="true" />
              <h2 id="clock-heading" className="font-mono text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground">Horloge locale</h2>
            </div>
            <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground" data-testid="status-live">
              <span className="h-1.5 w-1.5 rounded-full bg-accent sol-breathe" aria-hidden="true" />
              <span>En direct · chaque seconde</span>
            </div>
          </div>

          <div className="relative z-10 py-12 sm:py-16">
            <time
              dateTime={now.toISOString()}
              aria-label={`${hours} hours, ${minutes} minutes, ${seconds} seconds`}
              aria-live="polite"
              className="flex items-baseline justify-center whitespace-nowrap text-primary"
              data-testid="display-local-time"
            >
              <span className="time-segment text-[clamp(4.6rem,18vw,10.5rem)] leading-[.78]">{hours}</span>
              <span className="mx-2 font-serif text-[clamp(3rem,10vw,6.5rem)] leading-none text-muted-foreground/55 sm:mx-4" aria-hidden="true">:</span>
              <span className="time-segment text-[clamp(4.6rem,18vw,10.5rem)] leading-[.78]">{minutes}</span>
              <span className="mx-2 font-serif text-[clamp(3rem,10vw,6.5rem)] leading-none text-muted-foreground/55 sm:mx-4" aria-hidden="true">:</span>
              <span key={seconds} className="time-segment sol-tick text-[clamp(3.6rem,14vw,8rem)] leading-[.78] text-accent">{seconds}</span>
            </time>
            <div className="mt-5 flex justify-center gap-[clamp(2.75rem,11vw,7.7rem)] pl-[clamp(.75rem,4vw,2.5rem)] font-mono text-[9px] uppercase tracking-[0.24em] text-muted-foreground" aria-hidden="true">
              <span>Heure</span>
              <span>Minute</span>
              <span>Seconde</span>
            </div>
          </div>

          <div className="relative z-10 flex flex-col items-center justify-between gap-5 border-t border-border/70 px-1 pt-6 sm:flex-row">
            <div className="text-center sm:text-left">
              <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">Aujourd'hui</p>
              <p className="mt-1 font-serif text-2xl tracking-[-0.02em] text-primary sm:text-[1.7rem]" data-testid="display-local-date">{dateLabel}</p>
            </div>
            <div className="flex items-center gap-3 text-center sm:text-right">
              <div className="hidden h-9 w-px bg-border sm:block" aria-hidden="true" />
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">Votre fuseau horaire</p>
                <p className="mt-1 text-xs font-medium text-primary" data-testid="display-timezone-name">{timeZoneName}</p>
                <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground" data-testid="display-utc-offset">{utcOffset}</p>
              </div>
              <MapPin className="h-4 w-4 text-accent" strokeWidth={1.7} aria-hidden="true" />
            </div>
          </div>
        </section>

        <div className="sol-rise sol-rise-delay-3 mt-10 flex items-center gap-4 text-center" data-testid="text-sync-note">
          <span className="h-px w-8 bg-border sm:w-14" aria-hidden="true" />
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Défini par votre appareil · aucun compte requis</p>
          <span className="h-px w-8 bg-border sm:w-14" aria-hidden="true" />
        </div>
      </main>

      <footer className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 pb-7 pt-5 sm:px-10 lg:px-14" data-testid="footer-app">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">SOL / 01</p>
        <p className="font-serif text-sm italic text-muted-foreground">Faites place à l'instant.</p>
      </footer>
    </div>
  );
}

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
