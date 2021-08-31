import { task, series, src, dest } from "gulp";
import zip from "gulp-zip";

import { getView as view } from "../config";

task(
  "create-package",
  series("select-view", "custom-js", "custom-scss", "custom-css", () => {
    const code = view();
    console.log(`Creating package for : (${code}.zip)`);
    console.log(code);
    console.log(" in  : /packages");
    console.log("\r\n");
    console.log(
      "............................................................................................................................................"
    );
    return src(
      [
        `./primo-explore/custom/${code}`,
        `./primo-explore/custom/${code}/html/**`,
        `./primo-explore/custom/${code}/img/**`,
        `./primo-explore/custom/${code}/css/custom1.css`,
        `./primo-explore/custom/${code}/js/custom.js`,
      ],
      { base: "./primo-explore/custom" }
    )
      .pipe(zip(`${code}.zip`))
      .pipe(dest("./packages/"));
  })
);
