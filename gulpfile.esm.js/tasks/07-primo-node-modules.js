import { sync } from "del";
import { execSync } from "child_process";
import { task, series } from "gulp";
import log from "fancy-log";
import runSequence from "gulp4-run-sequence";

import { getReinstallNodeModules, buildParams } from "../config";

/**
 * Metatask that executes the two atomic tasks in order
 * to re-install all primo-explore related node modules
 * of the view package
 *
 * Will only execute the atomic tasks when the run task
 * is called with the --reinstallNodeModules parameter
 *
 * e.g. gulp run --view [ViewName] --reinstallNodeModules
 */
task(
  "reinstall-primo-node-modules",
  series("select-view", (cb) => {
    if (getReinstallNodeModules()) {
      runSequence(
        "delete-primo-node-modules",
        "install-primo-node-modules",
        cb
      );
      return;
    }
    cb();
  })
);

/**
 * Deletes all primo-explore related node modules of the view package.
 */
task("delete-primo-node-modules", (cb) => {
  log(
    "Starting deletion of the view package's primo explore related node modules."
  );

  sync([`${buildParams.customNpmModuleRootDir()}/primo-explore*`]);

  log(
    "Finished deletion of the view package's primo explore related node modules."
  );
  cb();
});

/**
 * Reinstalls all primo-explore related node modules of the view package by
 * executing the "npm install" command.
 *
 * This requires that all relevant primo-explore modules need to be referenced
 * in the package.json file in the root folder of the view package.
 */
task("install-primo-node-modules", (cb) => {
  log(
    "Starting re-installation of the view package's node modules using >npm install< command."
  );

  execSync(
    "npm install",
    {
      cwd: buildParams.viewRootDir(),
    },
    (error, stdout, stderr) => {
      if (error) {
        log(error);
      }

      if (stdout) {
        log(stdout);
      }

      if (stderr) {
        log(stderr);
      }
    }
  );

  log(
    "Finished re-installation of the view package's node modules using >npm install< command."
  );
  cb();
});
