import { hapiIntacctGlueRegistration } from "./hapi-intacct";
import { hapiPayPalGlueRegistration } from "./hapi-paypal";
import { hapiPayPalIntacctGlueRegistration } from "./invoicing";

export const GlueRegistrations: any = [
    hapiPayPalGlueRegistration,
    hapiIntacctGlueRegistration,
    hapiPayPalIntacctGlueRegistration,
];

export const GlueManifest = {
    registrations: [
        ...GlueRegistrations,
    ],
};

export * from "./hapi-intacct";
export * from "./hapi-paypal";
export * from "./invoicing";
