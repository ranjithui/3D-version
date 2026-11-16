import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { ShopProvider } from './context/ShopContext.jsx';
import './styles/index.css';
import { installTilt3D } from './lib/tilt3d.js';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ShopProvider>
        <App />
      </ShopProvider>
    </BrowserRouter>
  </React.StrictMode>
);

installTilt3D();

// Fade out the HTML splash (index.html) once the app has painted its first frame.
const splash = document.getElementById('splash');
if (splash) {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    splash.classList.add('is-done');
    splash.addEventListener('transitionend', () => splash.remove(), { once: true });
    setTimeout(() => splash.remove(), 1000);
  }));
}
