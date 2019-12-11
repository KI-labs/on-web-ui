export default function profilesRoutes(server){
  server.get("/profiles/metadata", () => server.db.profiles);
  server.post("/profiles", (schema, request) => {
    let attrs = JSON.parse(request.requestBody);

    return schema.obms.create(attrs);
  });

}

