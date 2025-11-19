// src/server.ts
import express from 'express';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import zipcodes from 'zipcodes';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Zod schema for Open-Meteo API response
// note: non-strict; unexpected fields are ignored
const OpenMeteoResponseSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  generationtime_ms: z.number(),
  utc_offset_seconds: z.number(),
  timezone: z.string(),
  timezone_abbreviation: z.string(),
  elevation: z.number(),
  current_units: z.object({
    time: z.string(),
    interval: z.string(),
    temperature_2m: z.string(),
    relative_humidity_2m: z.string(),
    weather_code: z.string(),
  }),
  current: z.object({
    time: z.string(),
    interval: z.number(),
    temperature_2m: z.number(),
    relative_humidity_2m: z.number(),
    weather_code: z.number(),
  }),
  daily_units: z.object({
    time: z.string(),
    sunset: z.string(),
    temperature_2m_max: z.string(),
    temperature_2m_min: z.string(),
  }),
  daily: z.object({
    time: z.array(z.string()),
    sunset: z.array(z.string()),
    temperature_2m_max: z.array(z.number()),
    temperature_2m_min: z.array(z.number()),
  }),
  hourly_units: z.object({
    time: z.string(),
    temperature_2m: z.string(),
  }),
  hourly: z.object({
    time: z.array(z.string()),
    temperature_2m: z.array(z.number()),
  }),
});

type OpenMeteoResponse = z.infer<typeof OpenMeteoResponseSchema>;

// Zod schema for Weather API response sent to client
const WeatherApiResponseSchema = z.object({
  temperature: z.number(),
  humidity: z.number(),
  location: z.string(),
  zipcode: z.string(),
  unit: z.string(),
  sunset: z.string(),
  isBeforeSunset: z.boolean(),
  eveningForecast: z.object({
    temperature: z.number(),
    time: z.string(),
  }).nullable(),
  dailyForecast: z.array(z.object({
    date: z.string(),
    highTemp: z.number(),
    lowTemp: z.number(),
  })),
});

export type WeatherApiResponse = z.infer<typeof WeatherApiResponseSchema>;

// Pure functions for better testability

export function isBeforeSunset(currentTime: Date, sunsetTime: Date): boolean {
  return currentTime < sunsetTime;
}

export function findEveningForecast(
  hourlyTimes: string[],
  hourlyTemps: number[],
  currentTimeStr: string
): { temperature: number; time: string } | null {
  const currentDate = new Date(currentTimeStr);
  
  // Calculate tomorrow's date by adding 1 day
  const tomorrowDate = new Date(currentDate);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  
  const eveningHourIndex = hourlyTimes.findIndex(time => {
    const forecastTime = new Date(time);
    
    // Check if it's tomorrow and at 3 AM
    return forecastTime.getFullYear() === tomorrowDate.getFullYear() &&
           forecastTime.getMonth() === tomorrowDate.getMonth() &&
           forecastTime.getDate() === tomorrowDate.getDate() &&
           forecastTime.getHours() === 3;
  });
  
  if (eveningHourIndex !== -1) {
    return {
      temperature: hourlyTemps[eveningHourIndex],
      time: hourlyTimes[eveningHourIndex],
    };
  }
  
  return null;
}

export function formatLocation(city: string, state: string): string {
  return `${city}, ${state}`;
}

// Zod schema for validating zip code
const ZipCodeSchema = z.string().regex(/^\d{5}$/, 'Zip code must be 5 digits');

// API routes
app.get('/api', (req, res) => {
  res.json({ message: 'this message comes from GET at /api' });
});

app.get('/api/weather/:zipcode', async (req, res) => {
  const zipcode = req.params.zipcode;
  
  // Validate zip code format
  const zipCodeValidation = ZipCodeSchema.safeParse(zipcode);
  if (!zipCodeValidation.success) {
    return res.status(400).json({ 
      error: 'Invalid zip code format. Must be 5 digits.',
      details: zipCodeValidation.error.issues 
    });
  }
  
  // Get coordinates for the zip code using zipcodes library
  const locationData = zipcodes.lookup(zipcode);
  
  if (!locationData) {
    return res.status(400).json({ error: 'Invalid or unsupported zip code' });
  }

  try {
    // Fetch weather data from Open-Meteo API with daily sunset and hourly forecast
    // Using forecast_days=5 to get current day + next 3 days for 3-day forecast
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${locationData.latitude}&longitude=${locationData.longitude}&current=temperature_2m,relative_humidity_2m,weather_code&hourly=temperature_2m&daily=sunset,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&timezone=auto&forecast_days=5`
    );
    
    if (!response.ok) {
      throw new Error('Open-Meteo API request failed');
    }
    
    const rawData = await response.json();
    
    // Validate the response data with Zod schema
    const data = OpenMeteoResponseSchema.parse(rawData);
    
    // Parse current time and sunset time
    const currentTime = new Date(data.current.time);
    const sunsetTime = new Date(data.daily.sunset[0]);
    
    // Determine if we should show evening forecast (before sunset)
    const shouldShowForecast = isBeforeSunset(currentTime, sunsetTime);
    
    // Find temperature for next day at 3 AM local time
    const eveningForecast = shouldShowForecast
      ? findEveningForecast(data.hourly.time, data.hourly.temperature_2m, data.current.time)
      : null;
    
    // Get next 3 days forecast (skip today, get days 1, 2, 3)
    const dailyForecast = data.daily.time.slice(1, 4).map((date, index) => ({
      date: date,
      highTemp: data.daily.temperature_2m_max[index + 1],
      lowTemp: data.daily.temperature_2m_min[index + 1],
    }));
    
    const weatherResponse = {
      temperature: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      location: formatLocation(locationData.city, locationData.state),
      zipcode: zipcode,
      unit: 'fahrenheit',
      sunset: data.daily.sunset[0],
      isBeforeSunset: shouldShowForecast,
      eveningForecast,
      dailyForecast,
    };
    
    // Validate the response before sending to client
    const validatedResponse = WeatherApiResponseSchema.parse(weatherResponse);
    
    res.json(validatedResponse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Open-Meteo API response validation failed:', error.issues);
      res.status(500).json({ error: 'Invalid weather data received from API' });
    } else {
      console.error('Error fetching weather:', error);
      res.status(500).json({ error: 'Failed to fetch weather data' });
    }
  }
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'public')));

// The "catchall" handler: for any request that doesn't
// match an API route, send back React's index.html file.
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
