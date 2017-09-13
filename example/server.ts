import * as glue from "glue";
import * as hapi from "hapi";
import { IInvoicingOptions} from "../";
import GlueManifest from "../src/glue";

if (!module.parent) {
    (GlueManifest as any).connections = [
        {
            host: process.env.IP || "127.0.0.1",
            labels: ["private"],
            port: process.env.PRIVATE_PORT || 3001,
        },
        {
            host: process.env.IP || "0.0.0.0",
            labels: ["public"],
            port: process.env.PUBLIC_PORT || process.env.PORT || 3000,
        },
    ];
    glue.compose(GlueManifest).then(async (server: hapi.Server) => {
        await server.start();
        // tslint:disable-next-line:no-console
        console.log("Started!");
    });
}
