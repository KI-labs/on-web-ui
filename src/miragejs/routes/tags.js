export default function tagsRoutes(server){
    server.get("/nodes/:id/tags", (schema, request) => {
      let id = request.params.id;
      return schema.skus.find(id)? schema.skus.find(id) : []
    });
}

