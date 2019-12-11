export default function configRoutes(server){
    server.get("/config", () => server.db.config[0]);

    server.post("/config", (schema, request) => {
      let attrs = JSON.parse(request.requestBody);
    
      return schema.configs.create(attrs);
    });

    server.patch("/config", (schema, request) => {
      let attrs = JSON.parse(request.requestBody);
      console.log(attrs)

    
      return schema.configs.create(attrs);
    });
}

