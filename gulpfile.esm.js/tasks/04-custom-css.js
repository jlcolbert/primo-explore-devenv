import { task, series, watch, src, dest } from "gulp";
import concat from "gulp-concat";

import { buildParams } from "../config";

task(
  "watch-css",
  series("select-view", (cb) => {
    watch(
      [
        buildParams.customCssMainPath(),
        buildParams.customNpmCssPath(),
        `!${buildParams.customCssPath()}`,
      ],
      { interval: 1000, usePolling: true },
      series("custom-css")
    );
    cb();
  })
);

task(
  "custom-css",
  series("select-view", () =>
    src([
      buildParams.customCssMainPath(),
      buildParams.customNpmCssPath(),
      `!${buildParams.customCssPath()}`,
    ])
      .pipe(concat(buildParams.customCssFile))
      .pipe(dest(buildParams.viewCssDir()))
  )
);
