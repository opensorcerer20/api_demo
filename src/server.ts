// src/server.ts
import express from 'express';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import zipcodes from 'zipcodes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

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
    // Fetch weather data from Open-Meteo API
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${locationData.latitude}&longitude=${locationData.longitude}&current=temperature_2m,relative_humidity_2m,weather_code&temperature_unit=fahrenheit&timezone=auto`
    );
    
    if (!response.ok) {
      throw new Error('Open-Meteo API request failed');
    }
    
    const data = await response.json();
    
    res.json({
      temperature: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      location: `${locationData.city}, ${locationData.state}`,
      zipcode: zipcode,
      unit: 'fahrenheit'
    });
  } catch (error) {
    console.error('Error fetching weather:', error);
    res.status(500).json({ error: 'Failed to fetch weather data' });
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
