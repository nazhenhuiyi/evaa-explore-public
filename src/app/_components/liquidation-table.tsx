"use client"

import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { type LiquidateTransaction } from "@prisma/client";
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

const columns: ColumnDef<LiquidateTransaction>[] = [
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
        accessorKey: "createdAt",
        header: 'Created At',
        cell: ({ row }) => dayjs(row.getValue('createdAt')).format('YYYY-MM-DD HH:mm:ss'),
    },

    {
        accessorKey: 'liquidatorAddress',
        header: 'liquidator Address',
        cell: ({ row }) => {
            const friendlyAddress = Address.parse(row.original.liquidatorAddress).toString();
            return (
                <a target="_blank" className="text-blue-500" href={`/liquidator/${friendlyAddress}`} title={`${friendlyAddress}`}>
                    {friendlyAddress.slice(0, 5)}...{friendlyAddress.slice(-5)}
                </a>
            )
        }
    },
    {
        accessorKey: 'borrowerAddress',
        header: 'borrower Address',
        cell: ({ row }) => {
            const friendlyAddress = Address.parse(row.original.borrowerAddress).toString();
            return (
                <a target="_blank" className="text-blue-500" href={`/address/${friendlyAddress}`} title={`${friendlyAddress}`}>
                    {friendlyAddress.slice(0, 5)}...{friendlyAddress.slice(-5)}
                </a>
            )
        }
    },
    {
        accessorKey: 'liquidationAmount',
        header: 'liquidation Amount',
        cell: ({ row }) => {
            return formatAssetsAmount(row.original.liquidationAssetName as unknown as never, Number(row.original.liquidationAmount))
        },
    },
    {
        accessorKey: 'collateralAmount',
        header: 'collateral Amount',
        cell: ({ row }) => {
            return formatAssetsAmount(row.original.collateralAssetName as unknown as never, Number(row.original.collateralAmount))
        },
    },
]

export function LiquidationTxTable({ liquidatorAddress, borrowerAddress, showPagination = true }: { liquidatorAddress?: string; borrowerAddress?: string; showPagination?: boolean }) {
    const [pagination, setPagination] = useState({
        pageIndex: 0, //initial page index
        pageSize: 20, //default page size
    });
    const data = api.transaction.getLiquidationTransaction.useQuery({
        current: pagination.pageIndex + 1,
        liquidatorAddress: liquidatorAddress && Address.parse(liquidatorAddress).toRawString(),
        borrowerAddress: borrowerAddress && Address.parse(borrowerAddress).toString(),
    });

    const table = useReactTable({
        data: data.data?.txs ?? [],
        columns,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
        pageCount: data.data ? Math.ceil(data.data.count / pagination.pageSize) : 0,
        getPaginationRowModel: getPaginationRowModel(),
        onPaginationChange: setPagination,
        state: {
            pagination,
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
            {showPagination && <DataTablePagination table={table} />}

        </div>

    )
}

