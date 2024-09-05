"use client"
import dayjs from "dayjs"
import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "~/components/ui/chart"
import { cn } from "~/indexer/lib/utils"
import { api } from "~/trpc/react"
export const description = "An interactive bar chart"

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const chartConfig = {
    views: {
        label: "Count",
    },
    withdraw: {
        label: "Success",
        color: "hsl(var(--chart-2))",

    },
    supply: {
        label: "Failure",
        color: "hsl(var(--chart-1))",

    },
} satisfies ChartConfig
export function LiquidationTransactionAnalytics({ className }: { className: string }) {
    const { data } = api.transaction.getLiquidationAnalytics.useQuery({});
    const supplyTxs = data?.supplyTxs ?? []
    const withdrawTxs = data?.withdrawTxs ?? []
    const total = React.useMemo(
        () =>
            data ? ({
                supply: supplyTxs.reduce((acc, curr) => acc + curr.count, 0n),
                withdraw: withdrawTxs.reduce((acc, curr) => acc + curr.count, 0n),
            }) : null,
        [data, supplyTxs, withdrawTxs]
    )
    const chartData = React.useMemo(() => {
        if (!data) {
            return []
        }
        return supplyTxs.map((v, index) => ({
            supply: Number(v.count),
            withdraw: Number(withdrawTxs[index]?.count),
            date: dayjs(v.date).format("YYYY-MM-DD"),
        }))
    }, [data, supplyTxs, withdrawTxs])
    console.log(total, chartData, 'getAnalytics')
    if (!data) {
        return null
    }
    return (
        <Card className={cn(className)}>
            <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
                <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
                    <CardTitle>Liquidation Analytics</CardTitle>
                    <CardDescription>
                        Showing total Liquidation for the last 3 months
                    </CardDescription>
                </div>
                <div className="flex">
                    {["supply", "withdraw"].map((key) => {
                        const chart = key as keyof typeof chartConfig
                        return (
                            <button
                                key={chart}
                                className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
                            >
                                <span className="text-xs text-muted-foreground">
                                    {chartConfig[chart].label}
                                </span>
                                <span className="text-lg font-bold leading-none sm:text-3xl">
                                    {total ? (total[key as keyof typeof total] as unknown as number).toLocaleString() : 0}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </CardHeader>
            <CardContent className="px-2 sm:p-6">
                <ChartContainer
                    config={chartConfig}
                    className="aspect-auto h-[250px] w-full"
                >
                    <BarChart
                        accessibilityLayer
                        data={chartData}
                        margin={{
                            left: 12,
                            right: 12,
                        }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            minTickGap={32}
                            tickFormatter={(value: string) => {
                                const date = new Date(value)
                                return date.toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                })
                            }}
                        />
                        <ChartTooltip
                            content={
                                <ChartTooltipContent
                                    className="w-[150px]"
                                    labelFormatter={(value: string, payload) => {
                                        console.log(payload, 'getAnalytics')
                                        return new Date(value).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                        })
                                    }}
                                />
                            }
                        />
                        <Bar dataKey={'withdraw'} fill={`var(--color-withdraw)`} />
                        <Bar dataKey={'supply'} fill={`var(--color-supply)`} />

                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}