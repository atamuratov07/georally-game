import { useCallback } from 'react'
import {
	createSearchParams,
	useLocation,
	useSearchParams,
	type NavigateOptions,
	type URLSearchParamsInit,
} from 'react-router-dom'
import { useLocalizedNavigate } from './useLocalizedNavigate'

export function useLocalizedSearchParams() {
	const [searchParams] = useSearchParams()
	const { pathname } = useLocation()
	const navigate = useLocalizedNavigate()

	const setSearchParams = useCallback(
		(next: URLSearchParamsInit, options?: NavigateOptions) => {
			navigate({ pathname, search: `?${createSearchParams(next)}` }, options)
		},
		[navigate, pathname],
	)

	return [searchParams, setSearchParams] as const
}
