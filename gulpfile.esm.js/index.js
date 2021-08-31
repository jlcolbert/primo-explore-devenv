// eslint-disable-next-line no-unused-vars
import gulp from "gulp";
import minimist from "minimist";
import requireDir from "require-dir";

import {
  setView,
  setVe,
  setReinstallNodeModules,
  setProxy,
  setUseScss,
  setBrowserify,
  setSaml,
  setCas,
} from "./config";

requireDir("./tasks", { recurse: true });

const options = minimist(process.argv.slice(2));
setView(options.view);
setVe(!!options.ve);
if (options.reinstallNodeModules)
  setReinstallNodeModules(options.reinstallNodeModules);
if (options.proxy) setProxy(options.proxy);
if (options.useScss) setUseScss(options.useScss);
setBrowserify(options.browserify);
setSaml(options.saml);
setCas(options.cas);

process.env.NODE_ENV =
  process.env.NODE_ENV || options.environment || "production";
