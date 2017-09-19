import * as tape from "blue-tape";
import * as hapi from "hapi";
import {
    mockIntacctInvoicePosted,
    mockIntacctRefundedInvoice,
// tslint:disable-next-line:no-submodule-imports
} from "hapi-intacct/lib/mocks";
import * as later from "later";
import {
    mockPayPalInvoiceDraft,
    mockPaypalInvoicePaid,
    mockPayPalInvoiceRefunded,
    mockPayPalInvoiceSent,
    PayPalRestApi,
} from "paypal-rest-api";
import * as sinon from "sinon";
import * as index from "../../src";
import { hapiPayPalIntacctInvoicingPlugin } from "../../src/glue/invoicing";
import { cancelEvent, paidEvent, refundEvent } from "./mocks";

const realPaypal = new PayPalRestApi({
    client_id: "adsfasdfasdfasdf",
    client_secret: "asdfasdfasdf",
    mode: "sandbox",
});

tape("register method success should", async (t) => {
    const sandbox = sinon.sandbox.create();
    const invoicing = new index.HapiPayPalIntacctInvoicing();
    const initStub = sandbox.stub(invoicing, "init").resolves();
    const server = new hapi.Server();
    server.plugins = {
        "hapi-paypal": {
            paypal: realPaypal,
        },
    };
    const nextStub = sinon.stub();
    await invoicing.register(server, hapiPayPalIntacctInvoicingPlugin.options, nextStub);

    t.equal(nextStub.called, true, "call hapi continuation function.");
    t.equal(invoicing.paypal, realPaypal, "set paypal sdk");
    t.equal(invoicing.intacct instanceof index.HapiIntacctInvoicing, true, "set intacct class");
    t.equal(invoicing.server === server, true, "set hapi server");
    sandbox.restore();
});

tape("validateAccounts method success should", async (st) => {
    const sandbox = sinon.sandbox.create();
    const invoicing = new index.HapiPayPalIntacctInvoicing();
    invoicing.options = hapiPayPalIntacctInvoicingPlugin.options;
    const intacctMock = sandbox.mock(invoicing.intacct)
        .expects("listAccounts")
        .once()
        .returns([{
            BANKACCOUNTID: "DefaultAccount",
        },
        {
            BANKACCOUNTID: "USDAccount",
        }]);

    try {
        await invoicing.validateAccounts();
        st.pass("not throw an error");
    } catch (err) {
        st.fail(`${err.message}`);
    }
    sandbox.restore();
});

tape("validateKeys method success should", async (st) => {
    const sandbox = sinon.sandbox.create();
    const invoicing = new index.HapiPayPalIntacctInvoicing();
    const intacctMock = sandbox.mock(invoicing.intacct)
        .expects("inspect")
        .once()
        .returns(Object.keys(index.intacctInvoiceExtend));

    try {
        invoicing.validateKeys();
        st.pass("not throw an errorpaypal");
    } catch (err) {
        st.fail(`${err.message}`);
    }
    sandbox.restore();
});

tape("webhookHandler method success", async (t) => {
    const sandbox = sinon.sandbox.create();
    const invoicing = new index.HapiPayPalIntacctInvoicing();

    t.test("invoice refund event success should", async (st) => {
        const event = {
            ...refundEvent,
        };
        const intacctStub = sandbox.stub(invoicing.intacct, "update")
            .withArgs(event.resource.invoice.number, {
                PAYPALERROR: "",
                PAYPALINVOICESTATUS: event.resource.invoice.status,
            })
            .resolves();

        await invoicing.webhookHandler(event);
        st.equal(intacctStub.calledOnce, true, "call intacct update with proper arguments");
        sandbox.restore();
    });

    t.test("invoice cancelled event success should", async (st) => {
        const event = {
            ...cancelEvent,
        };
        const intacctStub = sandbox.stub(invoicing.intacct, "update")
            .withArgs(event.resource.invoice.number, {
                PAYPALERROR: "",
                PAYPALINVOICESTATUS: event.resource.invoice.status,
            })
            .resolves();

        await invoicing.webhookHandler(event);
        st.equal(intacctStub.calledOnce, true, "call intacct update with proper arguments");
        sandbox.restore();
    });

    t.test("invoice paid event should", async (st) => {
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
                invoicekey: event.resource.invoice.number,
            }],
        };
        // tslint:enable
        const intacctCreatePaymentStub = sandbox.stub(invoicing.intacct, "createPayment")
            .withArgs(payment)
            .resolves();

        const intacctUpdateStub = sandbox.stub(invoicing.intacct, "update")
            .withArgs(event.resource.invoice.number, {
                PAYPALERROR: "",
                PAYPALINVOICESTATUS: event.resource.invoice.status,
            })
            .resolves();
        // tslint:enable
        await invoicing.webhookHandler(event);
        st.equal(intacctCreatePaymentStub.calledOnce, true, "call intacct createPayment with proper arguments");
        st.equal(intacctUpdateStub.calledOnce, true, "call intacct update with proper arguments");
        sandbox.restore();
    });
});

tape("refundInvoicesSync method success should", async (t) => {
    const sandbox = sinon.sandbox.create();
    const invoicing = new index.HapiPayPalIntacctInvoicing();
    const intacctStub = sandbox.stub(invoicing.intacct, "query")
        .withArgs(sinon.match.string)
        .resolves([mockIntacctRefundedInvoice]);
    const refundStub = sandbox.stub(invoicing, "refundInvoiceSync").resolves();
    await invoicing.refundInvoicesSync();
    t.equal(intacctStub.calledOnce, true, "call intacct query with query");
    t.equal(refundStub.calledOnce, true, "call refundInvoiceSync once");
    sandbox.restore();
});

tape("refundInvoiceSync method success should", async (t) => {
    const sandbox = sinon.sandbox.create();
    const invoicing = new index.HapiPayPalIntacctInvoicing();
    invoicing.paypal = realPaypal;
    const invoice = new realPaypal.invoice(mockPaypalInvoicePaid);
    const invoiceStub = sandbox.stub(invoice, "get").resolves();
    // tslint:disable-next-line:max-line-length
    const paypalInvoiceGetStub = sandbox.stub(realPaypal.invoice, "get")
        .withArgs(mockIntacctRefundedInvoice.PAYPALINVOICEID)
        .resolves(invoice);
    const paypalPaymentRefundStub = sandbox.stub(realPaypal.sale.api, "refund")
        .withArgs(invoice.model.payments[0].transaction_id)
        .resolves();
    const intacctStub = sandbox.stub(invoicing.intacct, "update")
        .withArgs(
            mockIntacctRefundedInvoice.RECORDNO,
            {
                ...invoicing.updateInacctInvoiceWithPayPalModel({}, invoice),
                PAYPALERROR: "",
            },
        )
        .resolves();
    await invoicing.refundInvoiceSync(mockIntacctRefundedInvoice);

    t.equal(paypalInvoiceGetStub.calledOnce, true, "call paypal.invoice.get with intacct PAYPALINVOICEID");
    t.equal(paypalPaymentRefundStub.calledOnce, true, "call paypal.invoice.api.refund with intacct RECORDNO");
    t.equal(invoiceStub.calledOnce, true, "call invoice.get to update model");
    t.equal(intacctStub.calledOnce, true, "call intacct update with proper arguments");
    sandbox.restore();
});

tape("createInvoiceSync method success should", async (t) => {
    const sandbox = sinon.sandbox.create();
    const invoicing = new index.HapiPayPalIntacctInvoicing();
    invoicing.paypal = realPaypal;
    invoicing.options = hapiPayPalIntacctInvoicingPlugin.options;
    process.env.INTACCT_INVOICE_CREATE_QUERY = "testy";
    const invoice = new realPaypal.invoice(mockPayPalInvoiceSent);
    // Stubs
    const intacctInvoices = [{ RECORDNO: "id" }, { RECORDNO: "id1"}];
    const intacctQueryStub = sandbox.stub(invoicing.intacct, "query")
        .withArgs(process.env.INTACCT_INVOICE_CREATE_QUERY, ["RECORDNO"])
        .resolves(intacctInvoices);
    const paypalInvoices = [{ id: "paypalid" }, { id: "paypalid1"}];
    const paypalSearchStub = sandbox.stub(realPaypal.invoice, "search")
        .withArgs({ status: ["SENT", "UNPAID"] })
        .resolves(paypalInvoices);
    const invoicingStub1 = sandbox.stub(invoicing, "syncIntacctToPayPal")
        .resolves(invoice);
    const invoicingStub2 = sandbox.stub(invoicing, "syncPayPalToIntacct")
        .resolves();
    const intacctUpdateStub = sandbox.stub(invoicing.intacct, "update")
        .resolves();

    await invoicing.createInvoiceSync();

    t.equal(intacctQueryStub.calledOnce, true, "call intacct query with proper arguments");
    t.equal(paypalSearchStub.calledOnce, true, "call paypal search with proper arguments");
    t.equal(invoicingStub1.calledTwice, true, "call syncIntacctToPayPal twice");
    t.equal(invoicingStub1.args[0][0], intacctInvoices[0], "call syncIntacctToPayPal with first intacct invoice");
    t.equal(invoicingStub1.args[1][0], intacctInvoices[1], "call syncIntacctToPayPal with second intacct invoice");
    t.equal(invoicingStub2.args[0][0], paypalInvoices[0], "call syncPayPalToIntacct with first paypal invoice");
    t.equal(invoicingStub2.args[1][0], paypalInvoices[1], "call syncPayPalToIntacct with second paypal invoice");
    t.equal(intacctUpdateStub.calledTwice, true, "call intacct update twice");
    t.equal(intacctUpdateStub.calledWith(intacctInvoices[0].RECORDNO, {
        PAYPALERROR: "",
        PAYPALINVOICEID: invoice.model.id,
        PAYPALINVOICESTATUS: invoice.model.status,
        PAYPALINVOICEURL: invoice.model.metadata.payer_view_url,
    }), true, "call intacct update with first invoice");
    t.equal(intacctUpdateStub.calledWith(intacctInvoices[1].RECORDNO, {
        PAYPALERROR: "",
        PAYPALINVOICEID: invoice.model.id,
        PAYPALINVOICESTATUS: invoice.model.status,
        PAYPALINVOICEURL: invoice.model.metadata.payer_view_url,
    }), true, "call intacct update with second invoice");
    sandbox.restore();
});

tape("syncIntacctToPayPal method success", async (t) => {
    const sandbox = sinon.sandbox.create();
    const invoicing = new index.HapiPayPalIntacctInvoicing();
    invoicing.paypal = realPaypal;
    invoicing.options = hapiPayPalIntacctInvoicingPlugin.options;

    t.test("with no paypal invoice id should", async (st) => {

        const intacctGetStub = sandbox.stub(invoicing.intacct, "get")
            .withArgs(mockIntacctInvoicePosted.RECORDNO)
            .resolves(mockIntacctInvoicePosted);

        const paypalSearchStub = sandbox.stub(invoicing.paypal.invoice, "search")
            .withArgs({ number: mockIntacctInvoicePosted.RECORDNO })
            .resolves([]);

        const paypalCreateStub = sandbox.stub(invoicing.paypal.invoice.prototype, "create")
            .resolves();

        await invoicing.syncIntacctToPayPal(mockIntacctInvoicePosted);

        st.equal(intacctGetStub.calledOnce, true, "call intacct get with proper arguments");
        st.equal(paypalSearchStub.calledOnce, true, "call paypal search with proper arguments");
        st.equal(paypalCreateStub.calledOnce, true, "call create on paypal invoice model");
        sandbox.restore();
    });

    t.test("with paypal invoice id and status draft should", async (st) => {
        const invoice = new realPaypal.invoice(mockPayPalInvoiceDraft);
        const intacctGetStub = sandbox.stub(invoicing.intacct, "get")
            .withArgs(mockIntacctInvoicePosted.RECORDNO)
            .resolves({
                ...mockIntacctInvoicePosted,
                ...{
                    PAYPALINVOICEID: "testid",
                },
            });

        const paypalSearchStub = sandbox.stub(invoicing.paypal.invoice, "search")
            .withArgs({ number: mockIntacctInvoicePosted.RECORDNO })
            .resolves([invoice]);

        const paypalUpdateStub = sandbox.stub(invoicing.paypal.invoice.prototype, "update")
            .resolves();
        const paypalSendStub = sandbox.stub(invoicing.paypal.invoice.prototype, "send")
            .resolves();

        await invoicing.syncIntacctToPayPal(mockIntacctInvoicePosted);

        st.equal(intacctGetStub.calledOnce, true, "call intacct get with proper arguments");
        st.equal(paypalSearchStub.calledOnce, true, "call paypal search with proper arguments");
        st.equal(paypalUpdateStub.calledOnce, true, "call update on paypal invoice model");
        st.equal(paypalSendStub.calledOnce, true, "call send on paypal invoice model");
        sandbox.restore();
    });

});

tape("syncPayPalToIntacct method success", async (t) => {
    const sandbox = sinon.sandbox.create();
    const invoicing = new index.HapiPayPalIntacctInvoicing();
    invoicing.paypal = realPaypal;
    invoicing.options = hapiPayPalIntacctInvoicingPlugin.options;

    t.test("reminder should", async (st) => {
        const invoiceModel = new realPaypal.invoice(mockPayPalInvoiceSent);
        // Stubs
        const remindStub = sandbox.stub(invoiceModel, "remind").resolves();
        const intacctStub = sandbox.stub(invoicing.intacct, "get").resolves({ RECORDNO: "TEST" });
        await invoicing.syncPayPalToIntacct(invoiceModel);
        st.equal(intacctStub.calledWith(invoiceModel.model.number), true, "call intacct get with invoice RECORDNO");
        st.equal(remindStub.calledOnce, true, "call models remind method");
        sandbox.restore();
    });

    t.test("already reminded should", async (st) => {
        const invoice = {
            ...mockPayPalInvoiceSent,
            ...{
                metadata: {
                    last_sent_date: "Tue Sep 19 2050 10:09:23 GMT-0500 (Central Daylight Time)",
                },
            },
        };
        const invoiceModel = new realPaypal.invoice(invoice);
        // Stubs
        const remindStub = sandbox.stub(invoiceModel, "remind").resolves();
        const intacctStub = sandbox.stub(invoicing.intacct, "get").resolves({ RECORDNO: "TEST" });
        await invoicing.syncPayPalToIntacct(invoiceModel);
        st.equal(intacctStub.calledWith(invoiceModel.model.number), true, "call intacct get with invoice RECORDNO");
        st.equal(remindStub.called, false, "not call models remind method");
        sandbox.restore();
    });

    t.test("cancel should", async (st) => {
        const invoiceModel = new realPaypal.invoice(mockPayPalInvoiceSent);
        // Stubs
        const cancelStub = sandbox.stub(invoiceModel, "cancel").resolves();
        const intacctStub = sandbox.stub(invoicing.intacct, "get").resolves();
        await invoicing.syncPayPalToIntacct(invoiceModel);
        st.equal(intacctStub.calledWith(invoiceModel.model.number), true, "call intacct get with invoice RECORDNO");
        st.equal(cancelStub.calledOnce, true, "call models cancel method");
        sandbox.restore();
    });

});

tape("init method success", async (t) => {
    const sandbox = sinon.sandbox.create();
    const invoicing = new index.HapiPayPalIntacctInvoicing();
    invoicing.options = hapiPayPalIntacctInvoicingPlugin.options;
    invoicing.server = new hapi.Server();

    t.test("with all options should", async (st) => {
        // Stubs
        const validateAccountsStub = sandbox.stub(invoicing, "validateAccounts").resolves();
        const validateKeysStub = sandbox.stub(invoicing, "validateKeys").resolves();
        const laterStub = sandbox.stub(later, "setInterval");
        const createInvoiceSyncStub = sandbox.stub(invoicing, "createInvoiceSync").resolves();
        const refundInvoicesSyncStub = sandbox.stub(invoicing, "refundInvoicesSync").resolves();

        await invoicing.init();

        st.equal(validateAccountsStub.calledOnce, true, "call validateAccounts");
        st.equal(validateAccountsStub.calledOnce, true, "call validateKeys");
        // tslint:disable-next-line:max-line-length
        st.equal(laterStub.calledTwice, true, "call later.setInterval twice");
        st.equal(createInvoiceSyncStub.calledOnce, true, "call createInvoiceSync");
        st.equal(createInvoiceSyncStub.calledOnce, true, "call refundInvoicesSync");
        sandbox.restore();
    });

});
