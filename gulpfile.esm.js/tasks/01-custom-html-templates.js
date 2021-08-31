import { src, dest, task, series } from "gulp";
import templateCache from "gulp-angular-templatecache";
import { readFileSync } from "fs";

import { getBrowserify, buildParams } from "../config";

function parseModuleName() {
  let mainJsContent = readFileSync(
    `${buildParams.viewJsDir()}/main.js`,
    "utf8"
  );
  const moduleString = "angular.module('";
  let index = mainJsContent.indexOf(moduleString) + moduleString.length;
  mainJsContent = mainJsContent.slice(index);
  index = mainJsContent.indexOf("'");
  const module = mainJsContent.slice(0, index);
  return module;
}

function prepareTempltesWithBrowserify() {
  const module = parseModuleName();
  return src(`${buildParams.viewHtmlDir()}/templates/**/*.html`)
    .pipe(
      templateCache({
        filename: "customTemplates.js",
        module,
        transformUrl(url) {
          return url.replace(/^\/+/g, "");
        },
      })
    )
    .pipe(dest(buildParams.viewJsDir()));
}

function prepareTemplates() {
  if (getBrowserify()) {
    return prepareTempltesWithBrowserify();
  }
  return src([
    `${buildParams.viewHtmlDir()}/templates/**/*.html`,
    buildParams.customNpmHtmlPath(),
  ])
    .pipe(
      templateCache({
        filename: "customTemplates.js",
        templateHeader: "app.run(function($templateCache) {",
        templateFooter: "});",
        transformUrl(url) {
          return url.replace(/^\/+/g, "");
        },
      })
    )
    .pipe(dest(buildParams.viewJsDir()));
}

task(
  "custom-html-templates",
  series("select-view", (cb) => {
    prepareTemplates().on("end", cb);
  })
);
