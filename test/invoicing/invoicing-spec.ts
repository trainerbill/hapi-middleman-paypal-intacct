import * as tape from "blue-tape";
import * as dotenv from "dotenv";
import * as hapi from "hapi";
import * as paypalMocks from "hapi-paypal/lib/mocks";
import * as later from "later";
import * as sinon from "sinon";
import * as index from "../../src";
import { hapiPayPalIntacctInvoicing, hapiPayPalIntacctPlugin } from "../../src/glue/invoicing";
import * as intacctMocks from "../../src/mocks";

const createInvoice = { ...intacctMocks.mockIntacctInvoicePosted, ...{ RECORDNO: "createinvoice" } };
const createInvoiceWithNoSend = {
    ...intacctMocks.mockIntacctInvoicePosted,
    ...{ RECORDNO: "createinvoice2", PAYPALINVOICEID: "testy", PAYPALINVOICESTATUS: "DRAFT" },
};
const refundInvoice = { ...intacctMocks.mockIntacctInvoiceRefunded, ...{ RECORDNO: "refundinvoice" } };
const intacctCreateInvoices = [ createInvoice, createInvoiceWithNoSend ];

const paypalDraftInvoice = { ...paypalMocks.mockPayPalInvoiceDraft };
const paypalSentInvoice = { ...paypalMocks.mockPayPalInvoiceSent };
const paypalSentInvoiceForCancel = { ...paypalMocks.mockPayPalInvoiceSent, ...{ number: "cancelme" } };
const paypalSentInvoiceForRemind = { ...paypalMocks.mockPayPalInvoiceSent, ...{ number: "remindme" } };

tape("register with create job should", async (t) => {
    try {
        const plugin = { ...hapiPayPalIntacctPlugin };
        // Remove Refund Jobs
        plugin.options.cron = {
            create: {
                latertext: "every 1 hour",
            },
        };
        const sandbox = sinon.sandbox.create();

        // Mocks
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
            .returns(Promise.resolve([intacctMocks.mockIntacctInvoiceRefunded]));
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

        const paypalMock = sandbox.mock(hapiPayPalIntacctInvoicing.paypal);
        paypalMock
            .expects("search")
            .withArgs({ number: createInvoice.RECORDNO })
            .returns(Promise.resolve([]))
            .withArgs({ number: createInvoiceWithNoSend.RECORDNO })
            .returns(Promise.resolve([paypalDraftInvoice]))
            .withArgs({ status: ["SENT", "UNPAID"] })
            .returns(Promise.resolve([ paypalSentInvoiceForCancel, paypalSentInvoiceForRemind ]));

        paypalMock
            .expects("create")
            .once()
            .returns(Promise.resolve(paypalMocks.mockPayPalInvoiceDraft));
        paypalMock
            .expects("send")
            .once()
            .returns(Promise.resolve({}));
        paypalMock
            .expects("get")
            .once()
            .returns(Promise.resolve(paypalMocks.mockPayPalInvoiceSent));

        // Stubs
        /*
        const intacctInspectStub = sandbox.stub(hapiPayPalIntacctInvoicing.intacct, "inspect")
                                    .returns(Promise.resolve(hapiPayPalIntacctInvoicing.getIntacctInvoiceKeys()));
        const intacctQueryStub = sandbox.stub(hapiPayPalIntacctInvoicing.intacct, "query")
                                    .returns(Promise.resolve([mockIntacctInvoice]));
        const paypalSearchStub = sandbox.stub(hapiPayPalIntacctInvoicing.paypal, "search")
                                    .returns(Promise.resolve([mockPayPalInvoice]));
        const intacctAccountStub = sandbox.stub(hapiPayPalIntacctInvoicing.intacct, "listAccounts")
                                    .returns(Promise.resolve([{
                                        BANKACCOUNTID: "DefaultAccount",
                                    }, {
                                        BANKACCOUNTID: "USDAccount",
                                    }]));
        */
        const laterStub = sandbox.stub(later, "setInterval");
        // End stubs
        const server = new hapi.Server();
        // tslint:disable-next-line:max-line-length
        server.connection({ port: process.env.PORT || 3000, host: process.env.IP || "0.0.0.0", labels: "paypal-intacct-private" });
        await server.register(plugin);
        t.pass("complete successfully");
        sandbox.restore();
    } catch (err) {
        t.fail("not fail");
    }
});
