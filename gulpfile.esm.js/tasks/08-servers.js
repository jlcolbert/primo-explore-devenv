import { task, series, watch, src } from "gulp";
import http from "http";
import https from "https";

import { getCustimazationObject, proxyFunction } from "../primoProxy";
import {
  reloadServer,
  streamToServer,
  startServer,
} from "../browserSyncManager";
import { buildParams, getVe, getView as view, PROXY_SERVER } from "../config";

task(
  "setup_watchers",
  series("select-view", "watch-js", "watch-custom-scss", "watch-css", (cb) => {
    watch(buildParams.customPath(), () => {
      cb();
      return reloadServer();
    });
    watch(buildParams.customCssPath(), () => {
      cb();
      return src(buildParams.customCssPath()).pipe(streamToServer());
    });
    cb();
  })
);

task(
  "connect:primo_explore",
  series("select-view", (cb) => {
    const appName = "primo-explore";
    startServer({
      label: "production",
      middleware: [
        function selectViewMiddleware(req, res, next) {
          const confPath = getVe()
            ? "/primaws/rest/pub/configuration"
            : "/primo_library/libweb/webservices/rest/v1/configuration";
          const confAsJsPath = "/primo-explore/config_";

          const fixConfiguration = function selectViewConfig(
            res,
            res1,
            isConfByFile
          ) {
            let body = "";

            res1.setEncoding("utf8");

            res1.on("data", (chunk) => {
              body += chunk;
            });

            res1.on("end", () => {
              const vid = view() || "";
              const customizationProxy = getCustimazationObject(vid, appName);

              if (isConfByFile) {
                res.end("");
              } else {
                const jsonBody = JSON.parse(body);
                const newBodyObject = jsonBody;

                newBodyObject.customization = customizationProxy;
                const newBody = JSON.stringify(newBodyObject);

                res.body = newBody;

                /* Console.log('newBody: ' +newBody); */
                res.end(newBody);
              }
            });
          };

          if (
            req.url.startsWith(confAsJsPath) ||
            req.url.startsWith(confPath)
          ) {
            let isConfByFile = false;
            if (req.url.startsWith(confAsJsPath)) {
              isConfByFile = true;
            }

            const url = PROXY_SERVER + req.url;
            const base = PROXY_SERVER.replace("http://", "").replace(
              "https://",
              ""
            );
            const method = PROXY_SERVER.split("://")[0];
            const parts = base.split(":");
            const hostname = parts[0];
            const port = parts[1];

            const options = {
              hostname,
              port,
              path: req.url,
              method: "GET",
              headers: {
                "X-From-ExL-API-Gateway": "1",
              },
            };
            let requestObject = http;
            if (method === "https") {
              requestObject = https;
            }
            const req2 = requestObject.request(options, (res1) => {
              fixConfiguration(res, res1, isConfByFile);
            });
            req2.on("error", (e) => {
              next();
            });

            req2.write("");
            req2.end();
          } else {
            next();
          }
        },
        proxyFunction(),
      ],
      port: 8003,
      baseDir: appName,
    });
    cb();
  })
);

task(
  "run",
  series(
    "select-view",
    "connect:primo_explore",
    "reinstall-primo-node-modules",
    "setup_watchers",
    "custom-js",
    "custom-scss",
    "custom-css"
  )
  // Watch
);
