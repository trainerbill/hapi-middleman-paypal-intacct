


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
