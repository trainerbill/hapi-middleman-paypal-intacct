import { PluginRegistrationObject } from "hapi";
import { hapiIntacctGlueRegistration } from "./hapi-intacct";
import { hapiPayPalGlueRegistration } from "./hapi-paypal";
import { hapiPayPalIntacctInvoicingGlueRegistration } from "./invoicing";

export { PluginRegistrationObject } from "hapi";
export { hapiIntacctGlueRegistration } from "./hapi-intacct";
export { hapiPayPalGlueRegistration } from "./hapi-paypal";
export { hapiPayPalIntacctInvoicingGlueRegistration } from "./invoicing";

export default {
    registrations: [
        hapiIntacctGlueRegistration,
        hapiPayPalGlueRegistration,
        hapiPayPalIntacctInvoicingGlueRegistration,
    ],
};
