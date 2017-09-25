import * as tape from "blue-tape";
import * as hapi from "hapi";
import { mockPayPalInvoiceDraft, PayPalRestApi } from "paypal-rest-api";
import * as sinon from "sinon";
import * as index from "../../src";
import { hapiPayPalIntacctInvoicingPlugin } from "../../src/glue/invoicing";
import { cadPaidEvent, paidEvent } from "./mocks";

const realPaypal = new PayPalRestApi({
    client_id: "adsfasdfasdfasdf",
    client_secret: "asdfasdfasdf",
    mode: "sandbox",
});

tape("validateAccounts failure", async (t) => {
    const sandbox = sinon.sandbox.create();
    const invoicing = new index.HapiPayPalIntacctInvoicing();
    invoicing.options = hapiPayPalIntacctInvoicingPlugin.options;

    t.test("api error should", async (st) => {
        const error = {
            error: "sure",
        };
        const intacctStub = sandbox.stub(invoicing.intacct, "listAccounts").rejects(error);
        try {
            const response = await invoicing.validateAccounts();
        } catch (err) {
            st.pass("throw an error");
            st.equal(err === error, true, "throw the api error");
        }
        sandbox.restore();
    });

    t.test("configuration failure should", async (st) => {
        const error = {
            error: "sure",
        };
        const intacctStub = sandbox.stub(invoicing.intacct, "listAccounts").resolves([{BANKACCOUNTID: "TEST"}]);
        try {
            const response = await invoicing.validateAccounts();
        } catch (err) {
            st.pass("throw an error");
            // tslint:disable-next-line:max-line-length
            st.equal(err.message, "Intacct Payment Account DefaultAccount configured but does not exist in Intacct", "throw the config error");
        }
        sandbox.restore();
    });

});

tape("validateKeys method failure", async (t) => {
    const sandbox = sinon.sandbox.create();
    const invoicing = new index.HapiPayPalIntacctInvoicing();

    t.test("api error should", async (st) => {
        const error = {
            error: "sure",
        };
        const intacctStub = sandbox.stub(invoicing.intacct, "inspect").rejects(error);
        try {
            const response = await invoicing.validateKeys();
        } catch (err) {
            st.equal(err === error, true, "throw the api error");
        }
        sandbox.restore();
    });

    t.test("account configuration error should", async (st) => {
        const intacctStub = sandbox.stub(invoicing.intacct, "inspect").resolves([]);
        try {
            const response = await invoicing.validateKeys();
        } catch (err) {
            // tslint:disable-next-line:max-line-length
            st.equal(err.message, "PAYPALERROR not defined.  Add the key to the Intacct Invoice object.", "throw the configuration error");
        }
        sandbox.restore();
    });
});

tape("invoice paid event failure", async (t) => {

    const sandbox = sinon.sandbox.create();
    const invoicing = new index.HapiPayPalIntacctInvoicing();
    invoicing.options = hapiPayPalIntacctInvoicingPlugin.options;
    const event = {
        ...paidEvent,
    };
    // tslint:disable
    const payment = {
        customerid: event.resource.invoice.billing_info[0].additional_info,
        paymentamount: event.resource.invoice.total_amount.value,
        bankaccountid: hapiPayPalIntacctInvoicingPlugin.options.paymentaccounts.currencies.USD,
        refid: event.resource.invoice.payments[event.resource.invoice.payments.length - 1].transaction_id,
        arpaymentitem: [{
            amount: event.resource.invoice.total_amount.value,
            invoicekey: event.resource.invoice.reference,
        }],
    };
    // tslint:enable

    t.test("non BL03000130 error should", async (st) => {
        const error = [{
            errorno: "realerror",
            message: "my message!",
        }];
        const intacctCreatePaymentStub = sandbox.stub(invoicing.intacct, "createPayment")
        .rejects({
            message: JSON.stringify(error),
        });
        const intacctUpdateStub = sandbox.stub(invoicing.intacct, "update")
            .withArgs(event.resource.invoice.reference, {
                PAYPALERROR: JSON.stringify(error),
                PAYPALINVOICESTATUS: event.resource.invoice.status,
            })
            .resolves();

        await invoicing.webhookHandler(event);
        st.equal(intacctUpdateStub.calledOnce, true, "update intacct with the error.");
        sandbox.restore();
    });

    t.test("BL03000130 error should", async (st) => {
        const error = [{
            errorno: "BL03000130",
            message: "my message!",
        }];
        const intacctCreatePaymentStub = sandbox.stub(invoicing.intacct, "createPayment")
        .rejects({
            message: JSON.stringify(error),
        });
        const intacctUpdateStub = sandbox.stub(invoicing.intacct, "update")
            .withArgs(event.resource.invoice.reference, {
                PAYPALERROR: "",
                PAYPALINVOICESTATUS: event.resource.invoice.status,
            })
            .resolves();

        await invoicing.webhookHandler(event);
        st.equal(intacctUpdateStub.calledOnce, true, "update intacct with the error.");
        sandbox.restore();
    });
    /*
    t.test("payment currency account configuration error should", async (st) => {
        try {
            await invoicing.webhookHandler(cadPaidEvent);
        } catch (err) {
            // tslint:disable-next-line:max-line-length
            st.equal(err.message, "CAD currency payment account not configured", "throw an error that currency account is not setup.");
        }
        sandbox.restore();
    });
    */
});

tape("createInvoiceSync method failure should", async (t) => {
    const sandbox = sinon.sandbox.create();
    const invoicing = new index.HapiPayPalIntacctInvoicing();
    const invoice = new realPaypal.invoice(mockPayPalInvoiceDraft);
    invoicing.paypal = realPaypal;
    invoicing.options = hapiPayPalIntacctInvoicingPlugin.options;
    invoicing.server = new hapi.Server();

    process.env.INTACCT_INVOICE_CREATE_QUERY = "testy";
    // Stubs
    const logStub = sandbox.stub(invoicing.server, "log");
    const intacctInvoices = [{ RECORDNO: "id" }, { RECORDNO: "id1"}];
    const intacctQueryStub = sandbox.stub(invoicing.intacct, "query")
        .resolves(intacctInvoices);
    const paypalInvoices = [{ test: "id" }, { test: "id1"}];
    const paypalSearchStub = sandbox.stub(realPaypal.invoice, "search")
        .resolves(paypalInvoices);
    const invoicingStub1 = sandbox.stub(invoicing, "syncIntacctToPayPal")
        .onFirstCall()
        .rejects()
        .onSecondCall()
        .resolves(invoice);
    const invoicingStub2 = sandbox.stub(invoicing, "syncPayPalToIntacct")
        .onFirstCall()
        .rejects()
        .onSecondCall()
        .resolves();
    const intacctUpdateStub = sandbox.stub(invoicing.intacct, "update")
        .resolves();

    try {
        await invoicing.createInvoiceSync();
        t.equal(invoicingStub1.calledTwice, true, "call syncIntacctToPayPal for all invoices");
        t.equal(invoicingStub2.calledTwice, true, "call syncPayPalToIntacct for all invoices");
        t.equal(intacctUpdateStub.calledWith(intacctInvoices[0].RECORDNO, sinon.match({
            PAYPALERROR: "Error",
        })), true, "call intacct update with first invoice and error");
    } catch (err) {
        t.fail(`not throw error: ${err.message}`);
    }
    sandbox.restore();
});

tape("refundInvoicesSync method failure should", async (t) => {
    const sandbox = sinon.sandbox.create();
    const invoicing = new index.HapiPayPalIntacctInvoicing();
    invoicing.options = hapiPayPalIntacctInvoicingPlugin.options;
    invoicing.server = new hapi.Server();
    const intacctInvoices = [{ id: "test" }, { id: "ok" }];

    // Stubs
    const logStub = sandbox.stub(invoicing.server, "log");
    const intacctStub = sandbox.stub(invoicing.intacct, "query")
        .resolves(intacctInvoices);
    const refundStub = sandbox.stub(invoicing, "refundInvoiceSync")
        .onFirstCall()
        .rejects()
        .onSecondCall()
        .resolves();
    try {
        await invoicing.refundInvoicesSync();
        t.equal(refundStub.calledTwice, true, "call refundInvoiceSync twice");
        t.equal(logStub.calledOnce, true, "call server log once");
    } catch (err) {
        t.fail(`should not throw error: ${err.message}`);
    }
    sandbox.restore();
});
