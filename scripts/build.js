import fs from "node:fs";
import path from "node:path";

var DIAGRAMS_FOLDER = "src/diagrams";
var BUILD_FOLDER = "build";
var STATIC_FOLDER = "src/static";
var PAGE_TEMPLATE = "src/diagram_template.html";
// var PLANTUML_SERVER_URL = "http://www.plantuml.com/plantuml";
var PLANTUML_SERVER_URL = "http://localhost:8090";

function fillTemplate(template, data) {
  let res = template;
  for (const valueName in data) {
    res = res.replace(
      new RegExp(/\{\{\s*/.source + valueName + /\s*\}\}/.source),
      data[valueName],
    );
  }

  return res;
}

function assemblyPageFilePath(parentDirs) {
  const name = "index.html";
  const outputPath = path.join(BUILD_FOLDER, ...parentDirs, name);
  return outputPath;
}

async function convertUML(code) {
  try {
    const encodedCode = Buffer.from(code, "utf-8")
      .toString("hex")
      .toUpperCase();
    const url = `${PLANTUML_SERVER_URL}/svg/~h${encodedCode}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch SVG: ${response.statusText}`);
    }

    const svgData = await response.text();
    return svgData;
  } catch (error) {
    console.error(`Error converting UML:`, error);
  }
}

async function createPage(diagram, outputFile) {
  if (!createPage.template) {
    createPage.template = await fs.promises.readFile(PAGE_TEMPLATE, "utf-8");
  }
  const pageContent = fillTemplate(createPage.template, { diagram });
  const outputFolder = path.dirname(outputFile);
  await fs.promises.mkdir(outputFolder, { recursive: true });
  await fs.promises.writeFile(outputFile, pageContent);
}

async function convertModule(dir, parentDirs = []) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await convertModule(fullPath, [...parentDirs, entry.name]);
    } else if (entry.isFile() && entry.name === "main.puml") {
      const content = await fs.promises.readFile(fullPath, "utf-8");
      const pageFile = assemblyPageFilePath(parentDirs);
      const diagram = await convertUML(content);
      await createPage(diagram, pageFile);
      console.log(`Converted: ${pageFile}`);
    }
  }
}

async function copyRecursive(src, dest) {
  await fs.promises.mkdir(dest, { recursive: true });
  const entries = await fs.promises.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyRecursive(srcPath, destPath);
    } else {
      await fs.promises.copyFile(srcPath, destPath);
    }
  }
}

async function main() {
  await fs.promises.mkdir(BUILD_FOLDER, { recursive: true });
  await copyRecursive(STATIC_FOLDER, BUILD_FOLDER);
  await convertModule(DIAGRAMS_FOLDER);
}

main().catch(console.error);
