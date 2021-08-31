import { get, create } from "browser-sync";

export function closeServer(label) {
  get(label).exit();
}

export function reloadServer() {
  return get("production").reload();
}

export function streamToServer() {
  return get("production").stream();
}

export function startServer(args) {
  const { label } = args;
  const { port } = args;
  const { baseDir } = args;
  const { middleware } = args;
  const { open } = args;

  const server = create(label);
  const conf = {
    port,
    server: {
      baseDir,
    },
    open,
  };
  if (middleware) {
    conf.middleware = args.middleware;
  }
  server.init(conf);
}
