import { task, watch, series, src, dest } from "gulp";
import flatten from "gulp-flatten";

import { buildParams } from "../config";

task("watch-img", () => {
  watch(
    [buildParams.viewImgDir(), `!${buildParams.customNpmImgPath()}`],
    { interval: 1000, usePolling: true },
    series("custom-img")
  );
});

task("custom-img", () =>
  src(buildParams.customNpmImgPath())
    .pipe(flatten())
    .pipe(dest(buildParams.viewImgDir()))
);
