import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import '@fortawesome/fontawesome-free/css/all.min.css';
import 'mdb-react-ui-kit/dist/css/mdb.min.css';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
