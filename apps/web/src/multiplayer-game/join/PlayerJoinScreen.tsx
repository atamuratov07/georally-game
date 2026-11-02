import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BackLink, PageShell } from '@/shared/layout'
import {
	Alert,
	Button,
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
	Input,
	Label,
} from '@/shared/ui'

interface PlayerJoinScreenProps {
	hostName: string
	joinable: boolean
	pending: boolean
	submitError: string | null
	resumeMessage: string | null
	onJoin: (playerName: string) => Promise<void>
}

export function PlayerJoinScreen({
	hostName,
	joinable,
	pending,
	submitError,
	resumeMessage,
	onJoin,
}: PlayerJoinScreenProps) {
	const { t } = useTranslation()
	const nameId = useId()
	const [playerName, setPlayerName] = useState('')

	return (
		<PageShell width='sm' center>
			<BackLink to='/'>{t('common.home')}</BackLink>
			<Card>
				<CardHeader className='items-center text-center'>
					<CardTitle asChild>
						<h1>{t('multiplayer.join.title')}</h1>
					</CardTitle>
					<CardDescription>
						{t('multiplayer.join.hostedBy', { name: hostName })}
					</CardDescription>
				</CardHeader>

				<form
					className='flex flex-col gap-5'
					onSubmit={event => {
						event.preventDefault()
						void onJoin(playerName)
					}}
				>
					{resumeMessage ? (
						<Alert tone='warning'>{resumeMessage}</Alert>
					) : null}
					{!joinable ? (
						<Alert tone='error'>
							{t('multiplayer.join.notJoinable')}
						</Alert>
					) : null}
					{submitError ? <Alert tone='error'>{submitError}</Alert> : null}

					<div className='flex flex-col gap-2.5'>
						<Label htmlFor={nameId}>
							{t('multiplayer.join.playerName')}
						</Label>
						<Input
							id={nameId}
							autoFocus
							value={playerName}
							onChange={event => setPlayerName(event.target.value)}
							maxLength={20}
							autoComplete='nickname'
							placeholder={t('multiplayer.join.playerNamePlaceholder')}
						/>
					</div>

					<Button
						type='submit'
						variant='grape'
						size='lg'
						className='w-full'
						pending={pending}
						disabled={!joinable || playerName.trim().length === 0}
					>
						{t('multiplayer.join.submit')}
					</Button>
				</form>
			</Card>
		</PageShell>
	)
}
