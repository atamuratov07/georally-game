import { Navigate, type NavigateProps } from 'react-router-dom'
import {
	prefixWithLocale,
	toLocaleSegment,
} from '../shared/i18n/locale-segment'
import { useCurrentLocale } from './LocaleContext'

export function LocalizedNavigate({ to, ...rest }: NavigateProps) {
	const segment = toLocaleSegment(useCurrentLocale())
	return <Navigate to={prefixWithLocale(to, segment)} {...rest} />
}
