import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import './ui/app.css';

// No StrictMode: pack opening records pulls in an effect and StrictMode's
// double-invoke would double-count them in dev.
createRoot(document.getElementById('root')!).render(<App />);
