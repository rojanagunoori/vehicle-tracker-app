import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import 'leaflet/dist/leaflet.css';

import { PlaybackProvider } from './playback/PlaybackProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PlaybackProvider>
  <App />
</PlaybackProvider>

  </StrictMode>,
)
