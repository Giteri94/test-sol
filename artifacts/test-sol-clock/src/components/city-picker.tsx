import { useEffect, useId, useRef, useState } from 'react';
import { LoaderCircle, MapPin, Search } from 'lucide-react';
import { cityLabel, isCityLocation, type CityLocation } from '@/lib/location';

type GeocodingResponse = {
  results?: Array<{
    id?: number;
    name?: string;
    country?: string;
    admin1?: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;
  }>;
};

type CityPickerProps = {
  location: CityLocation;
  onSelect: (location: CityLocation) => void;
};

function toCityLocation(result: NonNullable<GeocodingResponse['results']>[number]): CityLocation | null {
  if (
    typeof result.id !== 'number' ||
    typeof result.name !== 'string' ||
    typeof result.country !== 'string' ||
    typeof result.latitude !== 'number' ||
    typeof result.longitude !== 'number' ||
    typeof result.timezone !== 'string'
  ) {
    return null;
  }

  const city = {
    id: result.id,
    name: result.name,
    country: result.country,
    admin1: result.admin1,
    latitude: result.latitude,
    longitude: result.longitude,
    timeZone: result.timezone,
  };

  return isCityLocation(city) ? city : null;
}

export function CityPicker({ location, onSelect }: CityPickerProps) {
  const inputId = useId();
  const listboxId = `${inputId}-options`;
  const suppressSearchRef = useRef(false);
  const [query, setQuery] = useState(location.name);
  const [suggestions, setSuggestions] = useState<CityLocation[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);

  useEffect(() => {
    if (suppressSearchRef.current) {
      suppressSearchRef.current = false;
      setSuggestions([]);
      return;
    }

    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      setSearchMessage(null);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsSearching(true);
      setSearchMessage(null);
      try {
        const params = new URLSearchParams({
          name: trimmedQuery,
          count: '5',
          language: 'fr',
          format: 'json',
        });
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('City search failed');

        const payload = (await response.json()) as GeocodingResponse;
        const nextSuggestions = (payload.results ?? [])
          .map(toCityLocation)
          .filter((city): city is CityLocation => city !== null);
        setSuggestions(nextSuggestions);
        setSearchMessage(nextSuggestions.length === 0 ? 'Aucune ville trouvée. Essayez un autre nom.' : null);
        setActiveIndex(-1);
      } catch (error) {
        if (!controller.signal.aborted) {
          setSuggestions([]);
          setSearchMessage('Recherche indisponible. Vérifiez le nom de la ville.');
        }
      } finally {
        if (!controller.signal.aborted) setIsSearching(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query]);

  const selectCity = (city: CityLocation) => {
    suppressSearchRef.current = true;
    setQuery(city.name);
    setSuggestions([]);
    setActiveIndex(-1);
    setIsOpen(false);
    onSelect(city);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      selectCity(suggestions[activeIndex]);
    } else if (event.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const shouldShowSuggestions = isOpen && (isSearching || suggestions.length > 0 || searchMessage !== null);

  return (
    <section className="mt-8 w-full max-w-4xl rounded-2xl border border-border/80 bg-card/60 p-4 shadow-sm backdrop-blur-sm sm:p-5" aria-labelledby={`${inputId}-label`}>
      <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.24em] text-muted-foreground">
        <MapPin className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
        <span id={`${inputId}-label`}>Ville affichée</span>
      </div>
      <div className="relative mt-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent" aria-hidden="true" />
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(suggestions.length > 0)}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-autocomplete="list"
          aria-controls={suggestions.length > 0 ? listboxId : undefined}
          aria-expanded={isOpen}
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-${suggestions[activeIndex].id}` : undefined}
          placeholder="Rechercher une ville"
          className="h-12 w-full rounded-xl border border-border bg-background/80 pl-10 pr-10 text-sm text-primary outline-none transition placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        {isSearching && (
          <LoaderCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-accent" aria-label="Recherche en cours" />
        )}
        {shouldShowSuggestions && (
          <div className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-xl border border-border bg-card p-1 shadow-xl">
            {isSearching && (
              <p role="status" className="px-3 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                Recherche en cours…
              </p>
            )}
            {!isSearching && searchMessage && (
              <p role="alert" className="px-3 py-3 text-sm text-muted-foreground">
                {searchMessage}
              </p>
            )}
            {!isSearching && suggestions.length > 0 && (
              <ul id={listboxId} role="listbox">
                {suggestions.map((city, index) => (
                  <li
                    key={`${city.id}-${city.timeZone}`}
                    id={`${listboxId}-${city.id}`}
                    role="option"
                    aria-selected={index === activeIndex}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      selectCity(city);
                    }}
                    className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-3 text-sm transition ${
                      index === activeIndex ? 'bg-secondary text-primary' : 'text-muted-foreground hover:bg-secondary/70 hover:text-primary'
                    }`}
                  >
                    <span className="truncate">{cityLabel(city)}</span>
                    <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">{city.timeZone}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
        L’heure et la météo suivent la ville sélectionnée · actuellement {cityLabel(location)}
      </p>
    </section>
  );
}