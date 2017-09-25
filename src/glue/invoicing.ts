import { PluginRegistrationObject } from "hapi";
import { HapiPayPalIntacctInvoicing, IInvoicingOptions } from "../";

export const hapiPayPalIntacctInvoicing = new HapiPayPalIntacctInvoicing();

export const hapiPayPalIntacctInvoicingOptions: IInvoicingOptions = {
    cron: {
        create: {
            auto: process.env.INTACCT_INVOICE_CREATE_AUTO === "true" ? true : false,
            latertext: process.env.INTACCT_INVOICE_CREATE_LATER,
        },
        refund: {
            auto: process.env.INTACCT_INVOICE_REFUND_AUTO === "true" ? true : false,
            latertext: process.env.INTACCT_INVOICE_REFUND_LATER,
        },
    },
    merchant: {
        address: {
            city: process.env.PAYPAL_INVOICE_MERCHANT_ADDRESS_CITY,
            country_code: process.env.PAYPAL_INVOICE_MERCHANT_COUNTRY_CODE,
            line1: process.env.PAYPAL_INVOICE_MERCHANT_ADDRESS_LINE1,
            line2: process.env.PAYPAL_INVOICE_MERCHANT_ADDRESS_LINE2,
            postal_code: process.env.PAYPAL_INVOICE_MERCHANT_COUNTRY_POSTAL_CODE,
            state: process.env.PAYPAL_INVOICE_MERCHANT_ADDRESS_STATE,
        },
        business_name: process.env.PAYPAL_INVOICE_MERCHANT_BUSINESS_NAME,
        email: process.env.PAYPAL_INVOICE_MERCHANT_EMAIL,
        first_name: process.env.PAYPAL_INVOICE_MERCHANT_FIRST_NAME,
        last_name: process.env.PAYPAL_INVOICE_MERCHANT_LAST_NAME,
        phone: {
            country_code: process.env.PAYPAL_INVOICE_MERCHANT_PHONE_COUNTRY_CODE,
            national_number: process.env.PAYPAL_INVOICE_MERCHANT_PHONE_NUMBER,
        },
    },
    paymentaccounts: {
        currencies: {
            USD: process.env.INTACCT_INVOICE_PAYMENT_USD_ACCOUNT,
        },
        default: process.env.INTACCT_INVOICE_PAYMENT_DEFAULT_ACCOUNT,
    },
    // tslint:disable-next-line:max-line-length
    reminderDays: process.env.INTACCT_INVOICE_REMINDER_DAYS ? parseInt(process.env.INVOICE_REMINDER_DAYS, 10) : undefined,
    startDate: process.env.INTACCT_INVOICE_START_DATE,
};

export const hapiPayPalIntacctInvoicingPlugin: PluginRegistrationObject<any> = {
    options: hapiPayPalIntacctInvoicingOptions,
    register: hapiPayPalIntacctInvoicing.register,
    select: ["private"],
};

export const hapiPayPalIntacctInvoicingGlueRegistration = {
    plugin: hapiPayPalIntacctInvoicingPlugin,
};
