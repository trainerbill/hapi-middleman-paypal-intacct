import { PluginRegistrationObject } from "hapi";
import { HapiIntacct, IHapiIntacctOptions } from "hapi-intacct";

export const hapiIntacct = new HapiIntacct();

export const hapiIntacctOptions: IHapiIntacctOptions = {
    routes: [{
        config: {
            id: "intacct_invoice_query",
            isInternal: true,
        },
    },
    {
        config: {
            id: "intacct_invoice_read",
            isInternal: true,
        },
    },
    {
        config: {
            id: "intacct_invoice_update",
            isInternal: true,
        },
    },
    {
        config: {
            id: "intacct_invoice_inspect",
            isInternal: true,
        },
    },
    {
        config: {
            id: "intacct_payment_create",
            isInternal: true,
        },
    },
    {
        config: {
            id: "intacct_checkingaccount_query",
            isInternal: true,
        },
    }],
    sdk: {
        auth: {
            companyId: process.env.INTACCT_COMPANY_ID,
            password: process.env.INTACCT_USER_PASSWORD,
            senderId: process.env.INTACCT_SENDER_ID,
            senderPassword: process.env.INTACCT_SENDER_PASSWORD,
            sessionId: process.env.INTACCT_SESSION_ID,
            userId: process.env.INTACCT_USER_ID,
        },
        /*
        controlId: process.env.INTACCT_CONTROL_ID || "testRequestId",
        dtdVersion: process.env.INTACCT_DTD_VERSION || "3.0",
        uniqueId: process.env.INTACCT_CONTROL_ID || false,
        */
    },
};

export const hapiIntacctPlugin: PluginRegistrationObject<any> = {
    options: hapiIntacctOptions,
    register: hapiIntacct.register,
    select: ["paypal-intacct-private"],
};

export const hapiIntacctGlueRegistration = {
    plugin: hapiIntacctPlugin,
};
