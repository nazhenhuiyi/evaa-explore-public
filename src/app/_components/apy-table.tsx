// "use client"

// import {
//     ColumnDef,
//     flexRender,
//     getCoreRowModel,
//     getPaginationRowModel,
//     getSortedRowModel,
//     SortingState,
//     useReactTable,
// } from "@tanstack/react-table"
// import { type AssetsApy } from "@prisma/client";
// import { api } from "~/trpc/react";

// import {
//     Table,
//     TableBody,
//     TableCell,
//     TableHead,
//     TableHeader,
//     TableRow,
// } from "~/components/ui/table"
// import dayjs from "dayjs";
// import { DataTablePagination } from "./table-pagination";
// import { useState } from "react";
// import { formatAssetsAmount } from "~/indexer/lib/format";
// import { SortButton } from "./sort-button";

// const columns: ColumnDef<AssetsApy>[] = [
//     {
//         accessorKey: 'assetName',
//         header: "Asset Name",
//     },
//     {
//         accessorKey: 'totalSupply',
//         header: ({ column }) => {
//             return (
//                 <SortButton column={column}>total Supply</SortButton>
//             )
//         },
//         cell: ({ row }) => {
//             return row.original.totalSupply
//         }
//     },
//     {
//         accessorKey: 'supply APY',
//         header: ({ column }) => {
//             return (
//                 <SortButton column={column}>supply APY</SortButton>
//             )
//         },
//         cell: ({ row }) => {
//             return row.original.supplyApy
//         }
//     },
//     {
//         accessorKey: 'totalBorrow',
//         header: ({ column }) => {
//             return (
//                 <SortButton column={column}>supply Borrowed</SortButton>
//             )
//         },
//         cell: ({ row }) => {
//             return row.original.totalBorrow
//         }
//     },
//     {
//         accessorKey: 'borrowApy',
//         header: ({ column }) => {
//             return (
//                 <SortButton column={column}>borrow APY </SortButton>
//             )
//         },
//         cell: ({ row }) => {
//             return row.original.borrowApy
//         }
//     },
// ]

// export function ApyTable() {
//     const [pagination, setPagination] = useState({
//         pageIndex: 0, //initial page index
//         pageSize: 20, //default page size
//     });
//     const [sorting, setSorting] = useState<SortingState>([
//         {
//             desc: true,
//             id: 'heathFactor',
//         }
//     ])

//     const data = api.master.apy.useQuery({});
//     console.log(data)
//     const table = useReactTable({
//         data: data.data?.txs ?? [],
//         columns,
//         getCoreRowModel: getCoreRowModel(),
//         manualPagination: true,
//         pageCount: data.data ? Math.ceil(data.data.count / pagination.pageSize) : 0,
//         getPaginationRowModel: getPaginationRowModel(),
//         onPaginationChange: setPagination,
//         onSortingChange: setSorting,
//         getSortedRowModel: getSortedRowModel(),
//         state: {
//             pagination,
//             sorting,
//         },
//     })

//     return (
//         <div className="space-y-4">
//             <div className="rounded-md border">
//                 <Table>
//                     <TableHeader>
//                         {table.getHeaderGroups().map((headerGroup) => (
//                             <TableRow key={headerGroup.id}>
//                                 {headerGroup.headers.map((header) => {
//                                     return (
//                                         <TableHead key={header.id}>
//                                             {header.isPlaceholder
//                                                 ? null
//                                                 : flexRender(
//                                                     header.column.columnDef.header,
//                                                     header.getContext()
//                                                 )}
//                                         </TableHead>
//                                     )
//                                 })}
//                             </TableRow>
//                         ))}
//                     </TableHeader>
//                     <TableBody>
//                         {table.getRowModel().rows?.length ? (
//                             table.getRowModel().rows.map((row) => (
//                                 <TableRow
//                                     key={row.id}
//                                     data-state={row.getIsSelected() && "selected"}
//                                 >
//                                     {row.getVisibleCells().map((cell) => (
//                                         <TableCell key={cell.id}>
//                                             {flexRender(cell.column.columnDef.cell, cell.getContext())}
//                                         </TableCell>
//                                     ))}
//                                 </TableRow>
//                             ))
//                         ) : (
//                             <TableRow>
//                                 <TableCell colSpan={columns.length} className="h-24 text-center">
//                                     No results.
//                                 </TableCell>
//                             </TableRow>
//                         )}
//                     </TableBody>
//                 </Table>
//             </div>
//             <DataTablePagination table={table} />

//         </div>

//     )
// }

