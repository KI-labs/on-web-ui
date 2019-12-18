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
}
