import fs from "node:fs";
import { createRequire } from "node:module";
import { createOpencode } from "@opencode-ai/sdk";

const RULES =
  "You must use `export default function` to declare the function. ONLY return code in the output. The first line, before the function declaration must act as a description of the function, in JSDoc format. Ensure that it follows strict TypeScript linting rules. You don't need to use a linter, but respect common linting rules.";

const { client, server } = await createOpencode({
  config: {
    model: "openai/gpt-5.4-fast",
  },
});

const sessionID = client.session.create().then(({ data, error }) => {
  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Failed to create OpenCode session");
  }

  return data.id;
});

export function closeMk4me() {
  server.close();
}

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
        console.warn(`GENERATING ${functionName}`);
        return sessionID
          .then((id) =>
            client.session.prompt({
              path: { id },
              body: {
                parts: [
                  {
                    type: "text",
                    text: `Create a function based on its title: ${functionName}.RULES: ${RULES}`,
                  },
                ],
              },
            }),
          )
          .then((result) => {
            if (result.error) {
              console.error(result.error);
              return args;
            }

            // read code response
            const response = result.data.parts.filter(
              (part) => part.type === "text",
            )[0];

            if (!response) {
              console.error("no response from OpenCode");
              return args;
            }
            fs.writeFileSync(`./mk4me/${functionName}.ts`, response.text);
            console.log(
              `generated function ${functionName} saved to mk4me/${functionName}.ts`,
            );
            const func = (require(`./${existingFunction}`) as FunctionModule)
              .default;
            loadedFunctions.set(existingFunction, func);

            return func(...args);
          });
      };
    }

    return Reflect.get(target, functionName, receiver);
  },
}) as _Make4Me & DynamicMethods;
