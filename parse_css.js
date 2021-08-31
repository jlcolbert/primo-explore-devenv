import { parse, stringify } from "css";
import { readFileSync } from "fs";

const file = "./primo-explore/lib/app-edb918fbd4.css";
const cssContent = readFileSync(file, { encoding: "utf8" });
const obj = parse(cssContent, { source: file });

const colorRules = [];
for (const rule of obj.stylesheet.rules) {
  if (!rule.declarations) {
    continue;
  }
  const colorDeclarations = rule.declarations.filter(
    (f) => f.property && f.property.includes("color")
  );
  if (!colorDeclarations.length) {
    rule.declarations = colorDeclarations;
    colorRules.push(rule);
  }
}

obj.stylesheet.rules = colorRules;

console.log(stringify(obj));
