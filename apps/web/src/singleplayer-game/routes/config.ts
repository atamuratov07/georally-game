import { normalizeGameRegions, normalizeRegions } from '@georally/game-domain'
import {
	ROUTE_REGION_CONTINENTS,
	ROUTE_REGIONS,
	type RouteConfig,
	type RoutePracticeConfig,
	type RouteRegion,
} from '@georally/game-domain/singleplayer/routes'
import type { TFunction } from 'i18next'
import { getRegionLabel, joinRegionLabels } from '@/shared/i18n'
import type { RegionOption } from '@/shared/widgets/region-map/RegionPicker'
import {
	isDifficulty,
	readDifficulty,
	readRegionNames,
	setRegions,
} from '../shared/setupParams'

export const DEFAULT_ROUTE_CONFIG: RoutePracticeConfig = {
	kind: 'practice',
	regions: [],
	difficulty: 'easy',
}

const REGION_OF_NAME: Readonly<Record<string, RouteRegion>> = {
	europe: 'europe',
	asia: 'asia',
	africa: 'africa',
	americas: 'americas',
	'north-america': 'americas',
	'south-america': 'americas',
}

export const ROUTE_REGION_OPTIONS: readonly RegionOption<RouteRegion>[] = [
	{ value: 'europe', continents: ['europe'] },
	{ value: 'asia', continents: ['asia'] },
	{ value: 'africa', continents: ['africa'] },
	{ value: 'americas', continents: ['north-america', 'south-america'] },
]

export function routeRegionLabel(t: TFunction, region: RouteRegion): string {
	return region === 'americas'
		? t('routes.americas')
		: getRegionLabel(t, region)
}

export function routeRegionsLabel(
	t: TFunction,
	regions: readonly RouteRegion[],
): string {
	return regions.length === 0
		? getRegionLabel(t, 'all')
		: joinRegionLabels(regions.map(region => routeRegionLabel(t, region)))
}

function isRouteRegions(value: unknown): value is readonly RouteRegion[] {
	return (
		Array.isArray(value) &&
		value.every(region => ROUTE_REGIONS.includes(region as RouteRegion)) &&
		normalizeRegions(value as RouteRegion[], ROUTE_REGIONS).join() ===
			value.join()
	)
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
			return (
				isRouteRegions(config.regions) && isDifficulty(config.difficulty)
			)
		case 'daily':
			return isPositiveInteger(config.number)
		default:
			return false
	}
}

export function toSearchParams(config: RoutePracticeConfig): URLSearchParams {
	return setRegions(
		new URLSearchParams({ difficulty: config.difficulty }),
		config.regions,
	)
}

export function readSetupConfig(
	searchParams: URLSearchParams,
): RoutePracticeConfig {
	return {
		kind: 'practice',
		regions: normalizeRegions(
			readRegionNames(searchParams).flatMap(name =>
				name in REGION_OF_NAME ? [REGION_OF_NAME[name]] : [],
			),
			ROUTE_REGIONS,
		),
		difficulty: readDifficulty(searchParams, DEFAULT_ROUTE_CONFIG.difficulty),
	}
}

export function routeContinents(regions: readonly RouteRegion[]) {
	return normalizeGameRegions(
		regions.flatMap(region => ROUTE_REGION_CONTINENTS[region]),
	)
}
