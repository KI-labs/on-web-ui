export default function configRoutes(server){
    server.get("/files", () => server.db.files);

    server.delete("/filess/:id", (schema, request) => {
      let id = request.params.id;
      return schema.filess.find(id).destroy();
    });
    server.post("/filess", (schema, request) => {
      let attrs = JSON.parse(request.requestBody);
    
      return schema.filess.create(attrs);
    });
}

