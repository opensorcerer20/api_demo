import './App.css';

import {
  useEffect,
  useState,
} from 'react';

import { WeatherWidget } from './components/WeatherWidget';

function App() {
  const [message, setMessage] = useState('');

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
        
        <WeatherWidget />
      </header>
    </div>
  );
}

export default App;
