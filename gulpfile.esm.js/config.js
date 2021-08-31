const customFile = "custom.js";
const customModuleFile = "custom.module.js";
const customCssFile = "custom1.css";
const mainFile = "main.js";

/**
 * The URL to your sandbox or production Primo instance.
 * For SSL environments (https), the port number (443) must be included.
 *
 * Examples:
 *   var PROXY_SERVER = 'http://abc-primo.hosted.exlibrisgroup.com'
 *   var PROXY_SERVER = 'https://abc-primo.hosted.exlibrisgroup.com:443'
 */

let browserify;
let view;
let ve;
let useScss;
let reinstallNodeModules;
let saml;
let cas;

function viewHtmlDir() {
  return `primo-explore/custom/${view}/html`;
}

function viewJsDir() {
  return `primo-explore/custom/${view}/js`;
}

function customPath() {
  return `${viewJsDir()}/${customFile}`;
}

function customModulePath() {
  return `${viewJsDir()}/${customModuleFile}`;
}

function mainPath() {
  return `${viewJsDir()}/*.js`;
}

function mainJsPath() {
  return `${viewJsDir()}/${mainFile}`;
}

function customColorsPath() {
  return `colors.json`;
}

function viewRootDir() {
  return `primo-explore/custom/${view}`;
}

function viewCssDir() {
  return `primo-explore/custom/${view}/css`;
}

function customCssMainPath() {
  return `${viewCssDir()}/*.css`;
}

function customScssDir() {
  return `primo-explore/custom/${view}/scss`;
}

function customScssMainPath() {
  return `${customScssDir()}/main.scss`;
}

function customCssPath() {
  return `primo-explore/custom/${view}/css/custom1.css`;
}

function customNpmModuleRootDir() {
  return `primo-explore/custom/node_modules`;
}

function customNpmJsCustomPath() {
  return `primo-explore/custom/node_modules/primo-explore*/js/custom.js`;
}

function customNpmJsModulePath() {
  return `primo-explore/custom/node_modules/primo-explore*/js/custom.module.js`;
}

function customNpmJsPath() {
  return `primo-explore/custom/node_modules/primo-explore*/js/*.js`;
}

function customNpmDistPath() {
  return `primo-explore/custom/node_modules/primo-explore*/dist/*.js`;
}

function customNpmCssPath() {
  return `primo-explore/custom/node_modules/primo-explore*/css/*.css`;
}

function customNpmHtmlPath() {
  return `primo-explore/custom/node_modules/primo-explore*/html/*.html`;
}

export const buildParams = {
  customFile,
  customCssFile,
  customPath,
  customModulePath,
  mainPath,
  mainJsPath,
  viewRootDir,
  viewJsDir,
  viewHtmlDir,
  viewCssDir,
  customScssDir,
  customScssMainPath,
  customCssPath,
  customNpmModuleRootDir,
  customNpmJsPath,
  customNpmDistPath,
  customNpmJsCustomPath,
  customNpmJsModulePath,
  customNpmCssPath,
  customNpmHtmlPath,
  customCssMainPath,
  customColorsPath,
};

export function setView(_view) {
  view = _view;
}

export function setVe(_ve) {
  ve = _ve;
}

export function setReinstallNodeModules(_reinstallNodeModules) {
  reinstallNodeModules = _reinstallNodeModules;
}

export function setProxy(_proxy) {
  this.PROXY_SERVER = _proxy;
}

export function setUseScss(_useScss) {
  useScss = _useScss;
}

export function setBrowserify(_browserify) {
  browserify = _browserify;
}

export function setSaml(_saml) {
  saml = _saml;
}

export function setCas(_cas) {
  cas = _cas;
}

export function getVe() {
  return ve;
}

export const { PROXY_SERVER } = process.env;

export function getProxy() {
  return PROXY_SERVER;
}

export function getSaml() {
  return saml;
}

export function getCas() {
  return cas;
}

export function getView() {
  return view;
}

export function getBrowserify() {
  return browserify;
}

export function getUseScss() {
  return useScss;
}

export function getReinstallNodeModules() {
  return reinstallNodeModules;
}

export default {
  proxy: getProxy,
};
