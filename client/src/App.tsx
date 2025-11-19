import './App.css';

import {
  useEffect,
  useState,
} from 'react';

import { useWeatherData } from './hooks/useWeatherData';

function App() {
  const [message, setMessage] = useState('');
  const { weather, loading, error } = useWeatherData('78130');

  useEffect(() => {
    fetch('/api')
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(err => console.error('Error fetching data:', err));
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>React + Express TypeScript</h1>
        <p>Message from server: {message || 'Loading...'}</p>
        
        <div className="weather-container">
          <h2>Weather Information</h2>
          {loading && <p>Loading weather data...</p>}
          {error && <p className="error-message">Error: {error}</p>}
          {weather && (
            <div>
              <h3>{weather.location}</h3>
              <p className="current-temperature">
                {weather.temperature}°F
              </p>
              <p>Humidity: {weather.humidity}%</p>
              
              {weather.eveningForecast && (
                <div className="evening-forecast">
                  <h4>Evening Forecast</h4>
                  <p className="evening-forecast-temp">
                    {weather.eveningForecast.temperature}°F
                  </p>
                  <p className="evening-forecast-time">
                    Around {new Date(weather.eveningForecast.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
              )}
              
              <p className="zip-code">Zip Code: {weather.zipcode}</p>
            </div>
          )}
        </div>
      </header>
    </div>
  );
}

export default App;
