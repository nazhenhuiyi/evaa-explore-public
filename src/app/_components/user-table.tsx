"use client"

import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from "@tanstack/react-table"
import { type UserContract } from "@prisma/client";
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
import { formatAssetsAmount } from "~/indexer/lib/format";
import { SortButton } from "./sort-button";

const columns: ColumnDef<UserContract>[] = [
    {
        accessorKey: 'walletAddress',
        header: "wallet",
        cell: ({ row }) => {
            return (
                <a target="_blank" className="text-blue-500" href={`https://tonviewer.com/${row.original.walletAddress}`} title={`${row.original.walletAddress}`}>
                    {row.original.walletAddress.slice(0, 5)}...{row.original.walletAddress.slice(-5)}
                </a>
            )
        }
    },
    {
        accessorKey: 'tonAmount',
        header: ({ column }) => {
            return (
                `ton Amount`
            )
        },
        cell: ({ row }) => {
            return formatAssetsAmount('TON', Number(row.original.tonAmount,))
        }
    },
    {
        accessorKey: 'usdtAmount',
        header: ({ column }) => {
            return (
                `USDT Amount`
            )
        },
        cell: ({ row }) => {
            return formatAssetsAmount('USDT', Number(row.original.USDTAmount))
        }
    },
    {
        accessorKey: 'stTonAmount',
        header: ({ column }) => {
            return (
                `stTON Amount`
            )
        },
        cell: ({ row }) => {
            return formatAssetsAmount('stTON', Number(row.original.stTonAmount))
        }
    },
    {
        accessorKey: 'tsTonAmount',

        header: ({ column }) => {
            return (
                `tsTON Amount`
            )
        },
        cell: ({ row }) => {
            return formatAssetsAmount('tsTON', Number(row.original.tsTonAmount))
        }
    },
    {
        accessorKey: 'jUSDTAmount',
        header: ({ column }) => {
            return (
                `jUSDT Amount`
            )
        },
        cell: ({ row }) => {
            return formatAssetsAmount('jUSDT', Number(row.original.jUSDTAmount))
        }
    },
    {
        accessorKey: 'jUSDCAmount',
        header: ({ column }) => {
            return (
                `jUSDC Amount`
            )
        },
        cell: ({ row }) => {
            return formatAssetsAmount('jUSDC', Number(row.original.jUSDCAmount))
        }
    },
    {
        accessorKey: 'healthFactor',
        header: ({ column }) => {
            return (
                <SortButton column={column}>health Factor</SortButton>
            )
        },
        cell: ({ row }) => {
            return row.original.healthFactor
        }
    },
    {
        accessorKey: 'totalDebt',
        header: ({ column }) => {
            return (
                <SortButton column={column}>total Debt</SortButton>
            )
        },
        cell: ({ row }) => {
            return row.original.totalDebt ? `${Number(row.original.totalDebt) / 100} USDT` : '--'
        }
    },
    {
        accessorKey: 'lastUtime',
        header: ({ column }) => {
            return (
                <SortButton column={column}>lastUtime</SortButton>
            )
        },
        cell: ({ row }) => {
            return dayjs(row.original.lastUtime).format('YYYY-MM-DD HH:mm:ss')
        }
    }
]

export function UserTable({ liquidatorAddress, borrowerAddress }: { liquidatorAddress?: string; borrowerAddress?: string }) {
    const [pagination, setPagination] = useState({
        pageIndex: 0, //initial page index
        pageSize: 20, //default page size
    });
    const [sorting, setSorting] = useState<SortingState>([
        {
            desc: true,
            id: 'heathFactor',
        }
    ])

    const currentSort = sorting[0]!;
    const data = api.user.users.useQuery({
        current: pagination.pageIndex + 1,
        orderBy: {
            [currentSort.id]: currentSort.desc ? 'desc' : 'asc',
        },
    });

    const table = useReactTable({
        data: data.data?.txs ?? [],
        columns,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
        pageCount: data.data ? Math.ceil(data.data.count / pagination.pageSize) : 0,
        getPaginationRowModel: getPaginationRowModel(),
        onPaginationChange: setPagination,
        onSortingChange: setSorting,
        // getSortedRowModel: getSortedRowModel(),
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

