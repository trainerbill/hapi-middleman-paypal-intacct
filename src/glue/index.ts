import { hapiIntacctGlueRegistration } from "./hapi-intacct";
import { hapiPayPalGlueRegistration } from "./hapi-paypal";
import { hapiPayPalIntacctGlueRegistration } from "./invoicing";

export const glueRegistrations: any = [
    hapiPayPalGlueRegistration,
    hapiIntacctGlueRegistration,
    hapiPayPalIntacctGlueRegistration,
];

export const glueManifest = {
    registrations: [
        ...glueRegistrations,
    ],
};

export * from "./hapi-intacct";
export * from "./hapi-paypal";
export * from "./invoicing";
