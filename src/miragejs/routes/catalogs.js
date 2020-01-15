export default function catalogsRoutes(server) {
  server.get("/catalogs", () => server.db.catalogs);
  server.get("nodes/:id/catalogs/dmi", (schema, request) => {
    return server.db.catalogs.filter(catalog => {
      if (catalog.node === `/api/2.0/nodes/${request.params.id}`) {
        return catalog.source === "dmi";
      } 
      return false
    })[0];
  });
  server.get("nodes/:id/catalogs/", (schema, request) => {
    return server.db.catalogs.filter(catalog => {
      return catalog.node === `/api/2.0/nodes/${request.params.id}`;
    });
  });
}
