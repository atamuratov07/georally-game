import { useTranslation } from 'react-i18next'
import { FaqList } from '@/shared/widgets/faq/FaqList'

const QUESTIONS = [
	'different',
	'progress',
	'countries',
	'app',
	'feedback',
] as const

export function HomeFaq() {
	const { t } = useTranslation()

	const entries = QUESTIONS.map(id => ({
		id,
		question: t(`landing.faq.${id}.q`),
		answer: t(`landing.faq.${id}.a`, { feedback: t('feedback.open') }),
	}))

	return (
		<section
			aria-labelledby='faq-title'
			className='mx-auto flex w-full max-w-3xl flex-col gap-6 text-on-sky'
		>
			<h2
				id='faq-title'
				className='text-center text-3xl font-black tracking-tight sm:text-4xl'
			>
				{t('landing.faq.title')}
			</h2>
			<FaqList entries={entries} />
		</section>
	)
}
