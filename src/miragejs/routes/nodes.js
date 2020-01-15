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
}

