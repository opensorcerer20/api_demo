import {
  useEffect,
  useState,
} from 'react';

import { z } from 'zod';

// Zod schema for validating zip code
const ZipCodeSchema = z.string().regex(/^\d{5}$/, 'Zip code must be 5 digits');

export interface WeatherData {
  temperature: number;
  humidity: number;
  location: string;
  zipcode: string;
  unit: string;
  sunset: string;
  isBeforeSunset: boolean;
  eveningForecast: {
    temperature: number;
    time: string;
  } | null;
}

export function useWeatherData(zipcode: string) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Validate zip code format before making API call
    const validation = ZipCodeSchema.safeParse(zipcode);
    if (!validation.success) {
      setError('Invalid zip code format. Must be 5 digits.');
      setLoading(false);
      return;
    }

    fetch(`/api/weather/${zipcode}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setWeather(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching weather:', err);
        setError('Failed to fetch weather data');
        setLoading(false);
      });
  }, [zipcode]);

  return { weather, loading, error };
}
