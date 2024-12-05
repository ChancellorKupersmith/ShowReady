import React from 'react'
import ReactDOM from 'react-dom/client'
import App, { ViewContextProvider } from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
  <ViewContextProvider>
    <App />
  </ViewContextProvider>
  </React.StrictMode>,
)
