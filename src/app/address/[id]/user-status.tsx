'use client'
import { Address } from "@ton/core";
import { api } from "~/trpc/react";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import { Label } from "~/components/ui/label"
export enum BalanceType {
    supply = 'supply',
    borrow = 'borrow',
}
export type UserBalance = {
    amount: bigint;
    type?: BalanceType;
};

export const UserStatus = ({ userAddress }: { userAddress: string }) => {
    const data = api.user.user.useQuery({ walletAddress: userAddress && Address.parse(userAddress).toString(), });
    console.log(data)
    return (
        <div>
            <Card>
                <CardHeader>
                    <CardTitle>Supply</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Card Content</p>
                </CardContent>
                <CardFooter>
                    <p>Card Footer</p>
                </CardFooter>
            </Card>
        </div>
    )

}