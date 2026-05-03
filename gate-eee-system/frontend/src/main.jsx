import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: {
          background: '#fff',
          color: '#1a1a2e',
          border: '1px solid #c5d8ee',
          borderRadius: '12px',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '14px',
          boxShadow: '0 4px 20px rgba(10,61,98,0.12)',
        },
        success: { iconTheme: { primary: '#0A3D62', secondary: '#fff' } },
        error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
      }}
    />
  </React.StrictMode>,
)
