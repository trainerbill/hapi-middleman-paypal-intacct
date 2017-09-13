import * as hapi from "hapi";
import { IIntacctRouteConfiguration } from "hapi-intacct";
import * as joi from "joi";
import * as later from "later";
import {
    IInvoice,
    IInvoiceItem,
    invoiceBillingInfoSchema,
    InvoiceModel,
    invoiceSchema,
    IWebhookEvent,
    paypalAddressSchema,
    paypalPhoneSchema,
    PayPalRestApi,
} from "paypal-rest-api";
import { HapiIntacctInvoicing } from "./intacct";

export * from "./intacct";

export interface IInvoicingMerchant {
    address: {
        city: string;
        country_code: string;
        line1: string;
        postal_code: string;
        state: string;
    };
    business_name: string;
    email: string;
    first_name?: string;
    last_name?: string;
    phone: {
        country_code: string;
        national_number: string;
    };
}

export interface IInvoicingOptions {
    autogenerate: boolean;
    cron: {
        create?: {
            latertext: string;
        };
        refund?: {
            latertext: string;
        };
    };
    paymentaccounts?: {
        default: string;
        currencies?: {
            [key: string]: string;
        };
    };
    merchant: IInvoicingMerchant;
    reminderDays?: number;
}

export const intacctInvoiceExtend = {
    PAYPALERROR: "",
    PAYPALINVOICEID: "",
    PAYPALINVOICESTATUS: "",
    PAYPALINVOICEURL: "",
    PAYPALINVOICING: "",
};

export class HapiPayPalIntacctInvoicing {

    public intacct: HapiIntacctInvoicing;
    public paypal: PayPalRestApi;
    private intacctInvoiceKeys: string[];
    private server: hapi.Server;
    private options: IInvoicingOptions;

    constructor() {
        this.register.attributes = {
            name: "hapi-paypal-intacct-invoicing",
        };
        this.intacct = new HapiIntacctInvoicing();
    }

    // tslint:disable-next-line:max-line-length
    public register: hapi.PluginFunction<any> = (server: hapi.Server, options: any, next: hapi.ContinuationFunction) => {
        this.server = server;
        this.intacct.setServer(this.server);
        this.paypal = server.plugins["hapi-paypal"].paypal;
        const promises = [];

        // Validate Options
        const optionsSchema = joi.object().keys({
            autogenerate: joi.boolean().required(),
            cron: joi.object().keys({
                create: joi.object().keys({
                    latertext: joi.string().default("every 1 hour"),
                }).optional(),
                refund: joi.object().keys({
                    latertext: joi.string().default("every 1 day"),
                }).optional(),
            }),
            merchant: invoiceBillingInfoSchema.required(),
            paymentaccounts: joi.object().keys({
                currencies: joi.object().optional(),
                default: joi.string().required(),
            }).optional(),
            reminderDays: joi.number().default(30),
        });
        const validate = joi.validate(options, optionsSchema);
        if (validate.error) {
            throw validate.error;
        }
        this.options = validate.value;

        return this.init().then(() => next());
    }

    public async webhookHandler(webhook: IWebhookEvent) {
        switch (webhook.event_type) {
            case "INVOICING.INVOICE.REFUNDED":
                try {
                    this.intacct.update(webhook.resource.invoice.number, {
                        PAYPALINVOICESTATUS: webhook.resource.invoice.status,
                    });
                } catch (err) {
                    // tslint:disable-next-line:max-line-length
                    this.server.log("error", `hapi-paypal-intacct::webhookHandler::UpdateInvoice::INVOICING.INVOICE.PAID::${webhook.resource.invoice.id}::${err.message}`);
                }

                break;
            case "INVOICING.INVOICE.CANCELLED":
                try {
                    this.intacct.update(webhook.resource.invoice.number, {
                        PAYPALINVOICESTATUS: webhook.resource.invoice.status,
                    });
                } catch (err) {
                    // tslint:disable-next-line:max-line-length
                    this.server.log("error", `hapi-paypal-intacct::webhookHandler::UpdateInvoice::INVOICING.INVOICE.PAID::${webhook.resource.invoice.id}::${err.message}`);
                }

                break;
            case "INVOICING.INVOICE.PAID":
                // const invoice = await this.intacct.get(webhook.resource.invoice.number);
                const invoice: any = {
                    PAYPALERROR: "",
                };
                if (this.options.paymentaccounts) {
                    // Create a payment
                    try {
                        const account = this.options.paymentaccounts.currencies ?
                            this.options.paymentaccounts.currencies[webhook.resource.invoice.total_amount.currency] :
                            this.options.paymentaccounts.default;

                        if (!account) {
                            // tslint:disable-next-line:max-line-length
                            throw new Error(`${webhook.resource.invoice.total_amount.currency} currency payment account not configured`);
                        }

                        // For some reason the object has to be exacly in this order...
                        // tslint:disable:object-literal-sort-keys
                        const create = await this.intacct.createPayment({
                            customerid: webhook.resource.invoice.billing_info[0].additional_info,
                            paymentamount: webhook.resource.invoice.total_amount.value,
                            bankaccountid: account,
                            // tslint:disable-next-line:max-line-length
                            refid: webhook.resource.invoice.payments[webhook.resource.invoice.payments.length - 1].transaction_id,
                            arpaymentitem: [{
                                invoicekey: webhook.resource.invoice.number,
                                amount: webhook.resource.invoice.total_amount.value,
                            }],
                        });
                        // tslint:enable:object-literal-sort-keys
                    } catch (err) {
                        // tslint:disable-next-line:max-line-length
                        this.server.log("error", `hapi-paypal-intacct::webhookHandler::CreatePaymnet::INVOICING.INVOICE.PAID::${webhook.resource.invoice.id}::${err.message}`);
                        const error = JSON.parse(err.message);
                        if (error.length === 1 && error[0].errorno !== "BL03000130") {
                            invoice.PAYPALERROR = err.message;
                        }
                    }
                }

                invoice.PAYPALINVOICESTATUS = webhook.resource.invoice.status;

                // Update Intacct Invoice
                try {
                    this.intacct.update(webhook.resource.invoice.number, invoice);
                } catch (err) {
                    // tslint:disable-next-line:max-line-length
                    this.server.log("error", `hapi-paypal-intacct::webhookHandler::UpdateInvoice::INVOICING.INVOICE.PAID::${webhook.resource.invoice.id}::${err.message}`);
                }

                if (invoice.PAYPALERROR) {
                    throw new Error(invoice.PAYPALERROR);
                }

                break;

            default:
        }
    }

    private async init() {
        const promises: Array<Promise<any>> = [];
        try {
            this.server.log("info", `hapi-paypal-intacct::initInvoicing::${JSON.stringify(this.options)}.`);
            await Promise.all([ this.validateKeys(), this.validateAccounts()]);
            if (this.options.cron.create && this.options.cron.create.latertext) {
                promises.push(this.createInvoiceSync());
                const timer = later.parse.text(this.options.cron.create.latertext);
                later.setInterval(this.createInvoiceSync.bind(this), timer);
                // tslint:disable-next-line:max-line-length
                this.server.log("info", `hapi-paypal-intacct::initInvoicing::create cron set for ${this.options.cron.create.latertext}.`);
            }

            if (this.options.cron.refund && this.options.cron.refund.latertext) {
                promises.push(this.refundInvoicesSync());
                const refundtimer = later.parse.text(this.options.cron.refund.latertext);
                later.setInterval(this.refundInvoicesSync.bind(this), refundtimer);
                // tslint:disable-next-line:max-line-length
                this.server.log("info", `hapi-paypal-intacct::initInvoicing::refund cron set for ${this.options.cron.refund.latertext}.`);
            }
            return await Promise.all(promises);
        } catch (err) {
            this.server.log("error", `hapi-paypal-intacct::init::${err.message}`);
            throw err;
        }
    }

    private async validateAccounts() {
        const configAccounts: string[] = [];
        if (!this.options.paymentaccounts) {
            return;
        }
        if (this.options.paymentaccounts.default) {
            configAccounts.push(this.options.paymentaccounts.default);
        }
        if (this.options.paymentaccounts.currencies) {
            const keys = Object.keys(this.options.paymentaccounts.currencies);
            keys.forEach((key) => configAccounts.push(this.options.paymentaccounts.currencies[key]));
        }
        try {
            const accounts = await this.intacct.listAccounts();
            configAccounts.forEach((account) => {
            const filteredAccounts = accounts.filter((faccount: any) => {
                return faccount.BANKACCOUNTID === account;
            });
            if (filteredAccounts.length < 1) {
                throw new Error(`Intacct Payment Account ${account} configured but does not exist in Intacct`);
            }
        });
        } catch (err) {
            this.server.log("error", `hapi-paypal-intacct::validateAccounts::${err.message}`);
            throw err;
        }
    }

    private async validateKeys() {
        try {
            const inspect = await this.intacct.inspect();
            Object.keys(intacctInvoiceExtend).forEach((key) => {
                if ((inspect).indexOf(key) === -1) {
                    throw new Error(`${key} not defined.  Add the key to the Intacct Invoice object.`);
                }
            });
        } catch (err) {
            this.server.log("error", `hapi-paypal-intacct::validateKeys::${err.message}`);
            throw err;
        }
    }

    private async refundInvoicesSync() {
        try {
            const promises: Array<Promise<any>> = [];
            const query = `RAWSTATE = 'V' AND PAYPALINVOICESTATUS = 'PAID'`;
            const invoices = await this.intacct.query(query);
            try {
                invoices.forEach((invoice: any) => promises.push(this.refundInvoiceSync(invoice)));
            } catch (err) {
                this.server.log("error", `hapi-paypal-intacct::refundInvoicesSync::${err.message}`);
            }
            return Promise.all(promises);
        } catch (err) {
            this.server.log("error", `hapi-paypal-intacct::refundInvoicesSync::${err.message}`);
            throw err;
        }
    }

    private async refundInvoiceSync(invoice: any) {
        try {
            let paypalInvoice;
            try {
                paypalInvoice = await this.paypal.invoice.get(invoice.PAYPALINVOICEID);
            } catch (err) {
                throw err;
            }
            try {
                const promises: Array<Promise<any>> = [];
                paypalInvoice.model.payments.forEach(async (payment) => {
                  const sale = await this.paypal.sale.get(payment.transaction_id);
                  promises.push(sale.refund());
                });
                await Promise.all(promises);
                await this.intacct.update(invoice.RECORDNO, {
                    PAYPALINVOICESTATUS: paypalInvoice.model.status,
                });
            } catch (err) {
                if (err.message === "Request was refused.This transaction has already been fully refunded") {
                    try {
                        await this.intacct.update(invoice.RECORDNO, {
                            PAYPALINVOICESTATUS: paypalInvoice.model.status,
                        });
                    } catch (err) {
                        // tslint:disable-next-line:max-line-length
                        this.server.log("error", `hapi-paypal-intacct::refundInvoiceSync::UpdateIntacct::${err.message}`);
                    }
                }
            }
        } catch (err) {
            this.server.log("error", `hapi-paypal-intacct::refundInvoiceSync::${err.message}`);
        }
    }

    private async createInvoiceSync() {
        // tslint:disable-next-line:max-line-length
        let query = process.env.INTACCT_INVOICE_QUERY || `RAWSTATE = 'A' AND ( PAYPALINVOICESTATUS IN (NULL,'DRAFT') OR PAYPALINVOICEID IS NULL ) AND WHENCREATED > '8/1/2017'`;
        if (!this.options.autogenerate && !process.env.INTACCT_INVOICE_QUERY) {
            query += ` AND PAYPALINVOICING = 'T'`;
        }
        const promises: Array<Promise<any>> = [];
        try {
            // tslint:disable-next-line:max-line-length
            const invoices = await Promise.all([this.intacct.query(query, ["RECORDNO"]), this.paypal.invoice.search({ status: ["SENT", "UNPAID"] })]);
            invoices[0].forEach(async (invoice: any) => await this.syncIntacctToPayPal(invoice));
            invoices[1].forEach(async (invoice) => await this.syncPayPalToIntacct(invoice));
            // await Promise.all(promises);
            this.server.log("info", "hapi-paypal-intacct::syncInvoices::Success");
        } catch (err) {
            this.server.log("error", `hapi-paypal-intacct::syncInvoices::Error::${err.message}`);
        }
    }

    private async syncIntacctToPayPal(invoice: any) {
        let paypalInvoice;
        let intacctInvoice: any;
        const intacctUpdate: any = {
            PAYPALERROR: "",
        };
        try {
            const fullInvoices = await Promise.all([
                this.intacct.get(invoice.RECORDNO),
                this.paypal.invoice.search({ number: invoice.RECORDNO }),
            ]);
            intacctInvoice = fullInvoices[0];
            if (fullInvoices[1].length === 1) {
                paypalInvoice = fullInvoices[1][0];
                intacctInvoice.PAYPALINVOICEID = paypalInvoice.model.id;
            } else if (fullInvoices[1].length > 1) {
                const ids = fullInvoices[1].map((inv) => inv.model.id);
                // tslint:disable-next-line:max-line-length
                const error = `Multiple PayPal Invoice IDs ${ids}.  You should login to paypal and cancel one.\n`;
                intacctInvoice.PAYPALERROR += error;
                this.server.log("warn", error);
            }

            if (intacctInvoice.PAYPALINVOICEID && paypalInvoice) {
                // Update a PayPal Invoice
                await paypalInvoice.update(this.toPaypalInvoice(intacctInvoice));
            } else if (!intacctInvoice.PAYPALINVOICEID) {
                // Create a PayPal Invoice
                paypalInvoice = new this.paypal.invoice(this.toPaypalInvoice(intacctInvoice));
                await paypalInvoice.create();
                intacctInvoice.PAYPALINVOICEID = paypalInvoice.model.id;
            }

            this.updateInacctInvoiceWithPayPalModel(intacctUpdate, paypalInvoice);

            if (paypalInvoice.model.status === "DRAFT") {
                await paypalInvoice.send();
            }

            this.updateInacctInvoiceWithPayPalModel(intacctUpdate, paypalInvoice);

        } catch (err) {
            // tslint:disable-next-line:max-line-length
            this.server.log("error", `hapi-paypal-intacct::syncInvoices::UpdatePayPal::${invoice.RECORDNO}::${err.message}`);
            intacctUpdate.PAYPALERROR += `${JSON.stringify(err.message)}\n`;
        }

        try {
            await this.intacct.update(intacctInvoice.RECORDNO, intacctUpdate);
        } catch (err) {
            // tslint:disable-next-line:max-line-length
            this.server.log("error", `hapi-paypal-intacct::syncInvoices::UpdateIntacct::${invoice.RECORDNO}::${err.message}`);
        }
    }

    private async syncPayPalToIntacct(invoice: InvoiceModel) {
        try {
            const intacctInvoice = await this.intacct.get(invoice.model.number);
            if (!intacctInvoice) {
                await invoice.cancel();
            } else {
                const reminder = new Date(invoice.model.metadata.last_sent_date + this.options.reminderDays);
                const now = new Date();
                if (now > reminder) {
                    await invoice.remind();
                }
            }
        } catch (err) {
            this.server.log("error", `hapi-paypal-intacct::syncInvoicePayPalToIntacct::${err.message}`);
        }
    }

    private toPaypalInvoice(intacctInvoice: any) {
        // TODO: change to ppInvoice.Invoice when billing_info is fixed
        const paypalInvoice: any = {
            billing_info: [{
                additional_info: intacctInvoice.CUSTOMERID,
                business_name: intacctInvoice.BILLTO.COMPANYNAME,
                email: intacctInvoice.BILLTO.EMAIL1,
                first_name: intacctInvoice.BILLTO.FIRSTNAME,
                last_name: intacctInvoice.BILLTO.LASTNAME,
            }],
            items: this.toPayPalLineItems(intacctInvoice.ARINVOICEITEMS.arinvoiceitem),
            merchant_info: this.options.merchant,
            note: intacctInvoice.CUSTMESSAGE.MESSAGE,
            number: intacctInvoice.RECORDNO,
            payment_term: {
                term_type: intacctInvoice.TERMNAME,
            },
            shipping_info: {
                business_name: intacctInvoice.SHIPTO.CONTACTNAME,
                first_name: intacctInvoice.SHIPTO.FIRSTNAME,
                last_name: intacctInvoice.SHIPTO.LASTNAME,
            },
            tax_inclusive: true,
        };

        const shippingAddress = {
            city: intacctInvoice.SHIPTO.MAILADDRESS.CITY,
            country_code: intacctInvoice.SHIPTO.MAILADDRESS.COUNTRYCODE,
            line1: intacctInvoice.SHIPTO.MAILADDRESS.ADDRESS1,
            line2: intacctInvoice.SHIPTO.MAILADDRESS.ADDRESS2,
            postal_code: intacctInvoice.SHIPTO.MAILADDRESS.ZIP,
            state: intacctInvoice.SHIPTO.MAILADDRESS.STATE,
        };
        joi.validate(shippingAddress, paypalAddressSchema, (err, value) => {
            if (err) {
                return;
            }
            paypalInvoice.shipping_info.address = value;
        });

        const billingAddress = {
            city: intacctInvoice.BILLTO.MAILADDRESS.CITY,
            country_code: intacctInvoice.BILLTO.MAILADDRESS.COUNTRYCODE,
            line1: intacctInvoice.BILLTO.MAILADDRESS.ADDRESS1,
            line2: intacctInvoice.BILLTO.MAILADDRESS.ADDRESS2,
            postal_code: intacctInvoice.BILLTO.MAILADDRESS.ZIP,
            state: intacctInvoice.BILLTO.MAILADDRESS.STATE,
        };
        joi.validate(billingAddress, paypalAddressSchema, (err, value) => {
            if (err) {
                return;
            }
            paypalInvoice.billing_info[0].address = value;
        });

        const billingPhone = {
            country_code: "1",
            national_number: intacctInvoice.BILLTO.PHONE1,
        };
        joi.validate(billingPhone, paypalPhoneSchema, (err, value) => {
            if (err) {
                return;
            }
            paypalInvoice.billing_info[0].phone = value;
        });

        const validateResult = joi.validate(paypalInvoice, invoiceSchema);
        if (validateResult.error) {
            throw new Error(validateResult.error.message);
        }

        return validateResult.value;
    }

    private toPayPalLineItems(arrInvoiceItems: any) {

        const arrPPInvItems: IInvoiceItem[] = [];

        if (arrInvoiceItems.length > 0) {
            for (const item of arrInvoiceItems) {
                const ritem = {
                    name: item.ITEMNAME,
                    quantity: 1,
                    unit_price: {
                        currency: item.CURRENCY,
                        value: item.AMOUNT,
                    },
                };
                arrPPInvItems.push(ritem);
            }
        }
        return arrPPInvItems;
    }

    private updateInacctInvoiceWithPayPalModel(intacctInvoice: any, paypalInvoice: InvoiceModel) {
      intacctInvoice.PAYPALINVOICEID = paypalInvoice.model.id;
      intacctInvoice.PAYPALINVOICESTATUS = paypalInvoice.model.status;
      intacctInvoice.PAYPALINVOICEURL = paypalInvoice.model.metadata.payer_view_url;
    }
}
