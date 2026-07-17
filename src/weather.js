import { useCallback, useEffect, useRef, useState } from 'react';
import { GREEN_BAY } from './data.js';

const CACHE_KEY = 'brookes-garden-weather-v4';
const CACHE_MAX_AGE = 5 * 60 * 1000;
const STALE_AFTER = 15 * 60 * 1000;

const weatherLabels = {
  0: 'Clear', 1: 'Mostly Clear', 2: 'Partly Cloudy', 3: 'Cloudy',
  45: 'Foggy', 48: 'Icy Fog', 51: 'Light Drizzle', 53: 'Drizzle', 55: 'Heavy Drizzle',
  61: 'Light Rain', 63: 'Rain', 65: 'Heavy Rain', 66: 'Freezing Rain', 67: 'Heavy Freezing Rain',
  71: 'Light Snow', 73: 'Snow', 75: 'Heavy Snow', 77: 'Snow Grains',
  80: 'Rain Showers', 81: 'Rain Showers', 82: 'Heavy Showers',
  85: 'Snow Showers', 86: 'Heavy Snow Showers',
  95: 'Thunderstorms', 96: 'Storms with Hail', 99: 'Severe Storms with Hail',
};

const rainCodes = new Set([51,53,55,61,63,65,66,67,80,81,82]);
const stormCodes = new Set([95,96,99]);

function todayIndex(payload) {
  const dates = payload.daily?.time || [];
  const currentDate = String(payload.current?.time || '').slice(0, 10);
  const index = dates.indexOf(currentDate);
  return index >= 0 ? index : 0;
}

function nearestHourlyProbability(payload) {
  const times = payload.hourly?.time || [];
  const values = payload.hourly?.precipitation_probability || [];
  const dailyIndex = todayIndex(payload);
  if (!times.length) return payload.daily?.precipitation_probability_max?.[dailyIndex] ?? 0;
  const target = new Date(payload.current?.time || Date.now()).getTime();
  let bestIndex = 0;
  let bestDistance = Infinity;
  times.forEach((time, index) => {
    const distance = Math.abs(new Date(time).getTime() - target);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });
  return values[bestIndex] ?? payload.daily?.precipitation_probability_max?.[dailyIndex] ?? 0;
}

function recentRain(payload, hours) {
  const times = payload.hourly?.time || [];
  const values = payload.hourly?.precipitation || [];
  const now = new Date(payload.current?.time || Date.now()).getTime();
  const cutoff = now - hours * 60 * 60 * 1000;
  return values.reduce((sum, value, index) => {
    const at = new Date(times[index]).getTime();
    return Number.isFinite(at) && at > cutoff && at <= now ? sum + Number(value || 0) : sum;
  }, 0);
}

function normalize(payload) {
  const code = payload.current.weather_code;
  const precipitation = Number(payload.current.precipitation || 0);
  const dailyIndex = todayIndex(payload);
  const rain6h = recentRain(payload, 6);
  const rain24h = recentRain(payload, 24);
  return {
    temperature: Math.round(payload.current.temperature_2m),
    apparent: Math.round(payload.current.apparent_temperature),
    weatherCode: code,
    condition: weatherLabels[code] || 'Current Conditions',
    isDay: Boolean(payload.current.is_day),
    wind: Math.round(payload.current.wind_speed_10m || 0),
    precipitation,
    recentRain6h: Number(rain6h.toFixed(2)),
    recentRain24h: Number(rain24h.toFixed(2)),
    isRainingNow: precipitation > 0 || rainCodes.has(code) || stormCodes.has(code),
    isStormingNow: stormCodes.has(code),
    rainChance: Math.round(nearestHourlyProbability(payload)),
    high: Math.round(payload.daily.temperature_2m_max[dailyIndex]),
    low: Math.round(payload.daily.temperature_2m_min[dailyIndex]),
    dailyRainChance: Math.round(payload.daily.precipitation_probability_max[dailyIndex] || 0),
    sunrise: payload.daily.sunrise?.[dailyIndex],
    sunset: payload.daily.sunset?.[dailyIndex],
    observedAt: payload.current.time,
    fetchedAt: new Date().toISOString(),
  };
}

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
  } catch {
    return null;
  }
}

export function useGreenBayWeather() {
  const cachedOnLoad = readCache();
  const [weather, setWeather] = useState(cachedOnLoad?.weather || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [source, setSource] = useState(cachedOnLoad?.weather ? 'cached' : '');
  const [savedAt, setSavedAt] = useState(cachedOnLoad?.savedAt || 0);
  const requestSequence = useRef(0);
  const activeController = useRef(null);
  const lastAppliedObservedAt = useRef(cachedOnLoad?.weather?.observedAt || '');

  const refresh = useCallback(async ({ force = false } = {}) => {
    const cached = readCache();
    if (!force && cached?.savedAt && Date.now() - cached.savedAt < CACHE_MAX_AGE) {
      setWeather(current => current || cached.weather);
      setSource(current => current === 'live' ? current : 'cached');
      setSavedAt(current => Math.max(current || 0, cached.savedAt || 0));
      setLoading(false);
      return;
    }

    const requestId = ++requestSequence.current;
    activeController.current?.abort();
    const controller = new AbortController();
    activeController.current = controller;
    const timer = window.setTimeout(() => controller.abort(), 10000);
    setLoading(true);
    setError('');

    const params = new URLSearchParams({
      latitude: String(GREEN_BAY.latitude),
      longitude: String(GREEN_BAY.longitude),
      current: 'temperature_2m,apparent_temperature,is_day,weather_code,precipitation,wind_speed_10m',
      hourly: 'precipitation_probability,precipitation',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset',
      temperature_unit: 'fahrenheit',
      wind_speed_unit: 'mph',
      precipitation_unit: 'inch',
      timezone: GREEN_BAY.timezone,
      past_days: '1',
      forecast_days: '3',
    });

    try {
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, {
        signal: controller.signal,
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(`Weather service returned ${response.status}`);
      const payload = await response.json();
      const normalized = normalize(payload);
      if (requestId !== requestSequence.current) return;
      const incomingObserved = normalized.observedAt || '';
      if (lastAppliedObservedAt.current && incomingObserved && incomingObserved < lastAppliedObservedAt.current) return;
      const now = Date.now();
      lastAppliedObservedAt.current = incomingObserved || lastAppliedObservedAt.current;
      setWeather(normalized);
      setSource('live');
      setSavedAt(now);
      localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: now, weather: normalized }));
    } catch (err) {
      if (requestId !== requestSequence.current || err.name === 'AbortError') return;
      if (cached?.weather) {
        setWeather(current => current || cached.weather);
        setSource(current => current === 'live' ? current : 'cached');
        setSavedAt(current => Math.max(current || 0, cached.savedAt || 0));
        setError('Live weather failed. Keeping the newest available conditions.');
      } else {
        setSource('unavailable');
        setError('Live weather is unavailable. Do not rely on automated watering advice.');
      }
    } finally {
      window.clearTimeout(timer);
      if (requestId === requestSequence.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh({ force: true });
    let lastForegroundRefresh = 0;
    const refreshForeground = () => {
      if (document.visibilityState && document.visibilityState !== 'visible') return;
      const now = Date.now();
      if (now - lastForegroundRefresh < 3000) return;
      lastForegroundRefresh = now;
      refresh({ force: true });
    };
    const onOnline = () => refresh({ force: true });
    document.addEventListener('visibilitychange', refreshForeground);
    window.addEventListener('pageshow', refreshForeground);
    window.addEventListener('online', onOnline);
    return () => {
      activeController.current?.abort();
      document.removeEventListener('visibilitychange', refreshForeground);
      window.removeEventListener('pageshow', refreshForeground);
      window.removeEventListener('online', onOnline);
    };
  }, [refresh]);

  const ageMs = savedAt ? Date.now() - savedAt : Infinity;
  const stale = source !== 'live' || ageMs > STALE_AFTER;
  return { weather, loading, error, source, stale, savedAt, refresh: () => refresh({ force: true }) };
}

export function gardenWeatherAlert(weather) {
  if (!weather) return null;
  if (weather.isStormingNow) return { type:'storm', label:'Storm happening now', title:weather.condition, detail:'Do not water or work outside during lightning. Recheck beds and containers after the storm passes.', reading:`${weather.temperature}°` };
  if (weather.isRainingNow) return { type:'rain', label:'Rain happening now', title:weather.condition, detail:'Do not water. Check drainage and recheck the soil after the rain ends.', reading:`${weather.temperature}°` };
  if ((weather.recentRain24h || 0) >= 0.25) return { type:'recent-rain', label:'Recent soaking rain', title:`${weather.recentRain24h.toFixed(2)} in. in the last 24 hours`, detail:'Skip routine outdoor watering today. Check containers separately only after testing the soil below the surface.', reading:`${weather.recentRain24h.toFixed(2)} in` };
  if ((weather.recentRain6h || 0) >= 0.1) return { type:'recent-rain', label:'Rain fell recently', title:`${weather.recentRain6h.toFixed(2)} in. in the last 6 hours`, detail:'Hold off watering outdoor beds. Check exposed containers later because they can dry faster.', reading:`${weather.recentRain6h.toFixed(2)} in` };
  if (weather.low <= 36) return { type:'frost', label:'Cold-night watch', title:`Low near ${weather.low}° tonight`, detail:'Move tender seedlings inside and protect warm-season plants before sunset.', reading:`${weather.low}°` };
  if (weather.dailyRainChance >= 70) return { type:'rain', label:'Rain likely', title:`${weather.dailyRainChance}% chance today`, detail:'Hold off on automatic outdoor watering and recheck the soil after the rain.', reading:`${weather.dailyRainChance}%` };
  if (weather.wind >= 20) return { type:'wind', label:'Windy conditions', title:`Wind around ${weather.wind} mph`, detail:'Secure lightweight pots, covers, and greenhouse vents.', reading:`${weather.wind}` };
  if (weather.high >= 88) return { type:'heat', label:'Heat watch', title:`High near ${weather.high}° today`, detail:'Check containers and seedlings early. Water only when the soil says they need it.', reading:`${weather.high}°` };
  return { type:'good', label:'Garden weather', title:`${weather.condition} in Green Bay`, detail:'No major weather warning. Use the soil check before watering anything.', reading:`${weather.temperature}°` };
}
