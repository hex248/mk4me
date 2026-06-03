import { closeMk4me, mk4me } from "./mk4me";

try {
  // executes without generating anything, as expected
  await mk4me.existing_function?.();

  // will generate a new "fibonacci_up_to" function, save it to disk (mk4me/fibonacci_up_to.ts), and execute it
  const fib = await mk4me.fibonacci_up_to?.(8);
  console.log(fib);
} finally {
  closeMk4me();
}
