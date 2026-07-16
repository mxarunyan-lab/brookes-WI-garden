import { useCallback, useEffect, useState } from 'react';
import { GREEN_BAY } from './data.js';

const CACHE_KEY = 'brookes-garden-weather-v2';
const CACHE_MAX_AGE = 90 * 60 * 1000;

const weatherLabels = {
  0: 'Clear', 1: 'Mostly Clear', 2: 'Partly Cloudy', 3: 'Cloudy',
  45: 'Foggy', 48: 'Icy Fog', 51: 'Light Drizzle', 53: 'Drizzle', 55: 'Heavy Drizzle',
  61: 'Light Rain', 63: 'Rain', 65: 'Heavy Rain', 66: 'Freezing Rain', 67: 'Heavy Freezing Rain',
  71: 'Light Snow', 73: 'Snow', 75: 'Heavy Snow', 77: 'Snow Grains',
  80: 'Rain Showers', 81: 'Rain Showers', 82: 'Heavy Showers',
  85: 'Snow Showers', 86: 'Heavy Snow Showers',
  95: 'Thunderstorms', 96: 'Storms with Hail', 99: 'Severe Storms with Hail',
};

function nearestHourlyProbability(payload) {
  const times = payload.hourly?.time || [];
  const values = payload.hourly?.precipitation_probability || [];
  if (!times.length) return payload.daily?.precipitation_probability_max?.[0] ?? 0;
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
  return values[bestIndex] ?? payload.daily?.precipitation_probability_max?.[0] ?? 0;
}

function normalize(payload) {
  return {
    temperature: Math.round(payload.current.temperature_2m),
    apparent: Math.round(payload.current.apparent_temperature),
    weatherCode: payload.current.weather_code,
    condition: weatherLabels[payload.current.weather_code] || 'Current Conditions',
    isDay: Boolean(payload.current.is_day),
    wind: Math.round(payload.current.wind_speed_10m || 0),
    precipitation: payload.current.precipitation || 0,
    rainChance: Math.round(nearestHourlyProbability(payload)),
    high: Math.round(payload.daily.temperature_2m_max[0]),
    low: Math.round(payload.daily.temperature_2m_min[0]),
    dailyRainChance: Math.round(payload.daily.precipitation_probability_max[0] || 0),
    sunrise: payload.daily.sunrise?.[0],
    sunset: payload.daily.sunset?.[0],
    updatedAt: payload.current.time,
    fetchedAt: new Date().toISOString(),
  };
}

export function useGreenBayWeather() {
  const [weather, setWeather] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      return cached?.weather || null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(!weather);
  const [error, setError] = useState('');
  const [source, setSource] = useState(weather ? 'cached' : '');

  const refresh = useCallback(async ({ force = false } = {}) => {
    let cached = null;
    try {
      cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    } catch {
      cached = null;
    }

    if (!force && cached?.savedAt && Date.now() - cached.savedAt < CACHE_MAX_AGE) {
      setWeather(cached.weather);
      setSource('cached');
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 10000);
    setLoading(true);
    setError('');

    const params = new URLSearchParams({
      latitude: String(GREEN_BAY.latitude),
      longitude: String(GREEN_BAY.longitude),
      current: 'temperature_2m,apparent_temperature,is_day,weather_code,precipitation,wind_speed_10m',
      hourly: 'precipitation_probability',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset',
      temperature_unit: 'fahrenheit',
      wind_speed_unit: 'mph',
      precipitation_unit: 'inch',
      timezone: GREEN_BAY.timezone,
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
      setWeather(normalized);
      setSource('live');
      localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), weather: normalized }));
    } catch (err) {
      if (cached?.weather) {
        setWeather(cached.weather);
        setSource('cached');
        setError('Live weather is temporarily unavailable. Showing the most recent saved conditions.');
      } else {
        setError(err.name === 'AbortError' ? 'Weather took too long to load.' : 'Weather is temporarily unavailable.');
      }
    } finally {
      window.clearTimeout(timer);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { weather, loading, error, source, refresh: () => refresh({ force: true }) };
}

export function gardenWeatherAlert(weather) {
  if (!weather) return null;
  if (weather.low <= 36) {
    return {
      type: 'frost',
      label: 'Cold-night watch',
      title: `Low near ${weather.low}° tonight`,
      detail: 'Move tender seedlings inside and protect warm-season plants before sunset.',
      reading: `${weather.low}°`,
    };
  }
  if (weather.high >= 88) {
    return {
      type: 'heat',
      label: 'Heat watch',
      title: `High near ${weather.high}° today`,
      detail: 'Check containers and seedlings early. Water only when the soil says they need it.',
      reading: `${weather.high}°`,
    };
  }
  if (weather.dailyRainChance >= 70) {
    return {
      type: 'rain',
      label: 'Rain likely',
      title: `${weather.dailyRainChance}% chance today`,
      detail: 'Hold off on automatic outdoor watering and recheck the soil after the rain.',
      reading: `${weather.dailyRainChance}%`,
    };
  }
  if (weather.wind >= 20) {
    return {
      type: 'wind',
      label: 'Windy conditions',
      title: `Wind around ${weather.wind} mph`,
      detail: 'Secure lightweight pots, covers, and greenhouse vents.',
      reading: `${weather.wind}`,
    };
  }
  return {
    type: 'good',
    label: 'Garden weather',
    title: `${weather.condition} in Green Bay`,
    detail: 'No major weather warning. Use the soil check before watering anything.',
    reading: `${weather.temperature}°`,
  };
}
