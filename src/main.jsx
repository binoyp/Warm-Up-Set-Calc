import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .then((registration) => {
        window.__swRegistration = registration

        const notifyUpdateAvailable = () => {
          window.dispatchEvent(new CustomEvent('sw-update-available'))
        }

        if (registration.waiting) {
          notifyUpdateAvailable()
        }

        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing
          if (!installingWorker) return

          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              notifyUpdateAvailable()
            }
          })
        })

        let isRefreshing = false
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (isRefreshing) return
          isRefreshing = true
          window.location.reload()
        })
      })
      .catch(() => {
        // Ignore SW registration errors so the app still runs normally.
      })
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
