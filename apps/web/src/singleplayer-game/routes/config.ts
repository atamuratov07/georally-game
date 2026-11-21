import {
	ROUTE_SCOPES,
	type RouteConfig,
	type RoutePracticeConfig,
	type RouteScope,
} from '@georally/game-domain/singleplayer/routes'
import type { TFunction } from 'i18next'
import { getScopeLabel } from '@/shared/i18n'
import type { RegionOption } from '@/shared/widgets/region-map/RegionPicker'
import { isDifficulty, readDifficulty } from '../shared/setupParams'

export const DEFAULT_ROUTE_CONFIG: RoutePracticeConfig = {
	kind: 'practice',
	scope: 'all',
	difficulty: 'easy',
}

const SCOPE_OF_PARAM: Record<string, RouteScope> = {
	'north-america': 'americas',
	'south-america': 'americas',
	oceania: 'all',
}

export const ROUTE_SCOPE_OPTIONS: readonly RegionOption<RouteScope>[] = [
	{ value: 'europe', continents: ['europe'] },
	{ value: 'asia', continents: ['asia'] },
	{ value: 'africa', continents: ['africa'] },
	{ value: 'americas', continents: ['north-america', 'south-america'] },
]

export function routeScopeLabel(t: TFunction, scope: RouteScope): string {
	return scope === 'americas' ? t('routes.americas') : getScopeLabel(t, scope)
}

export function isRouteScope(value: unknown): value is RouteScope {
	return ROUTE_SCOPES.includes(value as RouteScope)
}

function isPositiveInteger(value: unknown): value is number {
	return Number.isInteger(value) && (value as number) > 0
}

export function isRouteConfig(value: unknown): value is RouteConfig {
	if (typeof value !== 'object' || value === null) {
		return false
	}

	const config = value as Record<string, unknown>
	switch (config.kind) {
		case 'practice':
			return isRouteScope(config.scope) && isDifficulty(config.difficulty)
		case 'daily':
			return isPositiveInteger(config.number)
		default:
			return false
	}
}

export function toSearchParams(config: RoutePracticeConfig): URLSearchParams {
	return new URLSearchParams({
		scope: config.scope,
		difficulty: config.difficulty,
	})
}

function readRouteScope(searchParams: URLSearchParams): RouteScope {
	const value = searchParams.get('scope')
	if (value !== null && value in SCOPE_OF_PARAM) {
		return SCOPE_OF_PARAM[value]
	}
	return isRouteScope(value) ? value : DEFAULT_ROUTE_CONFIG.scope
}

export function readSetupConfig(
	searchParams: URLSearchParams,
): RoutePracticeConfig {
	return {
		kind: 'practice',
		scope: readRouteScope(searchParams),
		difficulty: readDifficulty(searchParams, DEFAULT_ROUTE_CONFIG.difficulty),
	}
}
