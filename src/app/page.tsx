import { LiquidationTransactionAnalytics } from "./_components/liquadation-analytics"
import { LiquidationTxTable } from "./_components/liquidation-table"
import { TransactionAnalytics } from "./_components/tx-analytics"
import { TxTable } from "./_components/tx-table"

const Page = () => {

    return (
        <div className="p-4">
            <TransactionAnalytics />
            <h2 className="flex scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0 mt-3">Transaction History
                <a className="ml-auto text-lg text-blue-500" href="/transaction">View All</a>
            </h2>
            <TxTable showPagination={false} />

            <LiquidationTransactionAnalytics className="mt-8" />
            <h2 className="flex scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0 mt-3">Liquidation History
                <a className="ml-auto text-lg text-blue-500" href="/liquidator">View All</a>
            </h2>
            <LiquidationTxTable showPagination={false} />

        </div>
    )
}
export default Page