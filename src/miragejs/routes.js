export function routes(server) {
  console.log("routes", server);
  server.urlPrefix = "http://127.0.0.1:9090";
  server.namespace = "/api/2.0";

  server.get("/nodes", () => server.db.nodes);
  server.delete("/nodes/:id", (schema, request) => {
    let id = request.params.id;
    console.log(id)
    return schema.nodes.find(id).destroy();
  });
  server.post("/nodes", (schema, request) => {
    let attrs = JSON.parse(request.requestBody);

    return schema.nodes.create(attrs);
  });

  server.get("/obms", () => server.db.obms);
  server.delete("/obms/:id", (schema, request) => {
    let id = request.params.id;
    return schema.obms.find(id).destroy();
  });
  server.post("/obms", (schema, request) => {
    let attrs = JSON.parse(request.requestBody);

    return schema.obms.create(attrs);
  });

  server.get("/pollers", () => server.db.obms);
  server.get("/pollers/:id/data/current", (schema, request) => {
    let id = request.params.id;
    return schema.obms.find(id);
  });
  server.delete("/pollers/:id", (schema, request) => {
    let id = request.params.id;
    return schema.pollers.find(id).destroy();
  });
  server.post("/pollers", (schema, request) => {
    let attrs = JSON.parse(request.requestBody);

    return schema.obms.create(attrs);
  });

  server.get("/profiles/metadata", () => server.db.profiles);
  server.post("/profiles", (schema, request) => {
    let attrs = JSON.parse(request.requestBody);

    return schema.obms.create(attrs);
  });

  server.get("/skus", () => server.db.skus);
  server.delete("/skus/:id", (schema, request) => {
    let id = request.params.id;
    return schema.skus.find(id).destroy();
  });
  server.post("/skus", (schema, request) => {
    let attrs = JSON.parse(request.requestBody);

    return schema.skus.create(attrs);
  });

  server.get("/templates/metadata", () => server.db.templates);
  server.post("/templates", (schema, request) => {
    let attrs = JSON.parse(request.requestBody);

    return schema.templates.create(attrs);
  });

  server.get("/workflows/graphs", () => server.db.workflows);
  server.delete("/workflows/graphs/:injectableName", (schema, request) => {
    let injectableName = request.params.injectableName;

    return schema.workflows.findBy({injectableName}).destroy();
  });
  server.put("/workflows/graphs", (schema, request) => {
    let attrs = JSON.parse(request.requestBody);

    return schema.workflows.create(attrs);
  });
}
