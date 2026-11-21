import { useTranslation } from 'react-i18next'
import { useGuessField } from '../../shared/useGuessField'
import type { RoutesInputState } from '../useRoutesInput'

export function useRouteField(input: RoutesInputState) {
	const { t } = useTranslation()
	return useGuessField(input, {
		placeholder: t('routes.placeholder'),
		inputLabel: t('routes.inputLabel'),
		listening: t('voice.listening'),
	})
}
