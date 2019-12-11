import nodesRoutes from "./nodes";
import obmsRoutes from "./obms";
import pollersRoutes from "./pollers";
import profilesRoutes from "./profiles";
import skusRoutes from "./skus";
import templatesRoutes from "./templates";
import graphsRoutes from "./graph";
import configsRoutes from "./configs";
import filesRoutes from "./files";
import catalogsRoutes from "./catalogs";
import workflowsRoutes from "./workflows";
import tagsRoutes from "./tags";
import tasksRoutes from "./tasks";

export function routes(server) {
  server.urlPrefix = "http://127.0.0.1:9090";
  server.namespace = "/api/2.0";

  nodesRoutes(server);
  obmsRoutes(server);
  pollersRoutes(server);
  profilesRoutes(server);
  skusRoutes(server);
  templatesRoutes(server);
  graphsRoutes(server);
  configsRoutes(server);
  filesRoutes(server);
  catalogsRoutes(server);
  workflowsRoutes(server);
  tagsRoutes(server);
  tasksRoutes(server);
}
