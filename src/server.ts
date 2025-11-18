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
  }),
  daily: z.object({
    time: z.array(z.string()),
    sunset: z.array(z.string()),
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

// API routes
app.get('/api', (req, res) => {
  res.json({ message: 'this message comes from GET at /api' });
});

app.get('/api/weather/:zipcode', async (req, res) => {
  const zipcode = req.params.zipcode;
  
  // Get coordinates for the zip code using zipcodes library
  const locationData = zipcodes.lookup(zipcode);
  
  if (!locationData) {
    return res.status(400).json({ error: 'Invalid or unsupported zip code' });
  }

  try {
    // Fetch weather data from Open-Meteo API with daily sunset and hourly forecast
    // Using 2 days to fetch 3am forecast if current zip code time is before sunset
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${locationData.latitude}&longitude=${locationData.longitude}&current=temperature_2m,relative_humidity_2m,weather_code&hourly=temperature_2m&daily=sunset&temperature_unit=fahrenheit&timezone=auto&forecast_days=2`
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
    const isBeforeSunset = currentTime < sunsetTime;
    
    // Find temperature for next day at 3 AM local time
    let eveningForecast = null;
    if (isBeforeSunset) {
      // Look for 3:00 AM tomorrow in hourly data
      const eveningHourIndex = data.hourly.time.findIndex(time => {
        const forecastTime = new Date(time);
        const currentDate = new Date(data.current.time);
        
        // Check if it's tomorrow and at 3 AM
        return forecastTime.getDate() === currentDate.getDate() + 1 && 
               forecastTime.getHours() === 3;
      });
      
      if (eveningHourIndex !== -1) {
        eveningForecast = {
          temperature: data.hourly.temperature_2m[eveningHourIndex],
          time: data.hourly.time[eveningHourIndex],
        };
      }
    }
    
    res.json({
      temperature: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      location: `${locationData.city}, ${locationData.state}`,
      zipcode: zipcode,
      unit: 'fahrenheit',
      sunset: data.daily.sunset[0],
      isBeforeSunset,
      eveningForecast,
    });
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
