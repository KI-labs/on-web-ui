export default function tagsRoutes(server){
    server.get("/nodes/:id/tags", (schema, request) => {
      let id = request.params.id;
      return []
    });
}

