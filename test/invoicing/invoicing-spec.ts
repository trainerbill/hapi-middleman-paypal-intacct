import * as tape from "blue-tape";
import * as dotenv from "dotenv";
import * as glue from "glue";
import * as hapi from "hapi";
import {
    mockIntacctInvoicePosted,
    mockIntacctRefundedInvoice,
// tslint:disable-next-line:no-submodule-imports
} from "hapi-intacct/lib/mocks";
import * as later from "later";
import { PayPalRestApi } from "paypal-rest-api";
import * as sinon from "sinon";
import { manifest } from "../../example/server";
import * as index from "../../src";
import { hapiPayPalIntacctInvoicing, hapiPayPalIntacctInvoicingPlugin } from "../../src/glue/invoicing";

const realPaypal = new PayPalRestApi({
    client_id: "adsfasdfasdfasdf",
    client_secret: "asdfasdfasdf",
    mode: "sandbox",
});

tape("register method should", async (t) => {
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

tape("validateAccounts method", async (t) => {

    t.test("success should", async (st) => {
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
            t.pass("not throw an error");
        } catch (err) {
            t.fail(`${err.message}`);
        }
        sandbox.restore();
    });

    t.test("fail should", async (st) => {
        const sandbox = sinon.sandbox.create();
        const invoicing = new index.HapiPayPalIntacctInvoicing();
        invoicing.options = hapiPayPalIntacctInvoicingPlugin.options;
        const intacctMock = sandbox.mock(invoicing.intacct)
            .expects("listAccounts")
            .once()
            .returns([]);

        try {
            await invoicing.validateAccounts();
            t.fail("throw an error");
        } catch (err) {
            t.pass("throw an error");
        }
        sandbox.restore();
    });
});

tape("validateKeys method", async (t) => {

    t.test("success should", async (st) => {
        const sandbox = sinon.sandbox.create();
        const invoicing = new index.HapiPayPalIntacctInvoicing();
        const nextStub = sandbox.stub();
        const intacctMock = sandbox.mock(invoicing.intacct)
            .expects("inspect")
            .once()
            .returns(Object.keys(index.intacctInvoiceExtend));

        try {
            invoicing.validateKeys();
            t.pass("not throw an error");
        } catch (err) {
            t.fail(`${err.message}`);
        }
        sandbox.restore();
    });

    t.test("fail should", async (st) => {
        const sandbox = sinon.sandbox.create();
        const invoicing = new index.HapiPayPalIntacctInvoicing();
        const nextStub = sandbox.stub();
        const intacctMock = sandbox.mock(invoicing.intacct)
            .expects("inspect")
            .once()
            .returns([]);

        try {
            await invoicing.validateKeys();
            t.fail("throw an error");
        } catch (err) {
            t.pass("throw an error");
        }
        sandbox.restore();
    });
});

/*

const realPaypal = new paypal.PayPalRestApi({
    client_id: "asdfsadfasfasfasdf",
    client_secret: "asdfasdfasdfasdfasdfasdfasf",
    mode: "sandbox",
});

const createInvoice = { ...mockIntacctInvoicePosted, ...{ RECORDNO: "createinvoice" } };
const createInvoiceWithNoSend = {
    ...mockIntacctInvoicePosted,
    ...{ RECORDNO: "createinvoice2", PAYPALINVOICEID: "testy", PAYPALINVOICESTATUS: "DRAFT" },
};
const refundInvoice = { ...mockIntacctRefundedInvoice, ...{ RECORDNO: "refundinvoice" } };
const intacctCreateInvoices = [ createInvoice, createInvoiceWithNoSend ];

const paypalDraftInvoice = { ...paypal.mockPayPalInvoiceDraft };
const paypalSentInvoice = { ...paypal.mockPayPalInvoiceSent };
const paypalSentInvoiceForCancel = { ...paypal.mockPayPalInvoiceSent, ...{ number: "cancelme" } };
const paypalSentInvoiceForRemind = { ...paypal.mockPayPalInvoiceSent, ...{ number: "remindme" } };

// Models
const paypalSentInvoiceForCancelModel = new realPaypal.invoice(paypalSentInvoiceForCancel);
const paypalDraftInvoiceModel = new realPaypal.invoice(paypalDraftInvoice);
const paypalSentInvoiceForRemindModel = new realPaypal.invoice(paypalSentInvoiceForRemind);

tape("register with create job should", async (t) => {
    try {
        const plugin = { ...hapiPayPalIntacctInvoicingPlugin };
        // Remove Refund Jobs
        plugin.options.cron = {
            create: {
                latertext: "every 1 hour",
            },
        };
        const sandbox = sinon.sandbox.create();

        // Mocks
        const sentInvoiceMock = sandbox.mock(paypalSentInvoiceForCancelModel);
        const draftInvoiceMock = sandbox.mock(paypalDraftInvoiceModel);
        const remindInvoiceMock = sandbox.mock(paypalSentInvoiceForRemindModel);

        const intacctMock = sandbox.mock(hapiPayPalIntacctInvoicing.intacct);
        intacctMock
            .expects("inspect")
            .once()
            .returns(Promise.resolve(Object.keys(index.intacctInvoiceExtend)));
        intacctMock
            .expects("query")
            .twice()
            .onFirstCall()
            .returns(Promise.resolve(intacctCreateInvoices))
            .onSecondCall()
            .returns(Promise.resolve([mockIntacctRefundedInvoice]));
        intacctMock
            .expects("listAccounts")
            .once()
            .returns(Promise.resolve([{
                BANKACCOUNTID: "DefaultAccount",
            }, {
                BANKACCOUNTID: "USDAccount",
            }]));
        intacctMock
            .expects("get")
            .withArgs(createInvoice.RECORDNO)
            .returns(Promise.resolve(createInvoice))
            .withArgs(createInvoiceWithNoSend.RECORDNO)
            .returns(Promise.resolve(createInvoiceWithNoSend.RECORDNO))
            .withArgs(paypalSentInvoiceForCancel.number)
            .returns(Promise.resolve({}))
            .withArgs(paypalSentInvoiceForRemind.number)
            .returns(Promise.resolve(paypalSentInvoice));
        intacctMock
            .expects("update")
            .once()
            .onFirstCall()
            .returns(Promise.resolve());

        const invoiceInstance = sinon.createStubInstance(realPaypal.invoice);
        const paypalInvoiceMock = sandbox.mock(realPaypal.invoice);
        paypalInvoiceMock
            .expects("search")
            .withArgs({ number: createInvoice.RECORDNO })
            .returns(Promise.resolve([]))
            .withArgs({ number: createInvoiceWithNoSend.RECORDNO })
            .returns(Promise.resolve([draftInvoiceMock]))
            .withArgs({ status: ["SENT", "UNPAID"] })
            .returns(Promise.resolve([ sentInvoiceMock, remindInvoiceMock]));

        paypalInvoiceMock
            .expects("create")
            .once()
            .returns(Promise.resolve());
        paypalInvoiceMock
            .expects("send")
            .once()
            .returns(Promise.resolve());
        paypalInvoiceMock
            .expects("get")
            .once()
            .returns(Promise.resolve());

        const server = new hapi.Server();
        // tslint:disable-next-line:max-line-length
        server.connection({ port: process.env.PORT || 3000, host: process.env.IP || "0.0.0.0", labels: "private" });
        await server.register(plugin);

        t.pass("complete successfully");
        sandbox.restore();
    } catch (err) {
        t.fail("not fail");
    }
});
*/
