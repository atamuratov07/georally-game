import type { MasteryDeps } from '@georally/mastery'
import { fsrsScheduler } from '@georally/mastery/fsrs'
import { createIdbRepository } from '@georally/mastery/idb'

export const mastery: MasteryDeps = {
	repository: createIdbRepository(),
	scheduler: fsrsScheduler,
}
