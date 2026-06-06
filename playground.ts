import { mk4me } from ".";
import { log } from "./log";

try {
  // executes without generating anything, as expected
  await mk4me.existing_function?.();

  // will generate a new "fibonacci_up_to" function, save it to disk (mk4me/fibonacci_up_to.ts), and execute it
  const fib = await mk4me.fibonacci_up_to?.(8);
  log.info(fib);

  const area = await mk4me.calculate_area?.(5, 10);
  log.info(area);

  const perimeter = await mk4me.calculate_perimeter?.(5, 10, 15, 20, 25);
  log.info(perimeter);

  // the below function will return the sum of all the arguments
  const testResult = await mk4me.test_function?.(5, 5, 5); // should return an array with 1 element, being the result
  log.info(testResult);
} catch (err) {
  log.error(err);
}
