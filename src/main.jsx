import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { CaseProvider } from './context/CaseContext'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CaseProvider>
      <App />
    </CaseProvider>
  </StrictMode>,
)
