import { PluginRegistrationObject } from "hapi";
import { HapiPayPalIntacctInvoicing, IInvoicingOptions } from "../";

export const hapiPayPalIntacctInvoicing = new HapiPayPalIntacctInvoicing();

export const hapiPayPalIntacctInvoicingOptions: IInvoicingOptions = {
    autogenerate: process.env.INVOICING_AUTO ? true : false,
    cron: {
        create: {
            latertext: process.env.INVOICING_CREATE_CRON_LATER,
        },
        refund: {
            latertext: process.env.INVOICING_REFUND_CRON_LATER,
        },
    },
    merchant: {
        address: {
            city: process.env.PAYPAL_MERCHANT_ADDRESS_CITY,
            country_code: process.env.PAYPAL_MERCHANT_COUNTRY_CODE,
            line1: process.env.PAYPAL_MERCHANT_ADDRESS_LINE1,
            postal_code: process.env.PAYPAL_MERCHANT_COUNTRY_POSTAL_CODE,
            state: process.env.PAYPAL_MERCHANT_COUNTRY_STATE,
        },
        business_name: process.env.PAYPAL_MERCHANT_BUSINESS_NAME,
        email: process.env.PAYPAL_MERCHANT_EMAIL,
        first_name: process.env.PAYPAL_MERCHANT_FIRST_NAME,
        last_name: process.env.PAYPAL_MERCHANT_LAST_NAME,
        phone: {
            country_code: process.env.PAYPAL_MERCHANT_PHONE_COUNTRY_CODE,
            national_number: process.env.PAYPAL_MERCHANT_PHONE_NUMBER,
        },
    },
    paymentaccounts: {
        currencies: {
            USD: process.env.INVOICE_PAYMENT_USD_ACCOUNT,
        },
        default: process.env.INVOICE_PAYMENT_DEFAULT_ACCOUNT,
    },
    reminderDays: process.env.INVOICE_REMINDER_DAYS ? process.env.INVOICE_REMINDER_DAYS * 1 : undefined,
};

export const hapiPayPalIntacctInvoicingPlugin: PluginRegistrationObject<any> = {
    options: hapiPayPalIntacctInvoicingOptions,
    register: hapiPayPalIntacctInvoicing.register,
    select: ["private"],
};

export const hapiPayPalIntacctInvoicingGlueRegistration = {
    plugin: hapiPayPalIntacctInvoicingPlugin,
};
