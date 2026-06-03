import { closeMk4me, mk4me } from "./mk4me";

mk4me.existing_function?.();

try {
	const fib = await mk4me.fibonacci_up_to?.(10);

	console.log(fib);
} finally {
	closeMk4me();
}
