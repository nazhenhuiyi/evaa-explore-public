import { LiquidationTxTable } from "../_components/liquidation-table"

const Page = () => {
    return <div className="p-4">
        <h2 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0">Liquidation History</h2>
        <LiquidationTxTable />
    </div>
}
export default Page