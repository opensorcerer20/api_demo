import './App.css';

import {
  useEffect,
  useState,
} from 'react';

import {
  useWeatherData,
  ZipCodeSchema,
} from './hooks/useWeatherData';

function App() {
  const [message, setMessage] = useState('');
  const [currentZipCode, setCurrentZipCode] = useState('78130');
  const [inputZipCode, setInputZipCode] = useState('78130');
  const { weather, loading, error } = useWeatherData(currentZipCode);

  useEffect(() => {
    fetch('/api')
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(err => console.error('Error fetching data:', err));
  }, []);

  const isZipCodeValid = ZipCodeSchema.safeParse(inputZipCode).success;
  const isButtonDisabled = !isZipCodeValid || inputZipCode === currentZipCode;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isButtonDisabled) {
      setCurrentZipCode(inputZipCode);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>React + Express TypeScript</h1>
        <p>Message from server: {message || 'Loading...'}</p>
        
        <div className="weather-container">
          <h2>Weather Information</h2>
          
          <form onSubmit={handleSubmit} className="zip-code-form">
            <input
              type="text"
              value={inputZipCode}
              onChange={(e) => setInputZipCode(e.target.value)}
              placeholder="Enter 5-digit zip code"
              maxLength={5}
              className="zip-code-input"
            />
            <button 
              type="submit" 
              disabled={isButtonDisabled}
              className="zip-code-button"
            >
              Get Weather
            </button>
          </form>
          
          {loading && !error && <div className="spinner"></div>}
          {error && <p className="error-message">Error: {error}</p>}
          {!loading && !error && weather && (
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
