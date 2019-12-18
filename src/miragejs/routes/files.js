export default function configRoutes(server){
    server.get("/files", () => server.db.files);

    server.delete("/files/:id", (schema, request) => {
      let id = request.params.id;
      return schema.files.find(id).destroy();
    });
    server.post("/files", (schema, request) => {
      let attrs = JSON.parse(request.requestBody);
    
      return schema.files.create(attrs);
    });
}

