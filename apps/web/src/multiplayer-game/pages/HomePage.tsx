import { useCallback, useState } from 'react'
import { ButtonLink, ScreenShell } from '../../shared/ui'
import { formatGatewayErrorMessage } from '../api/errors'
import { CreateRoomForm } from '../create/CreateRoomForm'
import { JoinRoomForm } from '../join/JoinRoomForm'
import { saveRoomSession } from '../session/sessionStorage'
import type { RoomSession } from '../session/types'
import type { CreateRoomRequest } from '@georally/game-protocol'
import { LanguageSwitcher } from '../../shared/i18n'
import { useTranslation } from 'react-i18next'
import { useLocalizedNavigate } from '../../app/useLocalizedNavigate'
import { trackRoomCreated } from '../../shared/analytics/track'
import { createRoom } from '../api/roomsApi'

export default function HomePage(): JSX.Element {
	const { t } = useTranslation()
	const navigate = useLocalizedNavigate()
	const [createError, setCreateError] = useState<string | null>(null)
	const [isCreating, setIsCreating] = useState(false)

	const handleCreateRoom = useCallback(
		async (values: CreateRoomRequest) => {
			setIsCreating(true)
			setCreateError(null)

			try {
				const response = await createRoom({
					hostName: values.hostName,
					roomMode: values.roomMode,
				})

				const storedSession: RoomSession = {
					...response,
					savedAt: Date.now(),
				}

				saveRoomSession(storedSession)
				trackRoomCreated(values.roomMode)
				navigate(`/multiplayer/host/${response.roomCode}`)
			} catch (error) {
				setCreateError(formatGatewayErrorMessage(error))
			} finally {
				setIsCreating(false)
			}
		},
		[navigate],
	)

	return (
		<ScreenShell className='px-5 py-8 sm:px-8'>
			<div className='mx-auto max-w-6xl'>
				<div className='mb-6 flex flex-wrap items-center justify-between gap-3'>
					<ButtonLink to='/' variant='nav' size='pill'>
						<span aria-hidden='true'>&larr;</span>
						{t('multiplayer.toModes')}
					</ButtonLink>

					<LanguageSwitcher className='py-2.5 shadow-none text-slate-700 bg-white/85 border-slate-300' />
				</div>

				<div className='grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] [&>*:first-child]:order-1 [&>*:last-child]:order-2 lg:[&>*:first-child]:order-2 lg:[&>*:last-child]:order-1'>
					<JoinRoomForm className='lg:order-1' />
					<CreateRoomForm
						onSubmit={handleCreateRoom}
						pending={isCreating}
						submitError={createError}
						className='lg:order-2'
					/>
				</div>
			</div>
		</ScreenShell>
	)
}
