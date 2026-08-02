import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
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
} as const

export const Errors = {
  0: {message:"NotAdmin"},
  1: {message:"AlreadyInitialized"},
  2: {message:"NotInitialized"},
  3: {message:"InvalidShares"},
  4: {message:"NoContributors"},
  5: {message:"InvalidAmount"}
}

export type DataKey = {tag: "Admin", values: void} | {tag: "Token", values: void} | {tag: "Contributors", values: void} | {tag: "Shares", values: void} | {tag: "TotalShares", values: void};




export interface Client {
  /**
   * Construct and simulate a get_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_admin: (options?: MethodOptions) => Promise<AssembledTransaction<Option<string>>>

  /**
   * Construct and simulate a get_token transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_token: (options?: MethodOptions) => Promise<AssembledTransaction<Option<string>>>

  /**
   * Construct and simulate a get_shares transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_shares: (options?: MethodOptions) => Promise<AssembledTransaction<Array<i128>>>

  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * One-time initialization: set the project admin (sole operator) and the
   * token used for all distributions (e.g. the USDC Stellar Asset Contract).
   */
  initialize: ({admin, token}: {admin: string, token: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_contributors transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_contributors: (options?: MethodOptions) => Promise<AssembledTransaction<Array<string>>>

  /**
   * Construct and simulate a get_total_shares transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_total_shares: (options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a set_contributors transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Set the contributor list and their relative weights (shares).
   * Admin-only. Shares must be positive; totals are stored as weights
   * so any denominator works (e.g. 60/40, 1/1/1).
   */
  set_contributors: ({contributors, shares}: {contributors: Array<string>, shares: Array<i128>}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a distribute_payment transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Distribute `amount` of the configured token from the admin's balance to
   * each contributor proportionally to their shares. Any remainder after
   * integer division goes to the last contributor.
   */
  distribute_payment: ({amount}: {amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAABgAAAAAAAAAITm90QWRtaW4AAAAAAAAAAAAAABJBbHJlYWR5SW5pdGlhbGl6ZWQAAAAAAAEAAAAAAAAADk5vdEluaXRpYWxpemVkAAAAAAACAAAAAAAAAA1JbnZhbGlkU2hhcmVzAAAAAAAAAwAAAAAAAAAOTm9Db250cmlidXRvcnMAAAAAAAQAAAAAAAAADUludmFsaWRBbW91bnQAAAAAAAAF",
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
        "AAAAAAAAALtEaXN0cmlidXRlIGBhbW91bnRgIG9mIHRoZSBjb25maWd1cmVkIHRva2VuIGZyb20gdGhlIGFkbWluJ3MgYmFsYW5jZSB0bwplYWNoIGNvbnRyaWJ1dG9yIHByb3BvcnRpb25hbGx5IHRvIHRoZWlyIHNoYXJlcy4gQW55IHJlbWFpbmRlciBhZnRlcgppbnRlZ2VyIGRpdmlzaW9uIGdvZXMgdG8gdGhlIGxhc3QgY29udHJpYnV0b3IuAAAAABJkaXN0cmlidXRlX3BheW1lbnQAAAAAAAEAAAAAAAAABmFtb3VudAAAAAAACwAAAAEAAAPpAAAAAgAAAAM=" ]),
      options
    )
  }
  public readonly fromJSON = {
    get_admin: this.txFromJSON<Option<string>>,
        get_token: this.txFromJSON<Option<string>>,
        get_shares: this.txFromJSON<Array<i128>>,
        initialize: this.txFromJSON<Result<void>>,
        get_contributors: this.txFromJSON<Array<string>>,
        get_total_shares: this.txFromJSON<i128>,
        set_contributors: this.txFromJSON<Result<void>>,
        distribute_payment: this.txFromJSON<Result<void>>
  }
}