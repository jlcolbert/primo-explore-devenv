import { ensureDirSync, copy } from "fs-extra";
import minimist from "minimist";

const options = minimist(process.argv.slice(2));

ensureDirSync(options.to);
copy(options.from, options.to, (err) => {
  console.log(`Error: ${err}`);
});
/* Fsx.copy('111', 'tasks/111', err => {console.log('222'+err)}) */
// Fsx.copy('./node_modules/primo-explore-devenv/primo-explore/primo-explore-location-item-after', '/tmp/mynewdir', err => {})
