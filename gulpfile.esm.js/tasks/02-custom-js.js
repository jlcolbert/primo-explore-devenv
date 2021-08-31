import { task, series, watch, src, dest } from "gulp";
import babel from "gulp-babel";
import concat from "gulp-concat";
import wrap from "gulp-wrap";
import log from "fancy-log";
import { red, cyan } from "ansi-colors";
import noop from "gulp-noop";
import browserify from "browserify";
import source from "vinyl-source-stream";
import uglify from "gulp-uglify";
import buffer from "vinyl-buffer";
import { init, write } from "gulp-sourcemaps";
import "@babel/preset-env";
import "babelify";

import { getBrowserify, buildParams } from "../config";

function getBrowserifyBabelPlugins() {
  return [
    "transform-html-import-to-string",
    ["angularjs-annotate", { explicitOnly: true }],
  ];
}

function getDefaultBabelPlugins() {
  return [
    [
      "transform-define",
      {
        "process.env.NODE_ENV": process.env.NODE_ENV,
      },
    ],
  ];
}

const getBabelConfig = () => ({
  presets: ["@babel/preset-env"],
  plugins: getDefaultBabelPlugins().concat(
    getBrowserify() ? getBrowserifyBabelPlugins() : []
  ),
  sourceMap: getBrowserify(),
});

function buildByConcatination() {
  return src(
    [
      buildParams.customModulePath(),
      buildParams.mainPath(),
      buildParams.customNpmJsPath(),
      buildParams.customNpmDistPath(),
      `!${buildParams.customPath()}`,
      `!${buildParams.customNpmJsModulePath()}`,
      `!${buildParams.customNpmJsCustomPath()}`,
    ],
    { allowEmpty: true }
  )
    .pipe(concat(buildParams.customFile))
    .pipe(babel(getBabelConfig()))
    .on("error", function concatError(err) {
      if (err && err.codeFrame) {
        log(
          red("Browserify error: "),
          `${cyan(err.filename)} [${err.loc.line},${err.loc.column}]`,
          `\r\n${err.message}\r\n${err.codeFrame}`
        );
      } else {
        log(err);
      }
      this.emit("end");
    })
    .pipe(wrap('(function(){\n"use strict";\n<%= contents %>\n})();'))
    .pipe(dest(buildParams.viewJsDir()));
}

function buildByBrowserify() {
  return browserify({
    debug: true,
    entries: buildParams.mainJsPath(),
    paths: [`${buildParams.viewJsDir()}/node_modules`],
  })
    .transform("babelify", getBabelConfig())
    .bundle()
    .pipe(source(buildParams.customFile))
    .pipe(buffer())
    .pipe(init({ loadMaps: true }))
    .pipe(process.env.NODE_ENV === "production" ? uglify() : noop())
    .pipe(write("./"))
    .pipe(dest(buildParams.viewJsDir()));
}

task(
  "watch-js",
  series("select-view", (cb) => {
    watch(
      [`${buildParams.viewJsDir()}/**/*.js`, `!${buildParams.customPath()}`],
      { interval: 1000, usePolling: true },
      series("custom-js")
    );
    cb();
  })
);

task(
  "custom-js",
  series("select-view", "custom-html-templates", (cb) => {
    if (getBrowserify()) {
      buildByBrowserify().on("end", cb);
    } else {
      buildByConcatination().on("end", cb);
    }
  })
);
