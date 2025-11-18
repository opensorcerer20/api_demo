import './App.css';

import {
  useEffect,
  useState,
} from 'react';

interface WeatherData {
  temperature: number;
  humidity: number;
  location: string;
  zipcode: string;
  unit: string;
}

function App() {
  const [message, setMessage] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api')
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(err => console.error('Error fetching data:', err));

    // Fetch weather for zip code 78130
    fetch('/api/weather/78130')
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
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>React + Express TypeScript</h1>
        <p>Message from server: {message || 'Loading...'}</p>
        
        <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', minWidth: '300px' }}>
          <h2>Weather Information</h2>
          {loading && <p>Loading weather data...</p>}
          {error && <p style={{ color: '#ff6b6b' }}>Error: {error}</p>}
          {weather && (
            <div>
              <h3>{weather.location}</h3>
              <p style={{ fontSize: '3rem', margin: '1rem 0', fontWeight: 'bold' }}>
                {weather.temperature}°F
              </p>
              <p>Humidity: {weather.humidity}%</p>
              <p style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '1rem' }}>Zip Code: {weather.zipcode}</p>
            </div>
          )}
        </div>
      </header>
    </div>
  );
}

export default App;
