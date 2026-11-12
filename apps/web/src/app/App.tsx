import { Route, Routes } from 'react-router-dom'
import { FeedbackProvider } from '@/shared/feedback'
import { Toaster } from '@/shared/ui/sonner'
import { LocaleGate } from './LocaleGate'

export default function App() {
	return (
		<FeedbackProvider>
			<Routes>
				<Route path='*' element={<LocaleGate />} />
			</Routes>
			<Toaster />
		</FeedbackProvider>
	)
}
