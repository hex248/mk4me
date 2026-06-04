import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RULES =
  "You must use `export default function` to declare the function. ONLY return code - do NOT wrap it in markdown code blocks or backticks of any kind. The first line before the function declaration must act as a description of the function, in JSDoc format. Ensure that it follows strict TypeScript linting rules. You don't need to use a linter, but respect common linting rules. If multiple args are provided, and it seems like it could be a non exact number of args, consider that in your implementation. If you can confidently assume that the number of args is fixed based on the combination of args and the function title, then go with that. Ensure you consider the argument types too.";

class _Make4Me {}

type DynamicMethods = {
  [K in string]: (...args: unknown[]) => unknown;
};

type FunctionModule = {
  default: (...args: unknown[]) => unknown;
};

const require = createRequire(import.meta.url);
const mk4meDirectory = fileURLToPath(new URL(".", import.meta.url));
const generatedFunctionsDirectory = path.join(
  mk4meDirectory,
  "generated_functions",
);
const validFunctionName = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;

fs.mkdirSync(generatedFunctionsDirectory, { recursive: true });

function getFunctionFile(functionName: string) {
  if (!validFunctionName.test(functionName)) {
    throw new TypeError(`Invalid function name: ${functionName}`);
  }

  const fileName = `${functionName}.ts`;
  const filePath = path.resolve(generatedFunctionsDirectory, fileName);

  if (!filePath.startsWith(generatedFunctionsDirectory)) {
    throw new TypeError(`Invalid function path: ${functionName}`);
  }

  return { fileName, filePath };
}
/** executes a prompt for the given harness and model, and returns the result as a string */
async function executePrompt(command: string): Promise<string> {
  console.log(
    `Executing prompt: ${command}\nHARNESS=${process.env.HARNESS}\nMODEL=${process.env.MODEL}`,
  );
  if (process.env.HARNESS === "opencode") {
    // opencode run --pure --model=<process.env.MODEL> "<prompt>"
    const proc = Bun.spawn(
      ["opencode", "run", "--pure", `--model=${process.env.MODEL}`, command],
      {
        stdout: "pipe",
        stderr: "pipe",
      },
    );

    const decoder = new TextDecoder();

    let output = "";
    let error = "";

    for await (const chunk of proc.stdout) {
      output += decoder.decode(chunk, { stream: true });
    }
    output += decoder.decode(); // flush remaining decoder state

    const exitCode = await proc.exited;

    error = await new Response(proc.stderr).text();

    if (exitCode !== 0) {
      throw new Error(error || `opencode exited with code ${exitCode}`);
    }

    return output;
  } else if (process.env.HARNESS === "claude") {
    // claude -p --model=claude-sonnet-4-6
    const proc = Bun.spawn(
      ["claude", "-p", `--model=${process.env.MODEL}`, command],
      {
        stdout: "pipe",
        stderr: "pipe",
      },
    );

    const decoder = new TextDecoder();

    let output = "";
    let error = "";

    for await (const chunk of proc.stdout) {
      output += decoder.decode(chunk, { stream: true });
    }
    output += decoder.decode(); // flush remaining decoder state

    const exitCode = await proc.exited;

    error = await new Response(proc.stderr).text();

    if (exitCode !== 0) {
      throw new Error(error || `claude exited with code ${exitCode}`);
    }

    return output;
  } else if (process.env.HARNESS === "codex") {
    // codex exec --ephemeral --skip-git-repo-check --model=gpt-5.4-mini "<prompt>"
    const proc = Bun.spawn(
      [
        "codex",
        "exec",
        "--ephemeral",
        "--skip-git-repo-check",
        `--model=${process.env.MODEL}`,
        command,
      ],
      {
        stdout: "pipe",
        stderr: "pipe",
      },
    );

    const decoder = new TextDecoder();

    let output = "";
    let error = "";

    for await (const chunk of proc.stdout) {
      output += decoder.decode(chunk, { stream: true });
    }
    output += decoder.decode(); // flush remaining decoder state

    const exitCode = await proc.exited;

    error = await new Response(proc.stderr).text();

    if (exitCode !== 0) {
      throw new Error(error || `codex exited with code ${exitCode}`);
    }

    return output;
  } else {
    throw new Error(`Invalid HARNESS=${process.env.HARNESS}`);
  }
}

const existingFunctions = new Set(
  fs.readdirSync(generatedFunctionsDirectory).filter((f) => f.endsWith(".ts")),
);
const loadedFunctions = new Map<string, (...args: unknown[]) => unknown>();

export const mk4me = new Proxy(new _Make4Me(), {
  get(target, functionName, receiver) {
    // if function is not in the _Make4Me class
    if (typeof functionName === "string" && !(functionName in target)) {
      // attempt to find already generated function in generated_functions directory
      const functionFile = getFunctionFile(functionName);
      if (existingFunctions.has(functionFile.fileName)) {
        return (...args: unknown[]) => {
          let func = loadedFunctions.get(functionFile.fileName);
          if (!func) {
            func = (require(functionFile.filePath) as FunctionModule).default;
            loadedFunctions.set(functionFile.fileName, func);
          }

          return func(...args);
        };
      }

      return async (...args: unknown[]) => {
        console.warn(`GENERATING ${functionName}`);
        const prompt = `Create a function based on its title: ${functionName}. Also take into account the arguments provided, for context on how it should function: ${args}. RULES: ${RULES}`;
        const result = await executePrompt(prompt);

        fs.writeFileSync(functionFile.filePath, result);
        existingFunctions.add(functionFile.fileName);
        console.log(
          `generated function ${functionName} saved to generated_functions/${functionFile.fileName}`,
        );
        const func = (require(functionFile.filePath) as FunctionModule).default;
        loadedFunctions.set(functionFile.fileName, func);

        return func(...args);
      };
    }

    return Reflect.get(target, functionName, receiver);
  },
}) as _Make4Me & DynamicMethods;
