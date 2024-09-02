import { HydrateClient } from "~/trpc/server";
import { TxTable } from "../_components/tx-table";

export default async function Home() {

  return (
    <HydrateClient>
      <main className="p-4">
        <TxTable />
      </main>
    </HydrateClient>
  );
}
