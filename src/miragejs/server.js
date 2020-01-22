import { Server, Model, Serializer } from "miragejs";
import { routes as _routes } from "./routes/index.js";
var _db = require("./db/index.js");

const CustomSerializer = Serializer.extend({
  serialize(object) {
      const json = Serializer.prototype.serialize.apply(this, arguments);
      const { modelName } = object;
      return json[modelName];
  }
})

export const standardConfig = {
  serializers: {
    application: CustomSerializer
  },

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
  },

  seeds(server){
    server.db.loadData(_db)
  }

}

export function makeServer({ environment = "development" } = {}) {
  let server = new Server({
    environment,

    ...standardConfig,

    timing: 2000,

    routes(){
      _routes(this)
    },

  });

  return server;
}
