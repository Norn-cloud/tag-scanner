"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { type Transaction } from "@/lib/config";
import { cn } from "@/lib/utils";

interface TransactionSummaryProps {
  transaction: Transaction;
  onMasterSliderChange: (multiplier: number) => void;
  customerMode?: boolean;
}

export function TransactionSummary({
  transaction,
  onMasterSliderChange,
  customerMode = false,
}: TransactionSummaryProps) {
  const t = useTranslations();
  const { type, totalIn, totalOut, netAmount, totalMargin, marginPercent } = transaction;

  const isProfit = totalMargin > 0;
  const isTrade = type === "TRADE";

  return (
    <Card className="sticky bottom-0 border-t-2 shadow-lg">
      <CardContent className="p-4 space-y-4">
        {!customerMode && (
          <>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Master Price Adjustment</span>
                <span className="font-medium">100%</span>
              </div>
              <Slider
                defaultValue={[100]}
                min={80}
                max={120}
                step={1}
                onValueChange={([value]) => onMasterSliderChange(value / 100)}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>-20%</span>
                <span>Recommended</span>
                <span>+20%</span>
              </div>
            </div>
            <Separator />
          </>
        )}

        <div className="grid grid-cols-2 gap-4">
          {isTrade ? (
            <>
              <div>
                <p className="text-sm text-muted-foreground">{t("transaction.totalIn")}</p>
                <p className="text-xl font-bold tabular-nums">
                  {totalIn.toLocaleString("en-EG")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("transaction.totalOut")}</p>
                <p className="text-xl font-bold tabular-nums">
                  {totalOut.toLocaleString("en-EG")}
                </p>
              </div>
            </>
          ) : (
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">{t("common.total")}</p>
              <p className="text-3xl font-bold tabular-nums">
                {(type === "BUY" ? totalIn : totalOut).toLocaleString("en-EG")}
                <span className="text-lg font-normal text-muted-foreground ml-1">EGP</span>
              </p>
            </div>
          )}
        </div>

        {isTrade && (
          <>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {netAmount >= 0 ? t("transaction.customerPays") : t("transaction.customerReceives")}
                </p>
                <p className="text-2xl font-bold tabular-nums">
                  {Math.abs(netAmount).toLocaleString("en-EG")}
                  <span className="text-base font-normal text-muted-foreground ml-1">EGP</span>
                </p>
              </div>
              <Badge variant={netAmount >= 0 ? "default" : "secondary"} className="text-lg px-3 py-1">
                {netAmount >= 0 ? "↑" : "↓"}
              </Badge>
            </div>
          </>
        )}

        {!customerMode && (
          <>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("transaction.margin")}</p>
                <p
                  className={cn(
                    "text-xl font-bold tabular-nums",
                    isProfit ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                  )}
                >
                  {isProfit ? "+" : ""}
                  {totalMargin.toLocaleString("en-EG")}
                </p>
              </div>
              <Badge
                variant={isProfit ? "default" : "destructive"}
                className="text-lg px-3 py-1"
              >
                {marginPercent.toFixed(1)}%
              </Badge>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
