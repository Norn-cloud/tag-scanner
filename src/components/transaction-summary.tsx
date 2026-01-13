"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { type TransactionTotals, type TransactionType } from "@/lib/config";
import { getWarningLevel } from "@/lib/pricing";
import { cn } from "@/lib/utils";

interface TransactionSummaryProps {
  totals: TransactionTotals;
  type: TransactionType;
  sliderValue: number;
  onSliderChange: (value: number) => void;
  customerMode?: boolean;
}

export function TransactionSummary({
  totals,
  type,
  sliderValue,
  onSliderChange,
  customerMode = false,
}: TransactionSummaryProps) {
  const t = useTranslations();
  const { totalIn, totalOut, netAmount, margin, marginPercent, floor } = totals;

  const isTrade = type === "TRADE";
  const isBuy = type === "BUY";
  const warningLevel = getWarningLevel(totals, type);
  
  const warningColors = {
    safe: "text-green-600 dark:text-green-400",
    warning: "text-yellow-600 dark:text-yellow-400",
    danger: "text-orange-600 dark:text-orange-400",
    loss: "text-red-600 dark:text-red-400",
  };

  const handleSliderChange = (value: number[]) => {
    onSliderChange(value[0]);
  };

  return (
    <Card className="sticky bottom-0 border-t-2 shadow-lg">
      <CardContent className="p-4 space-y-4">
        {!customerMode && !isBuy && (
          <>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("prices.priceAdjustment")}</span>
                <span className={cn("font-medium", warningColors[warningLevel])}>
                  {sliderValue}%
                </span>
              </div>
              <Slider
                value={[sliderValue]}
                min={50}
                max={150}
                step={1}
                onValueChange={handleSliderChange}
                className={cn(
                  warningLevel === "loss" && "[&_[role=slider]]:bg-red-500",
                  warningLevel === "danger" && "[&_[role=slider]]:bg-orange-500",
                  warningLevel === "warning" && "[&_[role=slider]]:bg-yellow-500"
                )}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>-50%</span>
                <span className={warningColors[warningLevel]}>
                  Floor: {floor.toLocaleString("en-EG")}
                </span>
                <span>+50%</span>
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
                {(isBuy ? totalIn : totalOut).toLocaleString("en-EG")}
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
                <p className={cn("text-xl font-bold tabular-nums", warningColors[warningLevel])}>
                  {margin > 0 ? "+" : ""}{margin.toLocaleString("en-EG")}
                </p>
              </div>
              <Badge
                variant={margin > 0 ? "default" : "destructive"}
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
