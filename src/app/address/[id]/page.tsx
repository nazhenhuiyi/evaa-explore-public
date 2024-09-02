import { LiquidationTxTable } from "~/app/_components/liquidation-table"
import { TxTable } from "../../_components/tx-table"
import { UserStatus } from "./user-status"

const Page = ({ params: { id } }: { params: { id: string } }) => {


    return (
        <div className="p-4">
            <UserStatus userAddress={id} />
            <h2 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0">Transaction History</h2>
            <TxTable userAddress={id} />
            <h2 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0">Liquidation History</h2>
            <LiquidationTxTable borrowerAddress={id} />
        </div>
    )
}
export default Page