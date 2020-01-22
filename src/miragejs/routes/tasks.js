export default function tasksRoutes(server){
  server.get("/workflows/tasks", () => server.db.tasks);
  server.get("/workflows/tasks/:injectableName",  (schema, request) => {
    let injectableName = request.params.injectableName;

    return schema.tasks.findBy({injectableName});
  });
  server.delete("/workflows/tasks/:injectableName", (schema, request) => {
    let injectableName = request.params.injectableName;

    return schema.tasks.findBy({injectableName}).destroy();
  });
  server.put("/workflows/tasks", (schema, request) => {
    let attrs = JSON.parse(request.requestBody);
    return schema.tasks.create(attrs);
  });
}


