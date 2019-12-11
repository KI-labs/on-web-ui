export default function catalogsRoutes(server) {
  server.get("/catalogs", () => server.db.catalogs);
  server.get("nodes/:id/catalogs/dmi", (schema, request) => {
    return schema.catalogs.findBy({
      node: `/api/2.0/nodes/${request.params.id}`
    });
  });
}
