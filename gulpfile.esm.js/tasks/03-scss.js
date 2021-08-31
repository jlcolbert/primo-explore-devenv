import autoprefixer from "gulp-autoprefixer";
import { task, src, dest, series, watch } from "gulp";
import rename from "gulp-rename";
import plumber from "gulp-plumber";
import clone from "gulp-clone";
import template from "gulp-template";
import got from "got";
import { createGunzip } from "zlib";
import { extract } from "tar-fs";
import runSequence from "gulp4-run-sequence";
import { readFileSync } from "fs";
import del from "del";
import lodashMerge from "lodash/merge";
import log from "fancy-log";

import splitCss from "../cssSplitter";
import {
  getUseScss as useScss,
  buildParams as config,
  getVe as isVe,
} from "../config";

const sass = require("gulp-sass")(require("sass"));

const stylesBaseDir = "www/styles/partials";
const templateFile = `${stylesBaseDir}/_variables.tmpl.scss`;
const OTBColorsFile = `${stylesBaseDir}/../colors.json`;
const scssFile = "_variables.scss";

task("cleanup", () => del(["www"]));

task("extract-scss-files", () => {
  const proxyServer = require("../config").PROXY_SERVER;
  let prefix;
  if (isVe()) {
    prefix = "/discovery";
  } else {
    prefix = "/primo-explore";
  }
  const url = `${proxyServer + prefix}/lib/scsss.tar.gz`;
  console.log(url);
  const headers = {
    /* 'Accept-Encoding': 'gzip' */
  };

  return (
    got({ url, headers })
      // Unzip
      .pipe(createGunzip())
      .pipe(
        extract(".", {
          map: (header) => {
            if (header.name.indexOf("src/main/webapp") > -1) {
              header.name = header.name.replace("src/main/webapp", "www");
            }
            return header;
          },
        })
      )
  );
});
task("color-variables", () => {
  const colorVariables = JSON.parse(
    readFileSync(`${config.viewCssDir()}/../colors.json`, "utf8")
  );
  const colorVariablesOTB = JSON.parse(readFileSync(OTBColorsFile, "utf8"));
  const colorsMeregd = lodashMerge(colorVariablesOTB, colorVariables);
  return src(templateFile)
    .pipe(template(colorsMeregd))
    .pipe(rename(scssFile))
    .pipe(dest(stylesBaseDir))
    .pipe(dest(`${config.customScssDir()}/partials`));
});

task("compile-scss", () => {
  const allCss = src("www/styles/main.scss")
    .pipe(
      plumber({
        errorHandler(err) {
          console.log(`Error:${err}`);
          this.emit("end");
        },
      })
    )
    // .pipe(sourcemaps.init())
    .pipe(sass())
    .pipe(
      autoprefixer({
        cascade: false,
      })
    );
  const colorStream = allCss
    .pipe(clone())
    .pipe(rename("app-colors.css"))
    // .pipe(cssnano({safe: true}))
    .pipe(splitCss({ colors: true }))
    // .pipe(sourcemaps.write('.'))
    .pipe(dest(config.viewCssDir()));

  return colorStream;
});

task("app-css", (cb) => {
  runSequence(
    "extract-scss-files",
    "color-variables",
    "compile-scss",
    "cleanup",
    cb
  );
});

/**
 * Task to watch custom scss files contained in /scss directory in view package folder
 *
 * Please note. The logic of this task will only execute if the run task is
 * executed with the "useScss" parameter, e.g.: gulp run --view UNIBZ --useScss
 */
task(
  "watch-custom-scss",
  series("select-view", (cb) => {
    if (!useScss()) {
      cb();
      return;
    }
    watch(
      [`${config.customScssDir()}/**/*.scss`],
      { interval: 1000, usePolling: true },
      series("custom-scss")
    );
    cb();
  })
);

/**
 * Compiles the custom scss to a css file called custom-scss-compiled.css which
 * in turn is then concatenated with all other css files present in the /css folder
 * of the view package folder to the custom1.css file that constitutes the entirety
 * of the view package css.
 *
 * Please note. The logic of this task will only execute if the run task is
 * executed with the "useScss" parameter, e.g.: gulp run --view UNIBZ --useScss
 */
task(
  "custom-scss",
  series("select-view", (cb) => {
    if (!useScss()) {
      cb();
      return;
    }

    log("Start Creating custom CSS from custom SCSS");

    const customScss = src(config.customScssMainPath(), { allowEmpty: true })
      .pipe(
        plumber({
          errorHandler(err) {
            console.log(`1111111${err}`);
            this.emit("end");
          },
        })
      )
      // .pipe(sourcemaps.init())
      .pipe(sass())
      .pipe(
        autoprefixer({
          cascade: false,
        })
      )
      .pipe(rename("custom-scss-compiled.css"))
      .pipe(dest(config.viewCssDir()));

    log("End Creating custom CSS from custom SCSS");
    cb();
    return customScss;
  })
);
