export default function graphsRoutes(server){
  server.get("/workflows/graphs", () => server.db.graphs);
  server.delete("/workflows/graphs/:injectableName", (schema, request) => {
    let injectableName = request.params.injectableName;

    return schema.graphs.findBy({injectableName}).destroy();
  });
  server.put("/workflows/graphs", (schema, request) => {
    let attrs = JSON.parse(request.requestBody);

    return schema.graphs.create(attrs);
  });
}

