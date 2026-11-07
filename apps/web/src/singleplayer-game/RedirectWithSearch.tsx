import { useLocation } from 'react-router-dom'
import { LocalizedNavigate } from '@/app/LocalizedNavigate'

export function RedirectWithSearch({ to }: { to: string }) {
	const { search } = useLocation()
	return <LocalizedNavigate to={{ pathname: to, search }} replace />
}
