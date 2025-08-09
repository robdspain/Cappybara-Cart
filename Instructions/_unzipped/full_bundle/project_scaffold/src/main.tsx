import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './ui/App'
import { bootstrapRenderer } from './engine/bootstrap'

// Mount Babylon canvas outside React
bootstrapRenderer()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
