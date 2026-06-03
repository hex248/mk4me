import fs from "node:fs";
import { createRequire } from "node:module";

class _Make4Me {}

type DynamicMethods = {
	[K in string]: (...args: unknown[]) => unknown;
};

type FunctionModule = {
	default: (...args: unknown[]) => unknown;
};

const require = createRequire(import.meta.url);
const existingFunctions = new Set(
	fs
		.readdirSync("./mk4me/")
		.filter((f) => f !== "index.ts" && f.endsWith(".ts")),
);
const loadedFunctions = new Map<string, (...args: unknown[]) => unknown>();

export const mk4me = new Proxy(new _Make4Me(), {
	get(target, functionName, receiver) {
		// if function is not in the _Make4Me class
		if (typeof functionName === "string" && !(functionName in target)) {
			// attempt to find already generated function in mk4me directory
			const existingFunction = `${functionName}.ts`;
			if (existingFunctions.has(existingFunction)) {
				return (...args: unknown[]) => {
					let func = loadedFunctions.get(existingFunction);
					if (!func) {
						func = (require(`./${existingFunction}`) as FunctionModule).default;
						loadedFunctions.set(existingFunction, func);
					}

					return func(...args);
				};
			}

			return (...args: unknown[]) => {
				console.warn(
					`NEED TO CREATE METHOD: ${functionName} called with args: ${args}`,
				);
				// pass to opencode to create function

				// run newly created function
				return args;
			};
		}

		return Reflect.get(target, functionName, receiver);
	},
}) as _Make4Me & DynamicMethods;
