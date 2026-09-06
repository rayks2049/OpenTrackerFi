import React from 'react';
import '../src/lib/fonts';
import { createRoot } from 'react-dom/client';
import HomePage from '../app/page';
import '../app/globals.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HomePage />
  </React.StrictMode>,
);
