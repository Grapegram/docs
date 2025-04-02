import fs from "node:fs";
import path from "node:path";

var DIAGRAMS_FOLDER = "src/diagram";
var BUILD_FOLDER = "build";
var STATIC_FOLDER = "assets";
var PAGE_TEMPLATE = "templates/diagram_template.html";

var PLANTUML_SERVER_URL = "http://localhost:8090";
if (process.env.ISDOCKER) {
  var PLANTUML_SERVER_URL = "http://plantuml-server:8080";
}

var ROOT_PATH = "";
if (process.env.PROD) {
  ROOT_PATH = "/docs";
}

function fillTemplate(template, data) {
  let res = template;
  for (const valueName in data) {
    res = res.replaceAll(
      new RegExp(/\{\{\s*/.source + valueName + /\s*\}\}/.source, "g"),
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

function preprocessUML(code, relativePath) {
  return code
    .replaceAll(/\$link="\/([^"]*)"/g, `$link="${ROOT_PATH}/$1"`)
    .replaceAll(/\$link="~\/([^"]*)"/g, `$link="${ROOT_PATH}/${relativePath}$1"`);
}

async function convertUML(code, relativePath) {
  code = preprocessUML(code, relativePath);
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

function preprocessTemplate(code) {
  return code;
}

async function createPage(diagram, title, outputFile) {
  if (!createPage.template) {
    const template = await fs.promises.readFile(PAGE_TEMPLATE, "utf-8");
    createPage.template = preprocessTemplate(template);
  }
  const pageContent = fillTemplate(createPage.template, {
    diagram,
    title,
    rootPath: ROOT_PATH,
  });
  const outputFolder = path.dirname(outputFile);
  await fs.promises.mkdir(outputFolder, { recursive: true });
  await fs.promises.writeFile(outputFile, pageContent);
}

async function processPage(umlContent, parentDirs) {
  const pageFile = assemblyPageFilePath(parentDirs);
  let relativePath = parentDirs.join('/');
  relativePath =  relativePath ? relativePath + "/" : "";
  console.log(relativePath)
  const diagram = await convertUML(umlContent, relativePath);

  let title;
  if (parentDirs.length === 0) {
    title = "Main diagram";
  } else {
    title = parentDirs.join(" ") + " diagram";
  }

  await createPage(diagram, title, pageFile);
  console.log(`Converted: ${pageFile}`);
}

async function convertModule(dir, parentDirs = []) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await convertModule(fullPath, [...parentDirs, entry.name]);
    } else if (entry.isFile() && entry.name === "main.puml") {
      const umlContent = await fs.promises.readFile(fullPath, "utf-8");
      await processPage(umlContent, parentDirs);
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
