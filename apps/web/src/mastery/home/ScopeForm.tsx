import {
	GAME_CONTINENTS,
	normalizeGameRegions,
	type GameContinent,
} from '@georally/game-domain'
import { addScope } from '@georally/mastery'
import { useId, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { getRegionLabel } from '@/shared/i18n'
import { Button } from '@/shared/ui'
import { mastery } from '../container'
import { ScopePicker } from './ScopePicker'

const NONE_ADDED: ReadonlySet<GameContinent> = new Set()

interface ScopeFormProps {
	title: string
	submitLabel: string
	added?: ReadonlySet<GameContinent>
	wholeWorld?: boolean
	primary?: boolean
	onAdded: () => void | Promise<void>
	children?: ReactNode
}

export function ScopeForm({
	title,
	submitLabel,
	added = NONE_ADDED,
	wholeWorld = false,
	primary = false,
	onAdded,
	children,
}: ScopeFormProps) {
	const { t } = useTranslation()
	const titleId = useId()
	const [picked, setPicked] = useState<GameContinent[]>([])
	const [saving, setSaving] = useState(false)
	const allPicked = picked.length === GAME_CONTINENTS.length

	async function add() {
		setSaving(true)
		try {
			await addScope(mastery, {
				regions: normalizeGameRegions(picked),
				now: Date.now(),
				seed: crypto.getRandomValues(new Uint32Array(1))[0],
			})
			setPicked([])
			await onAdded()
		} finally {
			setSaving(false)
		}
	}

	return (
		<div className='flex flex-col gap-8'>
			<div className='flex flex-col items-center gap-4'>
				<h2
					id={titleId}
					className='text-center text-2xl font-black tracking-tight'
				>
					{title}
				</h2>
				<ScopePicker
					labelledBy={titleId}
					added={added}
					picked={picked}
					onChange={setPicked}
				/>
				{wholeWorld ? (
					<Button
						variant={allPicked ? 'ocean' : 'neutral'}
						size='sm'
						aria-pressed={allPicked}
						onClick={() =>
							setPicked(allPicked ? [] : [...GAME_CONTINENTS])
						}
					>
						{getRegionLabel(t, 'all')}
					</Button>
				) : null}
			</div>
			{children}
			<Button
				variant={primary ? 'primary' : 'ocean'}
				size='lg'
				className='w-full'
				disabled={picked.length === 0}
				pending={saving}
				onClick={add}
			>
				{submitLabel}
			</Button>
		</div>
	)
}
