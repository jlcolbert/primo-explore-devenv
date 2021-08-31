import { task, series, src, dest } from "gulp";
import { spawn } from "child_process";
import {
  existsSync,
  exists,
  readFile,
  mkdir,
  createWriteStream,
  unlink,
} from "fs";
import Promise from "bluebird";
import { start, colors as _colors, message as _message, get } from "prompt";
import { camelCase } from "camel-case";
import streamToPromise from "stream-to-promise";
import { green, cyan } from "colors/safe";
import { resolve as _resolve } from "path";

import { getView as _view, buildParams } from "../config";

task(
  "prepare-addon",
  series("select-view", "custom-js", "custom-scss", "custom-css", () => {
    const view = _view();
    const packageJsonPath = `${buildParams.viewRootDir()}/package.json`;
    let npmId;
    let directoryName;
    let hookName;

    const runNpmInitIfNeeded = new Promise((resolve, reject) => {
      if (!existsSync(packageJsonPath)) {
        const childProcess = spawn("npm", ["init"], {
          cwd: buildParams.viewRootDir(),
          shell: true,
          stdio: "inherit",
        });

        childProcess.on("error", (err) => {
          reject(err);
        });

        childProcess.on("exit", (code) => {
          if (!code) {
            resolve();
          }
        });
      } else {
        resolve();
      }
    });

    function findNpmIdInPackageJson() {
      return new Promise((resolve, reject) => {
        exists(packageJsonPath, () => {
          if (exists) {
            readFile(packageJsonPath, (err, data) => {
              if (err) {
                reject(err);
              }
              const packageJson = JSON.parse(data.toString());
              npmId = camelCase(packageJson.name);
              resolve();
            });
          }
        });
      });
    }

    function makeDirectory() {
      return new Promise((resolve, reject) => {
        directoryName = `./addons/${npmId}`;
        mkdir(directoryName, (err) => reject(err));
        resolve();
      });
    }

    function copyFiles() {
      return streamToPromise(
        src(
          [
            `./primo-explore/custom/${view}/package*.json`,
            `./primo-explore/custom/${view}/html/**`,
            `./primo-explore/custom/${view}/img/**`,
            `./primo-explore/custom/${view}/css/custom1.css`,
            `./primo-explore/custom/${view}/js/custom.js`,
          ],
          { base: `./primo-explore/custom/${view}` }
        ).pipe(dest(directoryName))
      );
    }

    function compileAddon() {
      return new Promise((resolve, reject) => {
        const customJsPath = `${directoryName}/js/${buildParams.customFile}`;
        if (existsSync(customJsPath)) {
          readFile(customJsPath, (err, data) => {
            if (err) {
              reject(err);
            }
            let dataString = data.toString();

            // Remove comments
            dataString = dataString.replace(
              /\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm,
              ""
            );

            // Group 1 = component name, group 2 = controller name if exists controller
            const componentRegex =
              /\.component[\s]*?\([\s]*?['"](prm.*?After)['"](?:(?:(?!\.component)[\s\S])*?controller[\s]*?:[\s]*?['"](.*)['"])?/g;

            if (dataString.match(componentRegex).length > 1) {
              const arr = [];
              let match;
              while ((match = componentRegex.exec(dataString))) {
                arr.push(match[1]);
              }
              reject(
                new Error(
                  `Only one Primo hook allowed, you tried to use several: ${arr.toString()}`
                )
              );
            }

            let match = componentRegex.exec(dataString);

            if (match) {
              hookName = match[1];
              // May be null
              const controllerName = match[2];

              dataString = dataString.replace(
                new RegExp(controllerName || "", "g"),
                `${npmId}Controller`
              );
              dataString = dataString.replace(new RegExp(hookName, "g"), npmId);
            }

            // Remove wrapping function
            const wrappingFunctionRegex =
              /\s*?\(\s*?function\s*?\(\s*?\)\s*?{\s*(?:["']use strict["'];\s*)?([\s\S]*)\s*?}\s*?\)\s*?\(\s*?\)\s*?;?/g;
            if ((match = wrappingFunctionRegex.exec(dataString))) {
              dataString = dataString.replace(wrappingFunctionRegex, match[1]);
            }

            /*
             * Remove app declaration
             * group 1 = app variable name
             */
            const appDeclarationViewOrCentralCustomRegex =
              /[\s]*(?:var|let)?[\s]*(.*?)[\s]*=[\s]*angular[\s]*\.module\([\s]*['"](?:view|central)Custom['"][\s]*,[\s]*\[['"]angularLoad['"]\]\);/g;
            if (
              (match = appDeclarationViewOrCentralCustomRegex.exec(dataString))
            ) {
              // Remove matched line
              dataString = dataString.replace(
                appDeclarationViewOrCentralCustomRegex,
                ""
              );

              // Change all the occurrences of the variable to 'app'
              const variableName = match[1];
              if (variableName !== "app") {
                const variableUseRegex = new RegExp(
                  `([[=(,]\\s*?)${variableName}([^\\w])|([^\\w])${variableName}(\\s*?[.)|\\]}=;])`,
                  "gm"
                );
                dataString = dataString.replace(
                  variableUseRegex,
                  "$1$3app$2$4"
                );
              }
            }

            /*
             * Remove constant config if exists
             * group 1 = config name
             */
            const studioConfigDeclerationRegex =
              /\.(?:constant|value|service|factory)[\s]*?\([\s]*['"](.*?StudioConfig)/g;
            if (dataString.match(studioConfigDeclerationRegex)) {
              dataString = dataString.replace(
                studioConfigDeclerationRegex,
                "$&DevenvTest"
              );
            }

            // Group 1 = module name
            const moduleRegex =
              /\.module[\s]*?\([\s]*((?:').*?(?:')|(?:").*?(?:")|.*?)[\s]*?[),]/g;

            // Push all modules
            while ((match = moduleRegex.exec(dataString))) {
              dataString = `${dataString}\napp.requires.push(${match[1]});`;
            }

            // Write content to {{npmId}}.js
            const wstream = createWriteStream(
              `${directoryName}/js/${npmId}.js`
            );
            wstream.write(dataString);
            wstream.end();

            // Delete custom.js file
            unlink(customJsPath, (err1) => {
              if (err1) {
                reject(err1);
              }
            });

            resolve();
          });
        } else {
          resolve();
        }
      });
    }

    function createDescriptorJson() {
      return new Promise((resolve, reject) => {
        const npmignorePath = `${directoryName}/.npmignore`;
        const descriptorJsonFileName = "descriptor.json";
        const descriptorJsonPath = `${directoryName}/${descriptorJsonFileName}`;

        console.log("Creating '.npmignore' file\n");

        // Create .npmignore file with descriptor.json
        let wstream = createWriteStream(npmignorePath);
        wstream.write(`${descriptorJsonFileName}\n`);
        wstream.end();

        console.log("Creating 'descriptor.json' file\n");

        // Needed values for descriptor.json: face (image), notes (description), who (author), what (title), linkGit, npmid, version, hook
        const descriptor = {
          face: "",
          notes: "",
          who: "",
          what: "",
          linkGit: "",
          npmid: "",
          version: "",
          hook: hookName,
        };

        // Get known values from package.json
        readFile(packageJsonPath, (err, data) => {
          if (err) {
            reject(err);
          }
          const packageJson = JSON.parse(data.toString());
          descriptor.notes = packageJson.description;
          // Maybe empty, but is string
          descriptor.who = packageJson.author.name || packageJson.author;
          if (packageJson.repository) {
            descriptor.linkGit =
              // Maybe null
              packageJson.repository.url || packageJson.repository;
          }
          descriptor.npmid = packageJson.name;
          descriptor.version = packageJson.version;

          /*
           * Until here have: notes (description), who (author) {maybe}, linkGit {maybe}, npmid, version, hook
           * need to ask for: face (image), who (author) {maybe}, what (title), linkGit {maybe}
           */

          // Ask for values not exists already
          console.log(
            "This utility will walk you through creating a 'descriptor.json' file.\n" +
              "It only covers the most common items, and tries to guess sensible defaults."
          );
          start();
          _colors = false;
          _message = "";
          const properties = [
            {
              name: "what",
              message: "Enter title",
              required: true,
              default: descriptor.npmid,
            },
            {
              name: "face",
              message: "Enter a link to photo of you",
              required: true,
            },
          ];

          if (!descriptor.who) {
            properties.push({
              name: "who",
              message: "Enter author/s name/s",
              required: true,
            });
          }

          if (!descriptor.linkGit) {
            properties.push({
              name: "linkGit",
              message: "Enter link to repository",
              required: true,
            });
          }

          get(properties, (err, result) => {
            if (err) {
              reject(err);
            }

            descriptor.what = result.what;
            descriptor.face = result.face;
            if (result.who) {
              descriptor.who = result.who;
            }
            if (result.linkGit) {
              descriptor.linkGit = result.linkGit;
            }

            // Create descriptor json with values
            wstream = createWriteStream(descriptorJsonPath);
            wstream.write(JSON.stringify(descriptor));
            wstream.close();

            resolve();
          });
        });
      });
    }

    function announceFinishedProcess() {
      console.log("\n");
      process.stdout.write("Finished compiling addon\n");
      console.log("");
      process.stdout.write(green("Addon can be found at "));
      process.stdout.write(cyan(_resolve(`./addons/${npmId}`)));
      process.stdout.write(
        green(
          ".\nIn order to publish to NPM:  Navigate to the addon folder. Review the 'package.json' file. Then run 'npm publish'.\n"
        )
      );
      process.stdout.write(
        green(
          "A basic descriptor for your addon was created in the file 'descriptor.json'. Please review it and edit fields accordingly.\n"
        )
      );
      process.stdout.write(
        green(
          "When you are ready to publish to Primo-Studio, create a pull request at "
        )
      );
      process.stdout.write(
        cyan("https://github.com/primousers/primostudio/tree/submit_here")
      );
      process.stdout.write(
        green(" appending your descriptor to the 'features.json' file.\n")
      );
    }

    function handleError(err) {
      // If fails at any time - clean addon folder
      if (directoryName) {
        unlink(directoryName);
      }
      console.error(err.message);
    }

    return runNpmInitIfNeeded
      .then(findNpmIdInPackageJson, handleError)
      .then(makeDirectory, handleError)
      .then(copyFiles, handleError)
      .then(compileAddon, handleError)
      .then(createDescriptorJson, handleError)
      .then(announceFinishedProcess, handleError);
  })
);
