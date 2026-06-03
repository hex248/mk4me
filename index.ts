import { closeMk4me, mk4me } from "./mk4me";

try {
  await mk4me.existing_function?.();

  const fib = await mk4me.fibonacci_up_to?.(8);

  console.log(fib);
} finally {
  closeMk4me();
}
