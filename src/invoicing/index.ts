import * as hapi from "hapi";
import * as joi from "joi";
import * as later from "later";
import {
    IBillingInfo,
    IInvoice,
    IInvoiceItem,
    invoiceBillingInfoSchema,
    InvoiceModel,
    IWebhookEvent,
    PayPalRestApi,
} from "paypal-rest-api";
import { HapiIntacctInvoicing } from "./intacct";

export * from "./intacct";

export interface IInvoicingOptions {
    cron: {
        create?: {
            auto: boolean;
            latertext: string;
        };
        refund?: {
            auto: boolean;
            latertext: string;
        };
    };
    paymentaccounts?: {
        default: string;
        currencies?: {
            [key: string]: string;
        };
    };
    merchant: IBillingInfo;
    reminderDays?: number;
    startDate: string;
}

// TODO: Remove in favor of class static
export const intacctInvoiceExtend = {
    PAYPALERROR: "",
    PAYPALINVOICEID: "",
    PAYPALINVOICESTATUS: "",
    PAYPALINVOICEURL: "",
    PAYPALINVOICING: "",
};

export class HapiPayPalIntacctInvoicing {

    public static intacctKeys = [
        "PAYPALERROR",
        "PAYPALINVOICEID",
        "PAYPALINVOICESTATUS",
        "PAYPALINVOICEURL",
        "PAYPALINVOICING",
    ];

    private _intacct: HapiIntacctInvoicing;
    private _paypal: PayPalRestApi;
    private _server: hapi.Server;
    private _options: IInvoicingOptions;

    constructor() {
        this.register.attributes = {
            name: "hapi-paypal-intacct-invoicing",
        };
        this.intacct = new HapiIntacctInvoicing();
    }

    get intacct() {
        return this._intacct;
    }

    set intacct(intacct) {
        this._intacct = intacct;
    }

    get paypal() {
        return this._paypal;
    }

    set paypal(paypal) {
        this._paypal = paypal;
    }

    get server() {
        return this._server;
    }

    set server(server) {
        this._server = server;
    }

    get options() {
        return this._options;
    }

    set options(options) {
        // Remove undefined
        options = JSON.parse(JSON.stringify(options));
        const optionsSchema = joi.object().keys({
            cron: joi.object().keys({
                create: joi.object().keys({
                    auto: joi.boolean().default(true)
                            .error(new Error("Invalid INTACCT_INVOICE_CREATE_AUTO environment variable")),
                    latertext: joi.string().default("every 1 hour"),
                }).optional(),
                refund: joi.object().keys({
                    auto: joi.boolean().default(true)
                            .error(new Error("Invalid INTACCT_INVOICE_REFUND_AUTO environment variable")),
                    latertext: joi.string().default("every 1 day"),
                }).optional(),
            }),
            merchant: invoiceBillingInfoSchema.required(),
            paymentaccounts: joi.object().keys({
                currencies: joi.object().default({}),
                default: joi.string().required()
                            .error(new Error("Invalid INTACCT_INVOICE_PAYMENT_DEFAULT_ACCOUNT environment variable")),
            }).optional(),
            reminderDays: joi.number().default(15),
            startDate: joi.string().regex(/\d{1,2}\/\d{1,2}\/\d{4}/).required()
                        .error(new Error("Invalid INTACCT_INVOICE_START_DATE environment variable")),
        });
        const validate = joi.validate(options, optionsSchema);
        if (validate.error) {
            throw validate.error;
        }
        this._options = validate.value;
    }

    // tslint:disable-next-line:max-line-length
    public register: hapi.PluginFunction<any> = (server: hapi.Server, options: any, next: hapi.ContinuationFunction) => {
        this.server = server;
        this.intacct.setServer(this.server);
        this.paypal = server.plugins["hapi-paypal"].paypal;
        this.options = options;
        this.server.log(["info", "paypal-intacct", "options"], this.options);
        return this.init()
                .then(() => next())
                .catch((err) => {
                    throw err;
                });
    }

    public async webhookHandler(webhook: IWebhookEvent) {
        const intacctInvoice: any = {
            PAYPALERROR: "",
        };
        switch (webhook.event_type) {
            case "INVOICING.INVOICE.REFUNDED":
                // TODO: This can only happen if the refund via PP portal.
                // May need to implement a refund at intacct in the future.
                break;
            case "INVOICING.INVOICE.CANCELLED":
                // TODO: Cancel the invoice at intacct?
                // May need to implement a refund at intacct in the future.
                break;
            case "INVOICING.INVOICE.PAID":
                // tslint:disable-next-line:max-line-length
                try {
                    await this.createPayment(webhook.resource.invoice);
                } catch (err) {
                    intacctInvoice.PAYPALERROR = err.message;
                }

                break;

            default:
        }

        intacctInvoice.PAYPALINVOICESTATUS = webhook.resource.invoice.status;
        await this.intacct.update(webhook.resource.invoice.reference, intacctInvoice);
    }

    public async createPayment(invoice: IInvoice) {
        if (invoice.status !== "PAID") {
            throw new Error("Invalid Status");
        }
        // tslint:disable-next-line:max-line-length
        const account = this.options.paymentaccounts.currencies[invoice.total_amount.currency] || this.options.paymentaccounts.default;
        try {
            // Create a payment
            // For some reason the object has to be exacly in this order...
            // tslint:disable:object-literal-sort-keys
            const payment = {
                customerid: invoice.billing_info[0].additional_info,
                paymentamount: invoice.total_amount.value,
                bankaccountid: account,
                refid: invoice.payments[invoice.payments.length - 1].transaction_id,
                paymentmethod: "Credit Card",
                arpaymentitem: [{
                    invoicekey: invoice.reference,
                    amount: invoice.total_amount.value,
                }],
            };

            await this.intacct.createPayment(payment);
            this.server.log(["info", "paypal-intacct", "invoice", "payment"], payment);
            // tslint:enable:object-literal-sort-keys
        } catch (err) {
            // tslint:disable-next-line:max-line-length
            const error = JSON.parse(err.message);
            // BL03000130 is already paid at intacct. So we should be good.
            if (error.length === 1 && error[0].errorno !== "BL03000130") {
                throw err;
            }
        }
    }

    public async validateAccounts() {
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
        const accounts = await this.intacct.listAccounts();
        configAccounts.forEach((account) => {
            if (!account) {
                return;
            }
            const filteredAccounts = accounts.filter((faccount: any) => {
                return faccount.BANKACCOUNTID === account;
            });
            if (filteredAccounts.length < 1) {
                throw new Error(`Intacct Payment Account ${account} configured but does not exist in Intacct`);
            }
        });
    }

    public async validateKeys() {
        const inspect = await this.intacct.inspect();
        HapiPayPalIntacctInvoicing.intacctKeys.forEach((key) => {
            if ((inspect).indexOf(key) === -1) {
                throw new Error(`${key} not defined.  Add the key to the Intacct Invoice object.`);
            }
        });
    }

    public async refundInvoicesSync() {
        // tslint:disable-next-line:max-line-length
        let query = process.env.INTACCT_INVOICE_REFUND_QUERY || `RAWSTATE = 'V' AND PAYPALINVOICESTATUS NOT IN ('REFUNDED', 'CANCELLED')`;
        if (!this.options.cron.refund.auto) {
            query += ` AND PAYPALINVOICING = 'T'`;
        }
        query += ` AND WHENCREATED > '${this.options.startDate}'`;
        const invoices = await this.intacct.query(query);
        for (const invoice of invoices) {
            try {
                await this.refundInvoiceSync(invoice);
            } catch (err) {
                this.server.log("error", `refundInvoicesSync | ${err.message}`);
            }
        }
    }

    public async refundInvoiceSync(invoice: any) {
        const paypalInvoice = await this.paypal.invoice.get(invoice.PAYPALINVOICEID);
        const intacctInvoice: any = {
            PAYPALERROR: "",
        };
        if (paypalInvoice.model.payments) {
            for (const payment of paypalInvoice.model.payments) {
                try {
                    await this.paypal.sale.api.refund(payment.transaction_id);
                    this.server.log(["info", "paypal-intacct", "invoice", "refund"], invoice);
                } catch (err) {
                    intacctInvoice.PAYPALERROR += err.message;
                }
            }
        }

        await paypalInvoice.get();
        this.updateInacctInvoiceWithPayPalModel(intacctInvoice, paypalInvoice);
        await this.intacct.update(invoice.RECORDNO, intacctInvoice);
    }

    public async createInvoiceSync() {
        // TODO.  Do something about WHENCREATED
        // tslint:disable-next-line:max-line-length
        let query = process.env.INTACCT_INVOICE_CREATE_QUERY || `RAWSTATE = 'A' AND (PAYPALINVOICESTATUS IS NULL OR PAYPALINVOICESTATUS NOT IN ('CANCELLED')) AND TOTALDUE NOT IN (0)`;
        if (!this.options.cron.create.auto) {
            query += ` AND PAYPALINVOICING = 'T'`;
        }
        query += ` AND WHENCREATED > '${this.options.startDate}'`;

        const invoices = await Promise.all([
            this.intacct.query(query, ["RECORDNO", "RECORDID"]),
            this.paypal.invoice.search({ status: ["SENT", "UNPAID"] }),
        ]);

        for (const invoice of invoices[0]) {
            const intacctUpdate: any = {
                PAYPALERROR: "",
            };
            let paypalInvoice: InvoiceModel;
            try {
                paypalInvoice = await this.syncIntacctToPayPal(invoice);
            } catch (err) {
                intacctUpdate.PAYPALERROR = err.message.toString();
                this.server.log("error", err.toString());
            }

            try {
                await this.intacct.update(invoice.RECORDNO, this.updateInacctInvoiceWithPayPalModel(
                    intacctUpdate,
                    paypalInvoice,
                ));
            } catch (err) {
                this.server.log("error", err.toString());
            }

        }

        for (const invoice of invoices[1]) {
            try {
                await this.syncPayPalToIntacct(invoice);
            } catch (err) {
                // tslint:disable-next-line:max-line-length
                this.server.log("error", `syncPayPalToIntacct | Error: ${err.message}`);
            }
        }
    }

    public async syncIntacctToPayPal(invoice: any) {

        const invoices = await Promise.all([
            this.intacct.get(invoice.RECORDNO),
            this.paypal.invoice.search({ number: invoice.RECORDID }),
        ]);
        const intacctInvoice = invoices[0];
        let paypalInvoice = invoices[1][0];

        if (!paypalInvoice) {
            paypalInvoice = new this.paypal.invoice(this.toPaypalInvoice(intacctInvoice));
            await paypalInvoice.create();
            this.server.log(["info", "paypal-intacct", "invoice", "create"], paypalInvoice.model);
        } else {
            try {
                await paypalInvoice.update(this.toPaypalInvoice(intacctInvoice));
                this.server.log(["info", "paypal-intacct", "invoice", "update"], paypalInvoice.model);
            } catch (err) {
                if (err.message !== "Invalid Status") {
                    throw err;
                }
            }
        }

        try {
            await paypalInvoice.send();
            this.server.log(["info", "paypal-intacct", "invoice", "send"], paypalInvoice.model);
        } catch (err) {
            if (err.message !== "Invalid Status") {
                throw err;
            }
        }

        try {
            await this.createPayment(paypalInvoice.model);
        } catch (err) {
            if (err.message !== "Invalid Status") {
                throw err;
            }
        }

        return paypalInvoice;
    }

    public async syncPayPalToIntacct(invoice: InvoiceModel) {
        if (!invoice.model.reference) {
            await invoice.cancel();
            this.server.log(["info", "paypal-intacct", "invoice", "cancel"], invoice.model);
            return;
        }
        const intacctInvoice = await this.intacct.get(invoice.model.reference);
        if (!intacctInvoice) {
            await invoice.cancel();
            this.server.log(["info", "paypal-intacct", "invoice", "cancel"], invoice.model);
        } else {
            if (this.options.reminderDays) {
                const now = new Date();
                const lastSend = invoice.model.metadata.first_sent_date  || invoice.model.metadata.last_sent_date;
                const lastReminder = new Date(lastSend);
                const reminder = new Date(lastReminder.setDate(lastReminder.getDate() + this.options.reminderDays));

                if (now > reminder) {
                    await invoice.remind();
                    this.server.log(["info", "paypal-intacct", "invoice", "remind"], invoice.model);
                }
            }
        }
    }

    public toPaypalInvoice(intacctInvoice: any) {
        const paypalInvoice: Partial<IInvoice> = {
            billing_info: [{
                additional_info: intacctInvoice.CUSTOMERID,
                address: {
                    city: intacctInvoice.BILLTO.MAILADDRESS.CITY,
                    country_code: intacctInvoice.BILLTO.MAILADDRESS.COUNTRYCODE,
                    line1: intacctInvoice.BILLTO.MAILADDRESS.ADDRESS1,
                    line2: intacctInvoice.BILLTO.MAILADDRESS.ADDRESS2,
                    postal_code: intacctInvoice.BILLTO.MAILADDRESS.ZIP,
                    state: intacctInvoice.BILLTO.MAILADDRESS.STATE,
                },
                business_name: intacctInvoice.BILLTO.COMPANYNAME,
                email: intacctInvoice.BILLTO.EMAIL1,
                first_name: intacctInvoice.BILLTO.FIRSTNAME,
                last_name: intacctInvoice.BILLTO.LASTNAME,
                phone: {
                    country_code: intacctInvoice.BILLTO.PHONE1 ? "1" : undefined,
                    national_number: intacctInvoice.BILLTO.PHONE1,
                },
            }],
            items: this.toPayPalLineItems(intacctInvoice.ARINVOICEITEMS.arinvoiceitem),
            merchant_info: this.options.merchant,
            note: intacctInvoice.CUSTMESSAGE.MESSAGE,
            number: intacctInvoice.RECORDID,
            payment_term: {
                due_date: intacctInvoice.WHENDUE + " PDT",
                // term_type: intacctInvoice.TERMNAME,
            },
            reference: intacctInvoice.RECORDNO,
            shipping_info: {
                address: {
                    city: intacctInvoice.SHIPTO.MAILADDRESS.CITY,
                    country_code: intacctInvoice.SHIPTO.MAILADDRESS.COUNTRYCODE,
                    line1: intacctInvoice.SHIPTO.MAILADDRESS.ADDRESS1,
                    line2: intacctInvoice.SHIPTO.MAILADDRESS.ADDRESS2,
                    postal_code: intacctInvoice.SHIPTO.MAILADDRESS.ZIP,
                    state: intacctInvoice.SHIPTO.MAILADDRESS.STATE,
                },
                business_name: intacctInvoice.SHIPTO.CONTACTNAME,
                first_name: intacctInvoice.SHIPTO.FIRSTNAME,
                last_name: intacctInvoice.SHIPTO.LASTNAME,
            },
            tax_inclusive: true,
        };
        // Change "" to undefined
        return JSON.parse(JSON.stringify(paypalInvoice, (k, v) => ((v === "") ? undefined : v)));
    }

    public toPayPalLineItems(arrInvoiceItems: any) {

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

    public async init() {

        await Promise.all([this.validateKeys(), this.validateAccounts()]);

        if (this.options.cron.create && this.options.cron.create.latertext) {
            await this.createInvoiceSync();
            const timer = later.parse.text(this.options.cron.create.latertext);
            later.setInterval(this.createInvoiceSync.bind(this), timer);
            // tslint:disable-next-line:max-line-length
            this.server.log("info", `hapi-paypal-intacct::initInvoicing::create cron set for ${this.options.cron.create.latertext}.`);
        }

        if (this.options.cron.refund && this.options.cron.refund.latertext) {
            await this.refundInvoicesSync();
            const refundtimer = later.parse.text(this.options.cron.refund.latertext);
            later.setInterval(this.refundInvoicesSync.bind(this), refundtimer);
            // tslint:disable-next-line:max-line-length
            this.server.log("info", `hapi-paypal-intacct::initInvoicing::refund cron set for ${this.options.cron.refund.latertext}.`);
        }
    }

    public updateInacctInvoiceWithPayPalModel(intacctInvoice: any, paypalInvoice: InvoiceModel) {
        if (!paypalInvoice || !paypalInvoice.model) {
            return intacctInvoice;
        }
        intacctInvoice.PAYPALINVOICEID = paypalInvoice.model.id;
        intacctInvoice.PAYPALINVOICESTATUS = paypalInvoice.model.status;
        if (paypalInvoice.model.metadata) {
            intacctInvoice.PAYPALINVOICEURL = paypalInvoice.model.metadata.payer_view_url;
        }
        return intacctInvoice;
    }

}
