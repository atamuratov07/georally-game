import type {
	FeedbackCategory,
	FeedbackReaction,
} from '@georally/game-protocol'
import { CircleCheckBig, X } from 'lucide-react'
import { motion } from 'motion/react'
import { useId, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { useKeyboardInset } from '@/shared/lib/useKeyboardInset'
import { useMediaQuery } from '@/shared/lib/useMediaQuery'
import {
	Button,
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogTitle,
	Input,
	Label,
	Textarea,
} from '@/shared/ui'
import { FeedbackCategorySelect } from './FeedbackCategorySelect'
import { sendFeedback } from './feedbackApi'

export interface FeedbackDraft {
	category: FeedbackCategory
	message: string
	contact: string
}

const MESSAGE_MIN_LENGTH = 3
const MESSAGE_MAX_LENGTH = 2_000
const MESSAGE_COUNTER_FROM = 1_500
const CONTACT_MAX_LENGTH = 200

interface FeedbackDialogBodyProps {
	draft: FeedbackDraft
	onDraftChange: (draft: FeedbackDraft) => void
	reaction?: FeedbackReaction
	countryId?: string
	onSent: () => void
}

interface FeedbackDialogProps extends FeedbackDialogBodyProps {
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function FeedbackDialog({
	open,
	onOpenChange,
	...bodyProps
}: FeedbackDialogProps) {
	const { t } = useTranslation()
	const keyboardInset = useKeyboardInset()

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				aria-describedby={undefined}
				className='max-h-[calc(100%-1rem)] overflow-y-auto'
				style={
					keyboardInset > 0
						? {
								top: `calc((100% - ${keyboardInset}px) / 2)`,
								maxHeight: `calc(100% - ${keyboardInset}px - 1rem)`,
							}
						: undefined
				}
			>
				<DialogClose asChild>
					<Button
						type='button'
						variant='ghost'
						size='icon-sm'
						aria-label={t('feedback.close')}
						className='absolute top-3 right-3 rounded-full text-muted hover:text-ink sm:top-4 sm:right-4'
					>
						<X />
					</Button>
				</DialogClose>
				<FeedbackDialogBody {...bodyProps} />
			</DialogContent>
		</Dialog>
	)
}

function FeedbackDialogBody({
	draft,
	onDraftChange,
	reaction,
	countryId,
	onSent,
}: FeedbackDialogBodyProps) {
	const { t, i18n } = useTranslation()
	const location = useLocation()
	const finePointer = useMediaQuery('(pointer: fine)')
	const contactId = useId()
	const honeypotRef = useRef<HTMLInputElement>(null)
	const [pending, setPending] = useState(false)
	const [sent, setSent] = useState(false)

	if (sent) return <FeedbackSent />

	const canSend = draft.message.trim().length >= MESSAGE_MIN_LENGTH && !pending

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		if (!canSend) return

		setPending(true)
		const result = await sendFeedback({
			category: draft.category,
			message: draft.message.trim(),
			contact: draft.contact.trim() || undefined,
			reaction,
			context: {
				locale: i18n.language,
				path: location.pathname,
				countryId,
			},
			honeypot: honeypotRef.current?.value || undefined,
		})
		setPending(false)

		if (result === 'sent') {
			setSent(true)
			onSent()
			return
		}
		toast.error(
			t(
				result === 'rate_limited'
					? 'feedback.errors.rateLimited'
					: 'feedback.errors.failed',
			),
		)
	}

	return (
		<form onSubmit={handleSubmit} noValidate className='grid gap-5'>
			<DialogTitle className='px-8 text-center'>
				{t('feedback.title')}
			</DialogTitle>

			<FeedbackCategorySelect
				value={draft.category}
				onChange={category => onDraftChange({ ...draft, category })}
			/>

			<div className='grid gap-1.5'>
				<Textarea
					aria-label={t('feedback.message')}
					placeholder={t('feedback.messagePlaceholder')}
					value={draft.message}
					maxLength={MESSAGE_MAX_LENGTH}
					autoFocus={finePointer}
					onChange={event =>
						onDraftChange({ ...draft, message: event.target.value })
					}
				/>
				{draft.message.length >= MESSAGE_COUNTER_FROM ? (
					<span className='text-right text-xs font-bold text-muted tabular-nums'>
						{draft.message.length}/{MESSAGE_MAX_LENGTH}
					</span>
				) : null}
			</div>

			<div className='grid gap-2'>
				<Label htmlFor={contactId}>
					{t('feedback.contact')}
					<span className='font-semibold text-muted'>
						{t('feedback.optional')}
					</span>
				</Label>
				<Input
					id={contactId}
					value={draft.contact}
					maxLength={CONTACT_MAX_LENGTH}
					autoComplete='email'
					placeholder={t('feedback.contactPlaceholder')}
					onChange={event =>
						onDraftChange({ ...draft, contact: event.target.value })
					}
				/>
			</div>

			<input
				ref={honeypotRef}
				name='website'
				tabIndex={-1}
				autoComplete='off'
				aria-hidden='true'
				className='sr-only'
			/>

			<Button
				type='submit'
				size='lg'
				className='w-full'
				pending={pending}
				disabled={!canSend}
			>
				{t('feedback.send')}
			</Button>
		</form>
	)
}

function FeedbackSent() {
	const { t } = useTranslation()

	return (
		<div className='flex flex-col items-center gap-3 text-center'>
			<motion.span
				aria-hidden='true'
				className='text-grass-500 [&_svg]:size-16 [&_svg]:stroke-[2.25]'
				initial={{ scale: 0, rotate: -35 }}
				animate={{ scale: 1, rotate: 0 }}
				transition={{ type: 'spring', stiffness: 420, damping: 13 }}
			>
				<CircleCheckBig />
			</motion.span>
			<DialogTitle>{t('feedback.sentTitle')}</DialogTitle>
			<DialogDescription>{t('feedback.sentText')}</DialogDescription>
			<DialogClose asChild>
				<Button
					type='button'
					variant='grass'
					className='mt-3 w-full sm:w-auto sm:px-10'
					autoFocus
				>
					{t('feedback.close')}
				</Button>
			</DialogClose>
		</div>
	)
}
