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

/** Checks if a file path should be ignored */
function isIgnored(filePath: string) {
  let ignoredPaths = [
    "node_modules",
    "generated_functions",
    "dist",
    "build",
    ".git",
  ];
  if (fs.existsSync(".gitignore")) {
    const gitignore = fs.readFileSync(".gitignore", "utf-8");
    ignoredPaths = gitignore
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"));
  }
  // properly check ignored paths against filePath just as git does
  return ignoredPaths.some((ignoredPath) => {
    if (ignoredPath.endsWith("/")) ignoredPath = ignoredPath.slice(0, -1);
    if (ignoredPath.startsWith("/")) ignoredPath = ignoredPath.slice(1);
    if (filePath.includes(`/${ignoredPath}/`)) return true;
    if (filePath.endsWith(`/${ignoredPath}`)) return true;
    return false;
  });
}

/** Recursively gets all .ts files in a directory */
function getTsFiles(dir: string) {
  const results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = `${dir}/${file}`;
    const stat = fs.statSync(filePath);
    if (stat?.isDirectory()) {
      if (!isIgnored(filePath)) results.push(...getTsFiles(filePath));
    } else if (file.endsWith(".ts")) {
      if (!isIgnored(filePath)) results.push(filePath);
    }
  });
  return results;
}

for (const path of process.argv.slice(2)) {
  if ([".", "./"].includes(path) || fs.statSync(path)?.isDirectory()) {
    // loop through all children, find .ts files and add their paths
    paths.push(...getTsFiles(path));
  } else if (fs.existsSync(path)) paths.push(path);
  else {
    throw new Error(`File does not exist: ${path}`);
  }
}

type FunctionRequest = {
  originFile: string;
  originLine: number;
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
      if (functionsRequested.some((f) => f.functionName === functionName))
        return; // if we've already requested this function, skip it
      const functionFile = getFunctionFile(functionName);

      const snippet = getSnippetFromNode(sourceFile, expression, 2);

      const request = {
        originFile: sourceFile.fileName,
        originLine: sourceFile.getLineAndCharacterOfPosition(
          expression.getStart(sourceFile),
        ).line,
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
      console.log(
        `\u001b[1m\u001b[4m${request.originFile}:\u001b[24m\u001b[22m`,
      );
    }
    console.log(
      `${request.originFile}:${request.originLine} - ${request.functionName}`,
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
