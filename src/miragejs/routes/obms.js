export default function obmsRoutes(server) {
  server.get("/obms", () => server.db.obms);
  server.get("/obms/:id", (schema, request) => {
    let id = request.params.id;
    return schema.obms.find(id)
  });
  server.delete("/obms/:id", (schema, request) => {
    let id = request.params.id;
    return schema.obms.find(id).destroy();
  });
  server.post("/obms", (schema, request) => {
    let attrs = JSON.parse(request.requestBody);

    return schema.obms.create(attrs);
  });
  server.put("/obms", (schema, request) => {
    let attrs = JSON.parse(request.requestBody);
    
    attrs.node = `/api/2.0/nodes/${attrs.nodeId}`

    return schema.obms.create(attrs);
  });
}
