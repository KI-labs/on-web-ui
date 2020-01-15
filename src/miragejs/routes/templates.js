export default function templatesRoutes(server){
  server.get("/templates/metadata", () => server.db.templates);
  server.post("/templates", (schema, request) => {
    let attrs = JSON.parse(request.requestBody);

    return schema.templates.create(attrs);
  });
}
