export default function nodesRoutes(server){
    server.get("/nodes", () => server.db.nodes);
    server.delete("/nodes/:id", (schema, request) => {
      let id = request.params.id;
      return schema.nodes.find(id).destroy();
    });
    server.post("/nodes", (schema, request) => {
      let attrs = JSON.parse(request.requestBody);
    
      return schema.nodes.create(attrs);
    });
    server.post("/nodes/:id/workflows", (schema, request) => {
      const injectableName = request.queryParams.name

      return schema.workflows.findBy({injectableName})
    });
}

