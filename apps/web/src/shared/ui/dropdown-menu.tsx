import { Check } from 'lucide-react'
import { DropdownMenu as DropdownMenuPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '@/shared/utils'

function DropdownMenu(
	props: ComponentProps<typeof DropdownMenuPrimitive.Root>,
) {
	return <DropdownMenuPrimitive.Root data-slot='dropdown-menu' {...props} />
}

function DropdownMenuTrigger(
	props: ComponentProps<typeof DropdownMenuPrimitive.Trigger>,
) {
	return (
		<DropdownMenuPrimitive.Trigger
			data-slot='dropdown-menu-trigger'
			{...props}
		/>
	)
}

function DropdownMenuContent({
	className,
	sideOffset = 10,
	...props
}: ComponentProps<typeof DropdownMenuPrimitive.Content>) {
	return (
		<DropdownMenuPrimitive.Portal>
			<DropdownMenuPrimitive.Content
				data-slot='dropdown-menu-content'
				sideOffset={sideOffset}
				className={cn(
					'raised z-50 min-w-44 origin-(--radix-dropdown-menu-content-transform-origin) rounded-[18px] border-2 border-line bg-white p-1.5 text-ink [--edge-size:4px]',
					'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
					'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2',
					className,
				)}
				{...props}
			/>
		</DropdownMenuPrimitive.Portal>
	)
}

function DropdownMenuRadioGroup(
	props: ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>,
) {
	return (
		<DropdownMenuPrimitive.RadioGroup
			data-slot='dropdown-menu-radio-group'
			{...props}
		/>
	)
}

function DropdownMenuRadioItem({
	className,
	children,
	...props
}: ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
	return (
		<DropdownMenuPrimitive.RadioItem
			data-slot='dropdown-menu-radio-item'
			className={cn(
				'relative flex cursor-pointer items-center gap-3 rounded-[10px] py-2.5 pr-10 pl-3 text-base font-bold outline-none select-none',
				'focus:bg-ocean-50 data-[state=checked]:text-ocean-600 data-disabled:pointer-events-none data-disabled:opacity-50',
				className,
			)}
			{...props}
		>
			{children}
			<span className='pointer-events-none absolute right-3 flex size-4 items-center justify-center'>
				<DropdownMenuPrimitive.ItemIndicator>
					<Check className='size-4.5' strokeWidth={3} />
				</DropdownMenuPrimitive.ItemIndicator>
			</span>
		</DropdownMenuPrimitive.RadioItem>
	)
}

export {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
}
