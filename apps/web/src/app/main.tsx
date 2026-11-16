import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '../shared/i18n/setup'
import { I18nDocumentSync } from '../shared/i18n'
import { setDisplayModeProperty } from '../shared/analytics/track'
import {
	isStandalone,
	registerServiceWorker,
	watchInstallPrompt,
} from '../shared/pwa'
import App from './App.tsx'
import '@fontsource-variable/rubik'
import './globals.css'
import { StrictMode, Suspense } from 'react'

registerServiceWorker()
watchInstallPrompt()
setDisplayModeProperty(isStandalone())

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<I18nDocumentSync>
			<BrowserRouter>
				<Suspense>
					<App />
				</Suspense>
			</BrowserRouter>
		</I18nDocumentSync>
	</StrictMode>,
)
