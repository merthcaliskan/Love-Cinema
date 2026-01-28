import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Hls from 'hls.js'; // Import HLS
import './index.css'
import App from './App.jsx'

window.Hls = Hls; // Make available for ReactPlayer

createRoot(document.getElementById('root')).render(
  <App />
)
