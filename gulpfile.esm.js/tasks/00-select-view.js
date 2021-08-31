import { task } from "gulp";
import { sync } from "glob";
import { start, get } from "prompt";

import { getView as view, setView } from "../config";

task("select-view", (cb) => {
  const basedir = "primo-explore/custom/";
  const customFolderExp = `${basedir}*/`;
  const files = sync(customFolderExp, {});

  return new Promise((resolve) => {
    if (!view()) {
      console.log("Please Choose a view to use:\r\n");
      files.forEach((element, index) => {
        console.log(
          `${index + 1}: ${element.replace(basedir, "").replace("/", "")}`
        );
        console.log("\r\n");
      });

      start();
      const property = {
        name: "view",
        message: "Please Choose view to use",
      };
      get(property, (err, result) => {
        console.log("\r\n");
        let code = result.view;

        if (files[result.view - 1]) {
          code = files[result.view - 1].replace(basedir, "").replace("/", "");
        }
        setView(code);
        resolve();
      });
    } else {
      let valid = false;
      for (const index in files) {
        const dir = files[index].replace(basedir, "").replace("/", "");

        if (dir === view()) {
          valid = true;
          break;
        }
      }

      if (!valid) {
        resolve();
        cb("--view must be a valid view");
      } else {
        resolve();
      }
    }
  });
});
