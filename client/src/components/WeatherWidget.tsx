import { useState } from 'react';

import {
  useWeatherData,
  ZipCodeSchema,
} from '../hooks/useWeatherData';

export function WeatherWidget() {
  const [currentZipCode, setCurrentZipCode] = useState('78130');
  const [inputZipCode, setInputZipCode] = useState('78130');
  const { weather, loading, error } = useWeatherData(currentZipCode);

  const isZipCodeValid = ZipCodeSchema.safeParse(inputZipCode).success;
  const isButtonDisabled = !isZipCodeValid || inputZipCode === currentZipCode;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isButtonDisabled) {
      setCurrentZipCode(inputZipCode);
    }
  };

  return (
    <div className="weather-container">
      <h2>Weather</h2>
      
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
          
          {weather.dailyForecast && weather.dailyForecast.length > 0 && (
            <>
            <h4 style={{padding: "10px 0px"}}>Daily Forecast</h4>
            <div className="daily-forecast">
              {weather.dailyForecast.map((day) => (
                <div key={day.date} className="forecast-day">
                  <p className="forecast-date">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                  <p className="forecast-high">H: {day.highTemp}°</p>
                  <p className="forecast-low">L: {day.lowTemp}°</p>
                </div>
              ))}
            </div>
            </>
          )}
          
          <p className="zip-code">Zip Code: {weather.zipcode}</p>
        </div>
      )}
    </div>
  );
}
