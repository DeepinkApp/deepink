import { Mutex, MutexInterface } from 'async-mutex';

export class MutexMap<K = string> {
	private readonly mutexMap = new Map<
		K,
		{
			mutex: Mutex;
			users: number;
		}
	>();

	private getMutexById(id: K) {
		const state = this.mutexMap.get(id);
		if (state) return state;

		const newState = {
			mutex: new Mutex(),
			users: 0,
		};
		this.mutexMap.set(id, newState);

		return newState;
	}

	public runExclusive<T>(id: K, callback: MutexInterface.Worker<T>): Promise<T> {
		const state = this.getMutexById(id);

		state.users++;
		return state.mutex.runExclusive(callback).finally(() => {
			state.users--;
			if (
				state.users > 0 ||
				state.mutex.isLocked() ||
				this.mutexMap.get(id) !== state
			)
				return;

			this.mutexMap.delete(id);
		});
	}
}
