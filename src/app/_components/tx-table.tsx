"use client"
import { ArrowDownIcon, ArrowUpIcon } from '@radix-ui/react-icons'
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from "@tanstack/react-table"
import { type Transactions } from "@prisma/client";
import { api } from "~/trpc/react";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table"
import dayjs from "dayjs";
import { DataTablePagination } from "./table-pagination";
import { useState } from "react";
import { Address } from "@ton/core";
import { formatAssetsAmount } from "~/indexer/lib/format";
import { Button } from "~/components/ui/button";

const columns: ColumnDef<Transactions>[] = [
    {
        accessorKey: "txHash",
        header: "Hash",
        cell: ({ row }) => {
            return (
                <a target="_blank" className="text-blue-500" href={`https://tonviewer.com/transaction/${row.original.txHash}`} title={`${row.original.txHash}`}>
                    {row.original.txHash.slice(0, 5)}...{row.original.txHash.slice(-5)}
                </a>
            )
        }
    },
    {
        accessorKey: "status",
        header: "Status",
    },
    {
        accessorKey: "createAt",
        header: ({ column }) => {
            const sortingState = column.getIsSorted();
            console.log(column.getIsSorted(), '(column.getIsSorted()')
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    created At
                    {sortingState === "asc" ? <ArrowUpIcon className="ml-2 h-4 w-4" /> : <ArrowDownIcon className="ml-2 h-4 w-4" />}
                </Button>
            )
        },
        cell: ({ row }) => dayjs(row.original.createAt).format('YYYY-MM-DD HH:mm:ss'),

    },
    {
        accessorKey: 'type',
        header: 'TX type'
    },
    {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ row }) => {
            return formatAssetsAmount(row.original.assetsName as unknown as never, Number(row.original.amount))
        },
    },
    {
        accessorKey: 'userAddress',
        header: 'User Address',
        cell: ({ row }) => {
            const friendlyAddress = Address.parse(row.original.userAddress).toString();
            return (
                <a target="_blank" className="text-blue-500" href={`/address/${friendlyAddress}`} title={`${friendlyAddress}`}>
                    {friendlyAddress.slice(0, 5)}...{friendlyAddress.slice(-5)}
                </a>
            )
        }
    },
]

export function TxTable({ userAddress }: { userAddress?: string }) {
    const [sorting, setSorting] = useState<SortingState>([])
    const [pagination, setPagination] = useState({
        pageIndex: 0, //initial page index
        pageSize: 20, //default page size
    });
    const data = api.transaction.getTransaction.useQuery({
        current: pagination.pageIndex + 1,
        userAddress: userAddress && Address.parse(userAddress).toRawString(),
    });

    const table = useReactTable({
        data: data.data?.txs ?? [],
        columns,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
        pageCount: data.data ? Math.ceil(data.data.count / pagination.pageSize) : 0,
        getPaginationRowModel: getPaginationRowModel(),
        onPaginationChange: setPagination,
        getSortedRowModel: getSortedRowModel(),
        onSortingChange: setSorting,
        state: {
            pagination,
            sorting,
        },
    })

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <DataTablePagination table={table} />

        </div>

    )
}

