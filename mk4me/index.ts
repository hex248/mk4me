/*
 * mkit4me.fibonacci_up_to(100); // use function on mkit4me
 *
 * if fibonacci_up_to doesn't exist, it invokes opencode to generate the function on the fly, places it in a mkit4me/fibonacci_up_to.ts file, with a nice description explaining its ai generated nature
 *
 * if it does exist, it is then invoked as usual
 * */

class _Make4Me {}

type DynamicMethods = {
	[K in string]: (...args: unknown[]) => unknown;
};

export const mk4me = new Proxy(new _Make4Me(), {
	get(target, prop, receiver) {
		if (typeof prop === "string" && !(prop in target)) {
			return (...args: unknown[]) => {
				console.warn(`missing method: ${prop} called with args: ${args}`);
				return args;
			};
		}

		return Reflect.get(target, prop, receiver);
	},
}) as _Make4Me & DynamicMethods;
