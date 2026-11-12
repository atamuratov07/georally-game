import {
	FEEDBACK_CATEGORIES,
	type FeedbackCategory,
} from '@georally/game-protocol'
import {
	Bug,
	ChevronDown,
	Lightbulb,
	MapPinned,
	MessageCircleMore,
	type LucideIcon,
} from 'lucide-react'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
	Label,
} from '@/shared/ui'
import { cn } from '@/shared/utils'

const CATEGORY_ICONS: Record<
	FeedbackCategory,
	{ icon: LucideIcon; color: string }
> = {
	bug: { icon: Bug, color: 'text-coral-500' },
	idea: { icon: Lightbulb, color: 'text-sunflower-600' },
	map_data: { icon: MapPinned, color: 'text-grass-600' },
	other: { icon: MessageCircleMore, color: 'text-ocean-500' },
}

function CategoryIcon({ category }: { category: FeedbackCategory }) {
	const { icon: Icon, color } = CATEGORY_ICONS[category]
	return (
		<Icon
			aria-hidden='true'
			className={cn('size-5 shrink-0', color)}
			strokeWidth={2.5}
		/>
	)
}

interface FeedbackCategorySelectProps {
	value: FeedbackCategory
	onChange: (value: FeedbackCategory) => void
}

export function FeedbackCategorySelect({
	value,
	onChange,
}: FeedbackCategorySelectProps) {
	const { t } = useTranslation()
	const labelId = useId()
	const triggerId = useId()

	return (
		<div className='grid gap-2'>
			<Label id={labelId} htmlFor={triggerId}>
				{t('feedback.category')}
			</Label>
			<DropdownMenu>
				<DropdownMenuTrigger
					id={triggerId}
					aria-labelledby={`${labelId} ${triggerId}`}
					className={cn(
						'group flex h-12 w-full items-center gap-2.5 rounded-control border-2 border-line-strong bg-white px-4 text-left text-base font-bold text-ink',
						'shadow-[inset_0_3px_0_0_var(--color-paper-deep)] outline-none transition-[border-color,box-shadow]',
						'focus-visible:border-ocean-500 focus-visible:ring-4 focus-visible:ring-ocean-200 focus-visible:outline-none data-[state=open]:border-ocean-500',
					)}
				>
					<CategoryIcon category={value} />
					<span className='flex-1 truncate'>
						{t(`feedback.categories.${value}`)}
					</span>
					<ChevronDown
						aria-hidden='true'
						className='size-4 shrink-0 text-muted transition-transform group-data-[state=open]:rotate-180'
						strokeWidth={3}
					/>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					align='start'
					sideOffset={8}
					className='w-(--radix-dropdown-menu-trigger-width)'
				>
					<DropdownMenuRadioGroup
						value={value}
						onValueChange={next => {
							const category = FEEDBACK_CATEGORIES.find(
								item => item === next,
							)
							if (category) onChange(category)
						}}
					>
						{FEEDBACK_CATEGORIES.map(category => (
							<DropdownMenuRadioItem key={category} value={category}>
								<CategoryIcon category={category} />
								{t(`feedback.categories.${category}`)}
							</DropdownMenuRadioItem>
						))}
					</DropdownMenuRadioGroup>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	)
}
