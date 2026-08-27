import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Droplets,
  MapPin,
  Wind,
} from 'lucide-react';
import { cityLabel, type CityLocation } from '@/lib/location';

type OpenMeteoResponse = {
  current?: {
    temperature_2m?: number;
    apparent_temperature?: number;
    relative_humidity_2m?: number;
    weather_code?: number;
    wind_speed_10m?: number;
  };
};

type WeatherData = {
  locationId: number;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  icon: LucideIcon;
  updatedAt: string;
};

type WeatherState =
  | { status: 'loading' }
  | { status: 'error'; locationId: number }
  | { status: 'success'; data: WeatherData };

function weatherSummary(code: number): { condition: string; icon: LucideIcon } {
  if (code === 0) return { condition: 'Ciel dégagé', icon: CloudSun };
  if (code <= 3) return { condition: 'Éclaircies', icon: CloudSun };
  if (code === 45 || code === 48) return { condition: 'Brouillard', icon: CloudFog };
  if (code <= 57) return { condition: 'Bruine', icon: CloudRain };
  if (code <= 67) return { condition: 'Pluie', icon: CloudRain };
  if (code <= 77) return { condition: 'Neige', icon: CloudSnow };
  if (code <= 82) return { condition: 'Averses', icon: CloudRain };
  if (code <= 86) return { condition: 'Averses de neige', icon: CloudSnow };
  if (code <= 99) return { condition: 'Orages', icon: CloudLightning };
  return { condition: 'Conditions variables', icon: Cloud };
}

function formatTemperature(value: number) {
  return `${Math.round(value)}°C`;
}

function WeatherCardFrame({ children, busy = false }: { children: React.ReactNode; busy?: boolean }) {
  return (
    <section
      className="mt-8 grid w-full max-w-4xl overflow-hidden rounded-[1.75rem] border border-border bg-background shadow-[0_18px_48px_hsl(203_31%_21%_/_0.08)] sm:grid-cols-[.9fr_1.1fr]"
      aria-labelledby="weather-heading"
      aria-busy={busy}
      data-testid="weather-card"
    >
      {children}
    </section>
  );
}

function WeatherLoading({ cityName }: { cityName: string }) {
  return (
    <WeatherCardFrame busy>
      <div className="flex min-h-60 animate-pulse flex-col justify-between bg-secondary/50 p-7">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-muted-foreground">Météo actuelle</p>
          <h2 id="weather-heading" className="mt-3 flex items-center gap-2 font-serif text-4xl leading-none text-primary">
            <MapPin className="h-4 w-4 text-accent" aria-hidden="true" />
            {cityName}
          </h2>
        </div>
        <div className="h-16 w-24 rounded-full bg-muted" />
      </div>
      <div className="p-7">
        <div className="h-3 w-28 animate-pulse rounded-full bg-muted" />
        <div className="mt-6 grid grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index}>
              <div className="h-2 w-16 rounded-full bg-muted" />
              <div className="mt-3 h-5 w-12 rounded-full bg-muted" />
            </div>
          ))}
        </div>
        <p className="mt-8 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
          Récupération des conditions actuelles…
        </p>
      </div>
    </WeatherCardFrame>
  );
}

function WeatherError({ cityName }: { cityName: string }) {
  return (
    <WeatherCardFrame>
      <div className="flex min-h-60 flex-col justify-between bg-secondary/50 p-7">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-muted-foreground">Météo actuelle</p>
          <h2 id="weather-heading" className="mt-3 flex items-center gap-2 font-serif text-4xl text-primary">
            <MapPin className="h-4 w-4 text-accent" aria-hidden="true" />
            {cityName}
          </h2>
        </div>
        <CloudSun className="h-20 w-20 text-accent/40" strokeWidth={1} aria-hidden="true" />
      </div>
      <div className="flex flex-col justify-center p-7">
        <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-accent">Donnée indisponible</p>
        <p role="alert" className="mt-3 max-w-xs font-serif text-2xl leading-tight text-primary">
          La météo de {cityName} ne peut pas être chargée pour le moment.
        </p>
        <p className="mt-5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
          L’horloge continue de fonctionner normalement.
        </p>
      </div>
    </WeatherCardFrame>
  );
}

function weatherUrl(location: CityLocation) {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m',
    temperature_unit: 'celsius',
    wind_speed_unit: 'kmh',
    timezone: location.timeZone,
  });

  return `https://api.open-meteo.com/v1/forecast?${params}`;
}

export function WeatherCard({ location }: { location: CityLocation }) {
  const [state, setState] = useState<WeatherState>({ status: 'loading' });

  useEffect(() => {
    setState({ status: 'loading' });
    const controller = new AbortController();

    const loadWeather = async () => {
      try {
        const response = await fetch(weatherUrl(location), { signal: controller.signal });
        if (!response.ok) throw new Error('Weather request failed');

        const payload = (await response.json()) as OpenMeteoResponse;
        const current = payload.current;
        const temperature = current?.temperature_2m;
        const feelsLike = current?.apparent_temperature;
        const humidity = current?.relative_humidity_2m;
        const weatherCode = current?.weather_code;
        const windSpeed = current?.wind_speed_10m;
        if (
          typeof temperature !== 'number' ||
          typeof feelsLike !== 'number' ||
          typeof humidity !== 'number' ||
          typeof weatherCode !== 'number' ||
          typeof windSpeed !== 'number' ||
          !Number.isFinite(temperature) ||
          !Number.isFinite(feelsLike) ||
          !Number.isFinite(humidity) ||
          !Number.isFinite(weatherCode) ||
          !Number.isFinite(windSpeed)
        ) {
          throw new Error('Weather response is incomplete');
        }

        const summary = weatherSummary(weatherCode);
        const updatedAt = new Intl.DateTimeFormat('fr-FR', {
          timeZone: location.timeZone,
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date());

        setState({
          status: 'success',
          data: {
            locationId: location.id,
            temperature,
            feelsLike,
            humidity,
            windSpeed,
            condition: summary.condition,
            icon: summary.icon,
            updatedAt: `Actualisé à ${updatedAt}`,
          },
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        setState({ status: 'error', locationId: location.id });
      }
    };

    void loadWeather();
    return () => controller.abort();
  }, [location]);

  if (state.status === 'loading' || (state.status === 'success' && state.data.locationId !== location.id) || (state.status === 'error' && state.locationId !== location.id)) {
    return <WeatherLoading cityName={cityLabel(location)} />;
  }
  if (state.status === 'error') return <WeatherError cityName={cityLabel(location)} />;

  const WeatherIcon = state.data.icon;

  return (
    <WeatherCardFrame>
      <div className="relative flex min-h-60 flex-col justify-between overflow-hidden bg-secondary/50 p-7">
        <div className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full border border-accent/20" aria-hidden="true" />
        <div className="relative">
          <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-muted-foreground">Météo actuelle</p>
          <h2 id="weather-heading" className="mt-3 flex items-center gap-2 font-serif text-4xl leading-none text-primary">
            <MapPin className="h-4 w-4 text-accent" aria-hidden="true" />
            {cityLabel(location)}
          </h2>
        </div>
        <div className="relative flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-6xl tracking-[-0.1em] text-primary" data-testid="weather-temperature">
              {formatTemperature(state.data.temperature)}
            </p>
            <p className="mt-2 max-w-24 font-serif text-xl italic leading-tight text-accent">
              {state.data.condition}
            </p>
          </div>
          <WeatherIcon className="h-20 w-20 text-accent/80" strokeWidth={1} aria-label={state.data.condition} />
        </div>
      </div>
      <div className="p-7">
        <div className="flex items-center justify-between border-b border-border/70 pb-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-muted-foreground">Détails météo</p>
          <Wind className="h-4 w-4 text-accent" aria-hidden="true" />
        </div>
        <dl className="grid grid-cols-2 gap-5 pt-6">
          <div>
            <dt className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Ressenti</dt>
            <dd className="mt-2 text-lg font-medium text-primary">{formatTemperature(state.data.feelsLike)}</dd>
          </div>
          <div>
            <dt className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Humidité</dt>
            <dd className="mt-2 flex items-center gap-1.5 text-lg font-medium text-primary">
              <Droplets className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              {Math.round(state.data.humidity)} %
            </dd>
          </div>
          <div>
            <dt className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Vent</dt>
            <dd className="mt-2 text-lg font-medium text-primary">{Math.round(state.data.windSpeed)} km/h</dd>
          </div>
          <div>
            <dt className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Ville</dt>
            <dd className="mt-2 text-lg font-medium text-primary">{cityLabel(location)}</dd>
          </div>
        </dl>
        <p className="mt-8 border-t border-border/70 pt-4 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
          {state.data.updatedAt}
        </p>
      </div>
    </WeatherCardFrame>
  );
}