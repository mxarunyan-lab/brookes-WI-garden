import { useCallback, useEffect, useRef, useState } from 'react';
import { GREEN_BAY } from './data.js';

const CACHE_KEY = 'brookes-garden-weather-v5';
const RAIN_HOLD_KEY = 'brookes-garden-rain-hold-v1';
const CACHE_MAX_AGE = 5 * 60 * 1000;
const STALE_AFTER = 20 * 60 * 1000;
const NWS_STATION = 'KGRB';

const weatherLabels = {
  0: 'Clear', 1: 'Mostly Clear', 2: 'Partly Cloudy', 3: 'Cloudy',
  45: 'Foggy', 48: 'Icy Fog', 51: 'Light Drizzle', 53: 'Drizzle', 55: 'Heavy Drizzle',
  61: 'Light Rain', 63: 'Rain', 65: 'Heavy Rain', 66: 'Freezing Rain', 67: 'Heavy Freezing Rain',
  71: 'Light Snow', 73: 'Snow', 75: 'Heavy Snow', 77: 'Snow Grains',
  80: 'Rain Showers', 81: 'Rain Showers', 82: 'Heavy Showers',
  85: 'Snow Showers', 86: 'Heavy Snow Showers', 95: 'Thunderstorms', 96: 'Storms with Hail', 99: 'Severe Storms with Hail',
};

const toFahrenheit = value => Number.isFinite(value) ? Math.round((value * 9) / 5 + 32) : null;
const metersToInches = value => Number.isFinite(value) ? value * 39.3700787 : 0;
const dateInGreenBay = value => new Intl.DateTimeFormat('en-CA', {
  timeZone: GREEN_BAY.timezone,
  year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date(value));

const codeFromText = text => {
  const value = String(text || '').toLowerCase();
  if (value.includes('thunder')) return 95;
  if (value.includes('heavy rain')) return 65;
  if (value.includes('rain') || value.includes('shower')) return 63;
  if (value.includes('drizzle')) return 53;
  if (value.includes('snow')) return 73;
  if (value.includes('fog')) return 45;
  if (value.includes('overcast') || value.includes('cloudy')) return 3;
  if (value.includes('partly')) return 2;
  if (value.includes('clear') || value.includes('sunny')) return 0;
  return 2;
};

const parseWind = value => {
  const match = String(value || '').match(/\d+/);
  return match ? Number(match[0]) : 0;
};

function readJson(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); }
  catch { return null; }
}

function activeRainHold() {
  const hold = readJson(RAIN_HOLD_KEY);
  if (!hold?.holdUntil || hold.holdUntil <= Date.now()) {
    localStorage.removeItem(RAIN_HOLD_KEY);
    return null;
  }
  return hold;
}

function writeRainHold(amount, source = 'weather', detectedAt = Date.now()) {
  const inches = Number(amount || 0);
  if (!(inches >= 0.1)) return activeRainHold();
  const existing = activeRainHold();
  const next = {
    amount: Math.max(Number(existing?.amount || 0), inches),
    source,
    detectedAt,
    holdUntil: Math.max(Number(existing?.holdUntil || 0), detectedAt + 24 * 60 * 60 * 1000),
  };
  localStorage.setItem(RAIN_HOLD_KEY, JSON.stringify(next));
  return next;
}

async function fetchJson(url, signal) {
  const response = await fetch(url, {
    signal,
    cache: 'no-store',
    headers: { Accept: 'application/geo+json, application/json' },
  });
  if (!response.ok) throw new Error(`Weather service returned ${response.status}`);
  return response.json();
}

function summarizeObservedRain(features = [], hours = 24) {
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  const hourlyMaximums = new Map();
  features.forEach(feature => {
    const properties = feature?.properties || {};
    const at = new Date(properties.timestamp || 0).getTime();
    if (!Number.isFinite(at) || at < cutoff || at > Date.now() + 5 * 60 * 1000) return;
    const inches = metersToInches(Number(properties.precipitationLastHour?.value));
    if (!(inches > 0)) return;
    const bucket = Math.floor(at / 3600000);
    hourlyMaximums.set(bucket, Math.max(hourlyMaximums.get(bucket) || 0, inches));
  });
  return [...hourlyMaximums.values()].reduce((sum, value) => sum + value, 0);
}

function normalizeNws({ forecast, latest, history, alerts }) {
  const observation = latest?.properties || {};
  const periods = forecast?.properties?.periods || [];
  const today = dateInGreenBay(Date.now());
  const todayDay = periods.find(period => period.isDaytime && dateInGreenBay(period.startTime) === today)
    || periods.find(period => period.isDaytime)
    || periods[0];
  const tonight = periods.find(period => !period.isDaytime && new Date(period.startTime) >= new Date(todayDay?.startTime || Date.now()))
    || periods.find(period => !period.isDaytime);
  const condition = observation.textDescription || todayDay?.shortForecast || 'Current conditions';
  const code = codeFromText(condition);
  const temperature = toFahrenheit(Number(observation.temperature?.value));
  const observedRain24h = summarizeObservedRain(history?.features, 24);
  const observedRain6h = summarizeObservedRain(history?.features, 6);
  const currentRain = metersToInches(Number(observation.precipitationLastHour?.value));
  const activeAlerts = (alerts?.features || []).map(item => ({
    event: item?.properties?.event,
    severity: item?.properties?.severity,
    headline: item?.properties?.headline,
  })).filter(item => item.event);
  const storming = /thunder|tornado|severe storm/i.test(condition) || activeAlerts.some(item => /thunderstorm|tornado/i.test(item.event));
  const raining = storming || currentRain > 0 || /rain|drizzle|shower/i.test(condition);
  const rainHold = writeRainHold(Math.max(observedRain24h, currentRain), 'NWS/KGRB');
  return {
    temperature: temperature ?? Number(todayDay?.temperature ?? 0),
    apparent: temperature ?? Number(todayDay?.temperature ?? 0),
    weatherCode: code,
    condition,
    isDay: observation.timestamp ? new Date(observation.timestamp).getHours() >= 6 && new Date(observation.timestamp).getHours() < 20 : true,
    wind: Math.round(Number(observation.windSpeed?.value || 0) * 2.23694) || parseWind(todayDay?.windSpeed),
    precipitation: Number(currentRain.toFixed(2)),
    recentRain6h: Number(observedRain6h.toFixed(2)),
    recentRain24h: Number(observedRain24h.toFixed(2)),
    rainHoldAmount: Number(rainHold?.amount || 0),
    rainHoldSource: rainHold?.source || '',
    isRainingNow: raining,
    isStormingNow: storming,
    rainChance: Number(String(todayDay?.detailedForecast || '').match(/(\d+)%/)?.[1] || 0),
    high: Number(todayDay?.temperature ?? temperature ?? 0),
    low: Number(tonight?.temperature ?? temperature ?? 0),
    dailyRainChance: Number(String(todayDay?.detailedForecast || '').match(/(\d+)%/)?.[1] || 0),
    observedAt: observation.timestamp || new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
    provider: 'National Weather Service',
    station: NWS_STATION,
    activeAlerts,
  };
}

async function fetchNwsWeather(signal) {
  const pointUrl = `https://api.weather.gov/points/${GREEN_BAY.latitude},${GREEN_BAY.longitude}`;
  const point = await fetchJson(pointUrl, signal);
  const forecastUrl = point?.properties?.forecast;
  if (!forecastUrl) throw new Error('NWS forecast grid unavailable');
  const start = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [forecast, latest, history, alerts] = await Promise.all([
    fetchJson(forecastUrl, signal),
    fetchJson(`https://api.weather.gov/stations/${NWS_STATION}/observations/latest`, signal),
    fetchJson(`https://api.weather.gov/stations/${NWS_STATION}/observations?start=${encodeURIComponent(start)}&limit=80`, signal),
    fetchJson(`https://api.weather.gov/alerts/active?point=${GREEN_BAY.latitude},${GREEN_BAY.longitude}`, signal),
  ]);
  return normalizeNws({ forecast, latest, history, alerts });
}

function todayIndex(payload) {
  const dates = payload.daily?.time || [];
  const currentDate = String(payload.current?.time || '').slice(0, 10);
  const index = dates.indexOf(currentDate);
  return index >= 0 ? index : 0;
}

function recentModelRain(payload, hours) {
  const times = payload.hourly?.time || [];
  const values = payload.hourly?.precipitation || [];
  const now = new Date(payload.current?.time || Date.now()).getTime();
  const cutoff = now - hours * 60 * 60 * 1000;
  return values.reduce((sum, value, index) => {
    const at = new Date(times[index]).getTime();
    return Number.isFinite(at) && at > cutoff && at <= now ? sum + Number(value || 0) : sum;
  }, 0);
}

async function fetchOpenMeteoFallback(signal) {
  const params = new URLSearchParams({
    latitude: String(GREEN_BAY.latitude), longitude: String(GREEN_BAY.longitude),
    current: 'temperature_2m,apparent_temperature,is_day,weather_code,precipitation,wind_speed_10m',
    hourly: 'precipitation_probability,precipitation',
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    temperature_unit: 'fahrenheit', wind_speed_unit: 'mph', precipitation_unit: 'inch',
    timezone: GREEN_BAY.timezone, past_days: '1', forecast_days: '3',
  });
  const payload = await fetchJson(`https://api.open-meteo.com/v1/forecast?${params}`, signal);
  const dailyIndex = todayIndex(payload);
  const code = payload.current.weather_code;
  const rain24h = recentModelRain(payload, 24);
  const rain6h = recentModelRain(payload, 6);
  const rainHold = writeRainHold(rain24h, 'Open-Meteo fallback');
  return {
    temperature: Math.round(payload.current.temperature_2m), apparent: Math.round(payload.current.apparent_temperature),
    weatherCode: code, condition: weatherLabels[code] || 'Current conditions', isDay: Boolean(payload.current.is_day),
    wind: Math.round(payload.current.wind_speed_10m || 0), precipitation: Number(payload.current.precipitation || 0),
    recentRain6h: Number(rain6h.toFixed(2)), recentRain24h: Number(rain24h.toFixed(2)),
    rainHoldAmount: Number(rainHold?.amount || 0), rainHoldSource: rainHold?.source || '',
    isRainingNow: Number(payload.current.precipitation || 0) > 0 || [51,53,55,61,63,65,80,81,82,95,96,99].includes(code),
    isStormingNow: [95,96,99].includes(code),
    rainChance: Math.round(payload.hourly?.precipitation_probability?.[0] || 0),
    high: Math.round(payload.daily.temperature_2m_max[dailyIndex]), low: Math.round(payload.daily.temperature_2m_min[dailyIndex]),
    dailyRainChance: Math.round(payload.daily.precipitation_probability_max[dailyIndex] || 0),
    observedAt: payload.current.time, fetchedAt: new Date().toISOString(), provider: 'Open-Meteo fallback', station: '', activeAlerts: [],
  };
}

export function useGreenBayWeather() {
  const cachedOnLoad = readJson(CACHE_KEY);
  const [weather, setWeather] = useState(cachedOnLoad?.weather || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [source, setSource] = useState(cachedOnLoad?.weather ? 'cached' : '');
  const [savedAt, setSavedAt] = useState(cachedOnLoad?.savedAt || 0);
  const requestSequence = useRef(0);
  const activeController = useRef(null);

  const applyWeather = useCallback((next, nextSource, requestId) => {
    if (requestId !== requestSequence.current) return;
    const hold = activeRainHold();
    const merged = { ...next, rainHoldAmount: Math.max(Number(next.rainHoldAmount || 0), Number(hold?.amount || 0)), rainHoldSource: hold?.source || next.rainHoldSource || '' };
    const now = Date.now();
    setWeather(merged); setSource(nextSource); setSavedAt(now); setError('');
    localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: now, weather: merged }));
  }, []);

  const refresh = useCallback(async ({ force = false } = {}) => {
    const cached = readJson(CACHE_KEY);
    if (!force && cached?.savedAt && Date.now() - cached.savedAt < CACHE_MAX_AGE) {
      setWeather(cached.weather); setSource('cached'); setSavedAt(cached.savedAt); setLoading(false); return;
    }
    const requestId = ++requestSequence.current;
    activeController.current?.abort();
    const controller = new AbortController(); activeController.current = controller;
    const timer = window.setTimeout(() => controller.abort(), 12000);
    setLoading(true); setError('');
    try {
      const nws = await fetchNwsWeather(controller.signal);
      applyWeather(nws, 'live', requestId);
    } catch (nwsError) {
      if (requestId !== requestSequence.current || controller.signal.aborted) return;
      try {
        const fallback = await fetchOpenMeteoFallback(controller.signal);
        applyWeather(fallback, 'fallback', requestId);
        setError('Official NWS weather was unavailable. Showing a clearly labeled fallback.');
      } catch {
        if (cached?.weather) {
          const hold = activeRainHold();
          setWeather({ ...cached.weather, rainHoldAmount: Math.max(Number(cached.weather.rainHoldAmount || 0), Number(hold?.amount || 0)) });
          setSource('cached'); setSavedAt(cached.savedAt || 0);
          setError('Live weather is unavailable. Saved weather must not drive watering decisions.');
        } else {
          setSource('unavailable'); setError('Weather is unavailable. Do not rely on automated watering advice.');
        }
      }
    } finally {
      window.clearTimeout(timer);
      if (requestId === requestSequence.current) setLoading(false);
    }
  }, [applyWeather]);

  const recordRain = useCallback(amount => {
    const inches = Number(amount);
    if (!Number.isFinite(inches) || inches <= 0) return false;
    const hold = writeRainHold(inches, 'Home rain gauge');
    setWeather(current => current ? { ...current, rainHoldAmount: hold.amount, rainHoldSource: hold.source, recentRain24h: Math.max(Number(current.recentRain24h || 0), inches) } : current);
    return true;
  }, []);

  useEffect(() => {
    refresh({ force: true });
    let lastForegroundRefresh = 0;
    const foreground = () => {
      if (document.visibilityState && document.visibilityState !== 'visible') return;
      const now = Date.now(); if (now - lastForegroundRefresh < 5000) return;
      lastForegroundRefresh = now; refresh({ force: true });
    };
    const online = () => refresh({ force: true });
    document.addEventListener('visibilitychange', foreground);
    window.addEventListener('pageshow', foreground);
    window.addEventListener('online', online);
    return () => {
      activeController.current?.abort();
      document.removeEventListener('visibilitychange', foreground);
      window.removeEventListener('pageshow', foreground);
      window.removeEventListener('online', online);
    };
  }, [refresh]);

  const stale = source === 'cached' || source === 'unavailable' || (savedAt ? Date.now() - savedAt > STALE_AFTER : true);
  return { weather, loading, error, source, stale, savedAt, refresh: () => refresh({ force: true }), recordRain };
}

export function gardenWeatherAlert(weather) {
  if (!weather) return null;
  if (weather.isStormingNow) return { type:'storm', label:'Storm happening now', title:weather.condition, detail:'Do not water or work outside during lightning. Recheck the garden after the storm passes.', reading:`${weather.temperature}°` };
  if (weather.isRainingNow) return { type:'rain', label:'Rain happening now', title:weather.condition, detail:'Do not water. Let the rain finish and leave outdoor beds alone today.', reading:`${weather.temperature}°` };
  if ((weather.rainHoldAmount || 0) >= 0.25) return { type:'recent-rain', label:'Outdoor watering paused', title:`${weather.rainHoldAmount.toFixed(2)} in. recorded`, detail:`Skip routine outdoor watering and soil-check tasks today. Source: ${weather.rainHoldSource || 'recent rainfall'}. Check only covered or unusually fast-drying containers.`, reading:`${weather.rainHoldAmount.toFixed(2)} in` };
  if ((weather.rainHoldAmount || 0) >= 0.1) return { type:'recent-rain', label:'Rain fell recently', title:`${weather.rainHoldAmount.toFixed(2)} in. recorded`, detail:'Hold off on outdoor watering. Check exposed containers later only when needed.', reading:`${weather.rainHoldAmount.toFixed(2)} in` };
  if (weather.activeAlerts?.length) return { type:'alert', label:'Official weather alert', title:weather.activeAlerts[0].event, detail:weather.activeAlerts[0].headline || 'Open a trusted local weather source for details.', reading:'NWS' };
  if (weather.low <= 36) return { type:'frost', label:'Cold-night watch', title:`Low near ${weather.low}° tonight`, detail:'Move tender seedlings inside and protect warm-season plants before sunset.', reading:`${weather.low}°` };
  if (weather.dailyRainChance >= 70) return { type:'rain', label:'Rain likely', title:`${weather.dailyRainChance}% chance today`, detail:'Hold off on automatic outdoor watering and reassess after the forecast rain.', reading:`${weather.dailyRainChance}%` };
  if (weather.wind >= 20) return { type:'wind', label:'Windy conditions', title:`Wind around ${weather.wind} mph`, detail:'Secure lightweight pots, covers, and greenhouse vents.', reading:`${weather.wind}` };
  if (weather.high >= 88) return { type:'heat', label:'Heat watch', title:`High near ${weather.high}° today`, detail:'Check uncovered containers and seedlings early. Water only when their actual root zone is drying.', reading:`${weather.high}°` };
  return { type:'good', label:'Garden weather', title:`${weather.condition} in 54302`, detail:'No major weather warning. Use plant-specific care and recorded rainfall before watering.', reading:`${weather.temperature}°` };
}
