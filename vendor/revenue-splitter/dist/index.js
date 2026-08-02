import { Buffer } from "buffer";
import { Client as ContractClient, Spec as ContractSpec, } from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";
if (typeof window !== "undefined") {
    //@ts-ignore Buffer exists
    window.Buffer = window.Buffer || Buffer;
}
export const networks = {
    testnet: {
        networkPassphrase: "Test SDF Network ; September 2015",
        contractId: "CCSZD3JCDUY4CWPCFQ7POARMMLWXL434JYRK4OVZ3G4WH5RBRKP4CP5F",
    }
};
export const Errors = {
    0: { message: "NotAdmin" },
    1: { message: "AlreadyInitialized" },
    2: { message: "NotInitialized" },
    3: { message: "InvalidShares" },
    4: { message: "NoContributors" },
    5: { message: "InvalidAmount" }
};
export class Client extends ContractClient {
    options;
    static async deploy(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options) {
        return ContractClient.deploy(null, options);
    }
    constructor(options) {
        super(new ContractSpec(["AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAABgAAAAAAAAAITm90QWRtaW4AAAAAAAAAAAAAABJBbHJlYWR5SW5pdGlhbGl6ZWQAAAAAAAEAAAAAAAAADk5vdEluaXRpYWxpemVkAAAAAAACAAAAAAAAAA1JbnZhbGlkU2hhcmVzAAAAAAAAAwAAAAAAAAAOTm9Db250cmlidXRvcnMAAAAAAAQAAAAAAAAADUludmFsaWRBbW91bnQAAAAAAAAF",
            "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAABQAAAAAAAAAAAAAABUFkbWluAAAAAAAAAAAAAAAAAAAFVG9rZW4AAAAAAAAAAAAAAAAAAAxDb250cmlidXRvcnMAAAAAAAAAAAAAAAZTaGFyZXMAAAAAAAAAAAAAAAAAC1RvdGFsU2hhcmVzAA==",
            "AAAABQAAAAAAAAAAAAAAC0luaXRpYWxpemVkAAAAAAEAAAALaW5pdGlhbGl6ZWQAAAAAAgAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAQAAAAAAAAAFdG9rZW4AAAAAAAATAAAAAAAAAAA=",
            "AAAABQAAAAAAAAAAAAAAD0NvbnRyaWJ1dG9yc1NldAAAAAABAAAAEGNvbnRyaWJ1dG9yc19zZXQAAAACAAAAAAAAAAVhZG1pbgAAAAAAABMAAAABAAAAAAAAAAVjb3VudAAAAAAAAAQAAAAAAAAAAA==",
            "AAAABQAAAAAAAAAAAAAAElBheW1lbnREaXN0cmlidXRlZAAAAAAAAQAAABNwYXltZW50X2Rpc3RyaWJ1dGVkAAAAAAIAAAAAAAAABWFkbWluAAAAAAAAEwAAAAEAAAAAAAAABmFtb3VudAAAAAAACwAAAAAAAAAA",
            "AAAAAAAAAAAAAAAJZ2V0X2FkbWluAAAAAAAAAAAAAAEAAAPoAAAAEw==",
            "AAAAAAAAAAAAAAAJZ2V0X3Rva2VuAAAAAAAAAAAAAAEAAAPoAAAAEw==",
            "AAAAAAAAAAAAAAAKZ2V0X3NoYXJlcwAAAAAAAAAAAAEAAAPqAAAACw==",
            "AAAAAAAAAI9PbmUtdGltZSBpbml0aWFsaXphdGlvbjogc2V0IHRoZSBwcm9qZWN0IGFkbWluIChzb2xlIG9wZXJhdG9yKSBhbmQgdGhlCnRva2VuIHVzZWQgZm9yIGFsbCBkaXN0cmlidXRpb25zIChlLmcuIHRoZSBVU0RDIFN0ZWxsYXIgQXNzZXQgQ29udHJhY3QpLgAAAAAKaW5pdGlhbGl6ZQAAAAAAAgAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAAAAAAV0b2tlbgAAAAAAABMAAAABAAAD6QAAAAIAAAAD",
            "AAAAAAAAAAAAAAAQZ2V0X2NvbnRyaWJ1dG9ycwAAAAAAAAABAAAD6gAAABM=",
            "AAAAAAAAAAAAAAAQZ2V0X3RvdGFsX3NoYXJlcwAAAAAAAAABAAAACw==",
            "AAAAAAAAAK1TZXQgdGhlIGNvbnRyaWJ1dG9yIGxpc3QgYW5kIHRoZWlyIHJlbGF0aXZlIHdlaWdodHMgKHNoYXJlcykuCkFkbWluLW9ubHkuIFNoYXJlcyBtdXN0IGJlIHBvc2l0aXZlOyB0b3RhbHMgYXJlIHN0b3JlZCBhcyB3ZWlnaHRzCnNvIGFueSBkZW5vbWluYXRvciB3b3JrcyAoZS5nLiA2MC80MCwgMS8xLzEpLgAAAAAAABBzZXRfY29udHJpYnV0b3JzAAAAAgAAAAAAAAAMY29udHJpYnV0b3JzAAAD6gAAABMAAAAAAAAABnNoYXJlcwAAAAAD6gAAAAsAAAABAAAD6QAAAAIAAAAD",
            "AAAAAAAAALtEaXN0cmlidXRlIGBhbW91bnRgIG9mIHRoZSBjb25maWd1cmVkIHRva2VuIGZyb20gdGhlIGFkbWluJ3MgYmFsYW5jZSB0bwplYWNoIGNvbnRyaWJ1dG9yIHByb3BvcnRpb25hbGx5IHRvIHRoZWlyIHNoYXJlcy4gQW55IHJlbWFpbmRlciBhZnRlcgppbnRlZ2VyIGRpdmlzaW9uIGdvZXMgdG8gdGhlIGxhc3QgY29udHJpYnV0b3IuAAAAABJkaXN0cmlidXRlX3BheW1lbnQAAAAAAAEAAAAAAAAABmFtb3VudAAAAAAACwAAAAEAAAPpAAAAAgAAAAM="]), options);
        this.options = options;
    }
    fromJSON = {
        get_admin: (this.txFromJSON),
        get_token: (this.txFromJSON),
        get_shares: (this.txFromJSON),
        initialize: (this.txFromJSON),
        get_contributors: (this.txFromJSON),
        get_total_shares: (this.txFromJSON),
        set_contributors: (this.txFromJSON),
        distribute_payment: (this.txFromJSON)
    };
}
