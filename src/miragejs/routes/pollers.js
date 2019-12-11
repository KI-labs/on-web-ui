export default function pollersRoutes(server) {
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
}
