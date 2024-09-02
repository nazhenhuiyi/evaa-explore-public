import { TriangleDownIcon, TriangleUpIcon } from "@radix-ui/react-icons"
import { Column } from "@tanstack/react-table"
import { Button } from "~/components/ui/button"
import { cn } from "~/indexer/lib/utils"

export const SortIcon = ({ sortingState }: { sortingState: "asc" | "desc" | boolean }) => {
    return (
        <span className="relative w-4 h-6 text-black/50">
            <TriangleDownIcon className={cn("absolute h-4 w-4 bottom-0", sortingState === "desc" ? "text-blue-500" : "")} />
            <TriangleUpIcon className={cn("absolute h-4 w-4 top-0", sortingState === "asc" ? "text-blue-500" : "")} />
        </span>
    )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const SortButton = ({ column, children }: { column: Column<any, unknown>, children: React.ReactNode }) => {
    return (
        <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
            {children}
            <SortIcon sortingState={column.getIsSorted()} />

        </Button>)
}