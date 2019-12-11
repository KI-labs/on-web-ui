import { Server, Model } from "miragejs";
import { routes } from "./routes/index.js";
var db = require("./db.json");

export function makeServer({ environment = "development" } = {}) {
  let server = new Server({
    environment,

    models: {
      node: Model,
      obm: Model,
      poller: Model,
      profile: Model,
      sku: Model,
      template: Model,
      graph: Model,
      catalog: Model,
      config: Model,
      file: Model,
      workflow: Model
    }
  });

  server.routes = routes(server);

  server.db.loadData(db);

  return server;
}
