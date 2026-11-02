import { Route, Routes } from 'react-router-dom'
import { LocaleGate } from './LocaleGate'

export default function App() {
	return (
		<Routes>
			<Route path='*' element={<LocaleGate />} />
		</Routes>
	)
}
