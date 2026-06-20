import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

// Mount the React application at the root element.
createRoot(document.getElementById('root')).render(<App />);