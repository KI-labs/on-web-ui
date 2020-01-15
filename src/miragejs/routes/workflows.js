export default function workflowsRoutes(server){
  server.get("/workflows", (schema, request) => {
    if(request.queryParams.active==='true'){
      return server.db.workflows.slice(0,2)
    }else{
      return server.db.workflows.slice(2)
    }
  });
  server.get("/workflows/:id", (schema, request) => {
    let id = request.params.id;
    return schema.workflows.find(id);
  });
  server.delete("/workflows/:id", (schema, request) => {
    let injectableName = request.params.injectableName;

    return schema.workflows.findBy({injectableName}).destroy();
  });

}

