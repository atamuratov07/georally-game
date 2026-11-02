import { Route, Routes } from 'react-router-dom'
import { Toaster } from '@/shared/ui/sonner'
import { LocaleGate } from './LocaleGate'

export default function App() {
	return (
		<>
			<Routes>
				<Route path='*' element={<LocaleGate />} />
			</Routes>
			<Toaster />
		</>
	)
}
