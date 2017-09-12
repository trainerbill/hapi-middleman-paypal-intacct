import * as glue from "glue";
import * as hapi from "hapi";
import { IInvoicingOptions} from "../";
import { GlueManifest, hapiPayPalIntacctPlugin } from "../src/glue";

export const config: IInvoicingOptions = {
    autogenerate: true,
    cron: {
        create: {
            latertext: "every 1 hour",
        },
        refund: {
            latertext: "every 1 day",
        },
    },
    merchant: {
        address: {
            city: "Omaha",
            country_code: "US",
            line1: "123 TEST Street",
            postal_code: "68136",
            state: "NE",
        },
        business_name: "My Test Business",
        email: "seller@awesome.com",
        first_name: "Fred",
        last_name: "Flintstone",
        phone: {
            country_code: "1",
            national_number: "4025555555",
        },
    },
    paymentaccounts: {
        default: "Suntrust",
    },
    reminderDays: 15,
};

hapiPayPalIntacctPlugin.options = config;

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
    glue.compose(GlueManifest).then((server: hapi.Server) => server.start());
}
