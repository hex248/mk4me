import { closeMk4me, mk4me } from ".";

try {
  // executes without generating anything, as expected
  await mk4me.existing_function?.();

  // will generate a new "fibonacci_up_to" function, save it to disk (mk4me/fibonacci_up_to.ts), and execute it
  console.log(await mk4me.fibonacci_up_to?.(8));

  console.log(await mk4me.calculate_area?.(5, 10));

  // test to ensure it respects args
  console.log(await mk4me.calculate_perimeter?.(5, 10, 15, 20, 25));
} finally {
  closeMk4me();
}
