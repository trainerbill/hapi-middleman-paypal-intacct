import * as hapi from "hapi";
import { intacctPaymentSchema } from "hapi-intacct/lib/joi";
import * as joi from "joi";
import * as later from "later";

export class HapiIntacctInvoicing {

    private server: hapi.Server;
    private requiredRoutes: string[];

    // constructor() {}

    public setServer(server: hapi.Server) {
        this.server = server;
    }

    public async query(query: string, fields?: string[]) {
        let url = `/intacct/invoice?query=${encodeURIComponent(query)}`;
        if (fields) {
            url += `&fields=${fields.join(",")}`;
        }
        const res = await this.server.inject({
            allowInternals: true,
            method: "GET",
            url,
        });

        if (res.statusCode !== 200) {
            throw new Error((res.result as any).message);
        }
        return (res.result as any);
    }

    public async get(id: string) {
        const get = await this.server.inject({
            allowInternals: true,
            method: "GET",
            url: `/intacct/invoice/${id}`,
        });
        if (get.statusCode !== 200) {
            throw new Error((get.result as any).message);
        }
        return (get.result as any);
    }

    public async update(id: string, payload: any) {
        const update = await this.server.inject({
            allowInternals: true,
            method: "PUT",
            payload,
            url: `/intacct/invoice/${id}`,
        });
        if (update.statusCode !== 200) {
            throw new Error((update.result as any).message);
        }
        return update.result;
    }

    public async createPayment(payload: any) {

        const validate = joi.validate(payload, intacctPaymentSchema);

        if (validate.error) {
            throw new Error(validate.error.message);
        }

        const create = await this.server.inject({
            allowInternals: true,
            method: "POST",
            payload,
            url: `/intacct/payment`,
        });
        if (create.statusCode !== 200) {
            throw new Error((create.result as any).message);
        }
        return (create.result as any);
    }

    public async listAccounts() {
        const list = await this.server.inject({
            allowInternals: true,
            method: "GET",
            url: `/intacct/checkingaccount`,
        });
        if (list.statusCode !== 200) {
            throw new Error((list.result as any).message);
        }
        return (list.result as any);
    }

    public async inspect() {
        const inspect = await this.server.inject({
            allowInternals: true,
            method: "OPTIONS",
            url: `/intacct/invoice`,
        });
        if (inspect.statusCode !== 200) {
            throw new Error((inspect.result as any).message);
        }
        return (inspect.result as any);
    }
}
