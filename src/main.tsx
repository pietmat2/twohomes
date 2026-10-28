import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import '@fontsource-variable/figtree/index.css'
import './index.css'
import App from './App'
import { SecurityProvider } from './lib/SecurityProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SecurityProvider>
      <HashRouter>
        <App />
      </HashRouter>
    </SecurityProvider>
  </StrictMode>,
)
