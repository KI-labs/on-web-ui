export default function skusRoutes(server){
  server.get("/skus", () => server.db.skus);
  server.get("/skus/:id", (schema, request) => {
    let id = request.params.id;
    return schema.skus.find(id)
  });
  server.delete("/skus/:id", (schema, request) => {
    let id = request.params.id;
    return schema.skus.find(id).destroy();
  });
  server.post("/skus", (schema, request) => {
    let attrs = JSON.parse(request.requestBody);

    return schema.skus.create(attrs);
  });
}

