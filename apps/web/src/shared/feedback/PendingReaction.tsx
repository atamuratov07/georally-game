import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ReactionModeParam } from '@/shared/analytics/track'
import { Button, Card } from '@/shared/ui'
import { ReactionPicker } from './GameReaction'
import { usePendingReaction } from './useFeedback'

const CLOSE_AFTER_REACTION_MS = 4_000

export function PendingReaction({ mode }: { mode: ReactionModeParam }) {
	const { request, closeReaction } = usePendingReaction()

	return (
		<AnimatePresence>
			{request?.mode === mode ? (
				<PendingReactionCard
					key={request.key}
					mode={mode}
					onClose={closeReaction}
				/>
			) : null}
		</AnimatePresence>
	)
}

function PendingReactionCard({
	mode,
	onClose,
}: {
	mode: ReactionModeParam
	onClose: () => void
}) {
	const { t } = useTranslation()
	const [reacted, setReacted] = useState(false)

	useEffect(() => {
		if (!reacted) return
		const timeout = window.setTimeout(onClose, CLOSE_AFTER_REACTION_MS)
		return () => window.clearTimeout(timeout)
	}, [reacted, onClose])

	return (
		<motion.section
			aria-label={t('reaction.prompt')}
			style={{ overflow: 'hidden' }}
			initial={{ height: 0, opacity: 0 }}
			animate={{
				height: 'auto',
				opacity: 1,
				transitionEnd: { overflow: 'visible' },
			}}
			exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
			transition={{ type: 'spring', stiffness: 300, damping: 32 }}
		>
			<div className='pb-5'>
				<Card className='relative py-4 sm:py-5'>
					<Button
						type='button'
						variant='ghost'
						size='icon-sm'
						aria-label={t('feedback.close')}
						className='absolute top-3 right-3 rounded-full text-muted hover:text-ink'
						onClick={onClose}
					>
						<X />
					</Button>
					<ReactionPicker
						mode={mode}
						entranceDelay={0.3}
						onReact={() => setReacted(true)}
						onTellMore={onClose}
					/>
				</Card>
			</div>
		</motion.section>
	)
}
