export const trys = <T>(func: () => T): [null, T] | [Error, null] => {
	try {
		return [null, func()] as const;
	} catch (err) {
		return [err as Error, null] as const;
	}
};
