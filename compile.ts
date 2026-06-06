#!/usr/bin/env bun

import fs from "node:fs";
import ts from "typescript";

const configPath = ts.findConfigFile(".", ts.sys.fileExists, "tsconfig.json");
if (!configPath) throw new Error("no tsconfig.json found");
const config = ts.readConfigFile(configPath, ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, ".");

const program = ts.createProgram(parsed.fileNames, parsed.options);

import { createFunction, existingFunctions, getFunctionFile } from ".";
import { log } from "./log";

if (process.argv.slice(2).length === 0) {
  log.error(
    `INVALID USAGE OF COMPILATION MODULE.\n\nYou must provide paths to files or directories to compile.\nExample:\n    bun compile.ts playground.ts utility.ts`,
  );
  process.exit(0);
}

const paths: string[] = [];

for (const path of process.argv.slice(2)) {
  if ([".", "./"].includes(path) || fs.statSync(path)?.isDirectory()) {
    // loop through all children, find .ts files and add their paths
  } else if (fs.existsSync(path)) paths.push(path);
  else {
    throw new Error(`File does not exist: ${path}`);
  }
}

type FunctionRequest = {
  originFile: string;
  args: unknown[];
  functionName: string;
  functionFile: {
    fileName: string;
    filePath: string;
  };
  snippet: string;
};
let functionsRequested: FunctionRequest[] = [];

function getSnippetFromNode(
  sourceFile: ts.SourceFile,
  node: ts.Node,
  radius = 2,
) {
  const fullText = sourceFile.getFullText();
  const lines = fullText.split(/\r?\n/);

  const pos = sourceFile.getLineAndCharacterOfPosition(
    node.getStart(sourceFile),
  );
  const line = pos.line;

  const startLine = Math.max(0, line - radius);
  const endLine = Math.min(lines.length, line + radius + 1);

  return lines.slice(startLine, endLine).join("\n");
}

function validate(sourceFile: ts.SourceFile, node: ts.Node) {
  if (ts.isImportDeclaration(node)) {
    const bindings = node.importClause?.namedBindings;

    if (bindings && ts.isNamedImports(bindings)) {
      const hasMk4Me = bindings.elements.some(
        (element) => element.name.text === "mk4me",
      );
      if (hasMk4Me) return true;
    }
  }

  return (
    ts.forEachChild(node, (child) => {
      if (validate(sourceFile, child)) return true;
      return undefined;
    }) === true
  );
}

function visit(sourceFile: ts.SourceFile, node: ts.Node) {
  // if this is a call expression
  if (ts.isCallExpression(node)) {
    const expression = node.expression;

    // if this is a property access expression, and the object is "mk4me", then we want to create a function request
    if (
      ts.isPropertyAccessExpression(expression) &&
      ts.isIdentifier(expression.expression) &&
      expression.expression.text === "mk4me"
    ) {
      const functionName = expression.name.text;
      const functionFile = getFunctionFile(functionName);

      const snippet = getSnippetFromNode(sourceFile, expression, 2);

      const request = {
        originFile: sourceFile.fileName,
        functionName,
        args: node.arguments.map((arg) => arg.getText(sourceFile)),
        functionFile,
        snippet,
      };

      functionsRequested.push(request);
    }
  }

  ts.forEachChild(node, (child) => visit(sourceFile, child));
}

for (const path of paths) {
  const sourceFile = program.getSourceFile(path);
  if (!sourceFile) throw new Error(`Couldn't get SourceFile from ${path}`);

  if (!validate(sourceFile, sourceFile)) continue;

  visit(sourceFile, sourceFile);
}

functionsRequested = functionsRequested.filter(
  (f) => !existingFunctions.has(f.functionFile.fileName),
);

const processed: Set<string> = new Set<string>();
console.log(`Generating ${functionsRequested.length} functions in parallel:\n`);

const functionGenerationPromises = [];

for (const request of functionsRequested) {
  // generate function if it hasn't already been generated
  if (!existingFunctions.has(request.functionFile.fileName)) {
    if (!processed.has(request.originFile)) {
      processed.add(request.originFile);
      console.log(`${request.originFile}:`);
    }
    console.log(
      ` - generating ${request.functionName} (${request.originFile})`,
    );
    functionGenerationPromises.push(
      createFunction(
        request.args,
        request.functionName,
        request.functionFile,
        request.snippet,
      ),
    );
  }
}

await Promise.allSettled(functionGenerationPromises);
console.log(`\nSuccessfully generated ${functionsRequested.length} functions`);
