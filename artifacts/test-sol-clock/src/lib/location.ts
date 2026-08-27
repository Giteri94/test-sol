export type CityLocation = {
  id: number;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timeZone: string;
};

export const PARIS_LOCATION: CityLocation = {
  id: 2988507,
  name: 'Paris',
  country: 'France',
  admin1: 'Île-de-France',
  latitude: 48.8566,
  longitude: 2.3522,
  timeZone: 'Europe/Paris',
};

export function isValidTimeZone(value: unknown): value is string {
  if (typeof value !== 'string' || value.length === 0) return false;

  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

export function isCityLocation(value: unknown): value is CityLocation {
  if (!value || typeof value !== 'object') return false;

  const location = value as Partial<CityLocation>;
  return (
    typeof location.id === 'number' &&
    typeof location.name === 'string' &&
    typeof location.country === 'string' &&
    typeof location.latitude === 'number' &&
    typeof location.longitude === 'number' &&
    typeof location.timeZone === 'string' &&
    isValidTimeZone(location.timeZone) &&
    Number.isFinite(location.latitude) &&
    Number.isFinite(location.longitude)
  );
}

export function cityLabel(location: CityLocation) {
  return [location.name, location.admin1, location.country].filter(Boolean).join(' · ');
}