export interface JettonNotifyBody {
  query_id: number;
  amount: string;
  sender: string;
  forward_payload: {
    value: {
      op_code: number;
      value: string;
    };
  };
}
export interface JettonTransferBody {
  query_id: number;
  amount: string;
  destination: string;
  response_destination: string;
  forward_payload: {
    value: {
      op_code: number;
      value: string;
    };
  };
}

export interface Transaction {
  hash: string;
  lt: number;
  utime: number;
  in_msg: {
    source: {
      address: string;
    };
    value: number;
    op_code: string;
    bounce: boolean;
    destination: {
      address: string;
    };
    decoded_body: {
      text: string;
    };
    body: string;
    raw_body: string;
  };
  out_msgs: {
    destination: {
      address: string;
    };
    op_code: string;
    created_lt: number;
    raw_body: string;
    value: number;
    decoded_body: {
      text: string;
    };
  }[];
  compute_phase: {
    skipped: boolean;
    success: boolean;
    gas_fees: number;
    gas_used: number;
    exit_code: number;
  };
  aborted: boolean;
}
