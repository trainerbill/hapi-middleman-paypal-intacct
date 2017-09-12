import { hapiIntacctGlueRegistration } from "./hapi-intacct";
import { hapiPayPalGlueRegistration } from "./hapi-paypal";
import { hapiPayPalIntacctGlueRegistration } from "./invoicing";

export const GlueRegistrations: any = [
    hapiPayPalGlueRegistration,
    hapiIntacctGlueRegistration,
    hapiPayPalIntacctGlueRegistration,
];

export const GlueManifest = {
    connections: [
        {
            host: process.env.IP || "127.0.0.1",
            labels: ["paypal-intacct-private"],
            port: process.env.PRIVATE_PORT || 3001,
        },
        {
            host: process.env.IP || "0.0.0.0",
            labels: ["paypal-intacct-public"],
            port: process.env.PUBLIC_PORT || process.env.PORT || 3000,
        },
    ],
    registrations: [
        ...GlueRegistrations,
    ],
};

export * from "./hapi-intacct";
export * from "./hapi-paypal";
export * from "./invoicing";
