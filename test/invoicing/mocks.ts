import { mockInvoiceWebhookEvent } from "paypal-rest-api";

export const paidEvent = {
    ...mockInvoiceWebhookEvent,
    ...{
        event_type: "INVOICING.INVOICE.PAID",
        resource: {
            invoice: {
                billing_info: [{
                    additional_info: "CUSTID",
                }],
                number: "1776",
                payments: [{
                    transaction_id: "transactionid",
                }],
                status: "PAID",
                total_amount: {
                    currency: "USD",
                    value: "10.00",
                },
            },
        },
    },
};

export const cadPaidEvent = {
    ...paidEvent,
    resource: {
        invoice: {
            total_amount: {
                currency: "CAD",
                value: "10.00",
            },
        },
    },
};

export const refundEvent = {
    ...mockInvoiceWebhookEvent,
    ...{
        event_type: "INVOICING.INVOICE.REFUNDED",
        resource: {
            invoice: {
                number: "1776",
                status: "REFUNDED",
            },
        },
    },
};

export const cancelEvent = {
    ...mockInvoiceWebhookEvent,
    ...{
        event_type: "INVOICING.INVOICE.CANCELLED",
        resource: {
            invoice: {
                number: "1776",
                status: "CANCELLED",
            },
        },
    },
};
