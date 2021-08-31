import modRewrite from "connect-modrewrite";
import { promisifyAll } from "bluebird";
import glob, { sync } from "glob";

import { getVe, PROXY_SERVER, getSaml, getCas } from "./config";

promisifyAll(glob);

export function getCustimazationObject(vid, appName) {
  const basePath = "custom/";
  const customizationObject = {
    viewJs: "",
    centralJs: "",
    viewCss: "",
    centralCss: "",
    favIcon: "",
    libraryLogo: "",
    resourceIcons: "",
    staticHtml: "",
  };

  const packages = sync(`${basePath}*`, {
    cwd: appName,
    ignore: "**/README.md",
  });

  const isInherited = packages.indexOf(`${basePath}CENTRAL_PACKAGE`) > -1;
  if (vid !== "") {
    var viewPackage = basePath + vid;
  }
  if (vid === "") {
    var viewPackage = packages.filter(
      (p) => p !== `${basePath}CENTRAL_PACKAGE`
    );
  }

  viewPackage = viewPackage || viewPackage[0];
  console.log(viewPackage);
  if (viewPackage.length === 0) {
    viewPackage = "";
  }
  // Js

  if (viewPackage !== "" && viewPackage !== "CENTRAL_PACKAGE") {
    customizationObject.viewJs = sync(`${viewPackage}/js/custom.js`, {
      cwd: appName,
    });
  }
  if (isInherited) {
    customizationObject.centralJs = sync(
      `${basePath}CENTRAL_PACKAGE/js/custom.js`,
      { cwd: appName }
    );
  }

  // Css

  customizationObject.viewCss = sync(`${viewPackage}/css/custom1.css`, {
    cwd: appName,
  });

  if (isInherited) {
    customizationObject.centralCss = sync(
      `${basePath}CENTRAL_PACKAGE/css/custom1.css`,
      { cwd: appName }
    );
  }

  // Images

  customizationObject.favIcon = sync(`${viewPackage}/img/favicon.ico`, {
    cwd: appName,
  });

  if (isInherited && customizationObject.favIcon === "") {
    customizationObject.favIcon = sync(
      `${basePath}CENTRAL_PACKAGE/img/favicon.ico`,
      { cwd: appName }
    );
  }
  customizationObject.libraryLogo = sync(
    `${viewPackage}/img/library-logo.png`,
    { cwd: appName }
  )[0];
  if (
    isInherited &&
    (!customizationObject.libraryLogo || customizationObject.libraryLogo === "")
  ) {
    customizationObject.libraryLogo = sync(
      `${basePath}CENTRAL_PACKAGE/img/library-logo.png`,
      { cwd: appName }
    )[0];
  }

  var paths = sync(`${viewPackage}/img/icon_**.png`, { cwd: appName });
  customizationObject.resourceIcons = {};
  for (const path of paths) {
    var pathFixed = path.substring(
      path.indexOf("/img/icon_") + 10,
      path.indexOf(".png")
    );
    customizationObject.resourceIcons[pathFixed] = path;
  }

  if (isInherited) {
    var paths = sync(`${basePath}CENTRAL_PACKAGE/img/icon_**.png`, {
      cwd: appName,
    });

    for (const path of paths) {
      var pathFixed = path.substring(
        path.indexOf("/img/icon_") + 10,
        path.indexOf(".png")
      );
      if (!customizationObject.resourceIcons[pathFixed]) {
        customizationObject.resourceIcons[pathFixed] = path;
      }
    }
  }

  // Html
  var paths = sync(`${viewPackage}/html/home_**.html`, { cwd: appName });
  function getLanguage(entry) {
    const numberOfCharsForLang = getVe() ? 2 : 5;
    const start = entry.indexOf(".html") - numberOfCharsForLang;
    const res = entry.substring(start, start + numberOfCharsForLang);
    return res;
  }
  function getHtmlCustomizations(paths, path, staticDict) {
    const patternString = `${path}/html/`;

    const re = new RegExp(patternString, "g");
    const res = paths.map((e) => e.replace(re, ""));

    res.forEach((e) => {
      const lang = getLanguage(e);
      let dirName = e.replace(`_${lang}.html`, "");
      if (dirName.indexOf("/") > -1) {
        const sepIndex = dirName.indexOf("/");
        dirName = dirName.substr(0, sepIndex);
      }
      if (!staticDict[dirName]) {
        staticDict[dirName] = {};
      }
      staticDict[dirName][lang] = `${path}/html/${e}`;
      if (lang === "en_US" || lang === "en") {
        staticDict[dirName].default = `${path}/html/${e}`;
      }
    });

    return staticDict;
  }
  if (paths && paths.length > 0) {
    // For August 2016 version
    customizationObject.staticHtml = {};
    customizationObject.staticHtml.homepage = {};
    for (const path of paths) {
      var pathFixed = path.substring(
        path.indexOf("/html/home_") + 11,
        path.indexOf(".html")
      );
      customizationObject.staticHtml.homepage[pathFixed] = path;
    }

    if (isInherited) {
      var paths = sync(`${basePath}CENTRAL_PACKAGE/html/home_**.html`, {
        cwd: appName,
      });

      for (const path of paths) {
        var pathFixed = path.substring(
          path.indexOf("/html/home_") + 11,
          path.indexOf(".html")
        );
        if (!customizationObject.staticHtml.homepage[pathFixed]) {
          customizationObject.staticHtml.homepage[pathFixed] = path;
        }
      }
    }
  } else {
    // Starting November 2016 version
    var paths = sync(`${viewPackage}/html/**/*.html`, { cwd: appName });
    if (!paths || paths.length === 0) {
      paths = sync(`${viewPackage}/html/*.html`, { cwd: appName });
    }
    let staticHtmlRes = {};
    staticHtmlRes = getHtmlCustomizations(paths, viewPackage, staticHtmlRes);

    if (isInherited) {
      var paths = sync(`${basePath}CENTRAL_PACKAGE/html/**/*.html`, {
        cwd: appName,
      });
      staticHtmlRes = getHtmlCustomizations(
        paths,
        "custom/CENTRAL_PACKAGE",
        staticHtmlRes
      );
    }
    customizationObject.staticHtml = staticHtmlRes;
  }

  return customizationObject;
}

export function proxyFunction() {
  const proxyServer = PROXY_SERVER;
  const loginRewriteFlags = getSaml() || getCas() ? "RL" : "PL";

  return modRewrite([
    `/primo_library/libweb/webservices/rest/(.*) ${proxyServer}/primo_library/libweb/webservices/rest/$1 [PL]`,
    `/primaws/rest/(.*) ${proxyServer}/primaws/rest/$1 [PL]`,
    `/primo_library/libweb/primoExploreLogin ${proxyServer}/primo_library/libweb/primoExploreLogin [${loginRewriteFlags}]`,
    `/primaws/suprimaLogin ${proxyServer}/primaws/suprimaLogin [${loginRewriteFlags}]`,
    `/primaws/suprimaExtLogin ${proxyServer}/primaws/suprimaExtLogin [${loginRewriteFlags}]`,

    `/primo-explore/index.html ${proxyServer}/primo-explore/index.html [PL]`,
    `/discovery/index.html ${proxyServer}/discovery/index.html [PL]`,
    "/primo-explore/custom/(.*) /custom/$1 [L]",
    "/discovery/custom/(.*) /custom/$1 [L]",
    `/primo-explore/(.*) ${proxyServer}/primo-explore/$1 [PL]`,
    `/discovery/(.*) ${proxyServer}/discovery/$1 [PL]`,
    ".*primoExploreJwt=.* /index.html [L]",
    "^[^\\.]*$ /index.html [L]",
  ]);
}
