import { Response } from 'miragejs';

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
    server.post("/nodes/:id/workflows", (schema, request) => {
      const injectableName = request.queryParams.name
      const random = Math.floor(Math.random()*10)

      //According to Aguiar, this route fails just because
      if(random % 2 == 0){
        return new Response(500)
      }

      //Just to ensure it returns something, in db there is some injectableName without workflow
      return schema.workflows.findBy({injectableName})
      ? 
      schema.workflows.findBy({injectableName})
      :
      schema.workflows.findBy({injectableName: 'Graph.Service.Docker'}) 
    });
}

