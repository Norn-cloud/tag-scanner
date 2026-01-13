"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";
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
  const [isExpanded, setIsExpanded] = useState(false);
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
    <Card className="sticky bottom-0 border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] bg-background/95 backdrop-blur z-50 rounded-none rounded-t-xl transition-all duration-300">
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 h-1 w-12 bg-muted rounded-full cursor-pointer hover:bg-muted-foreground/20 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      />
      
      <CardContent className="p-4 space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {isTrade ? t("transaction.netAmount") : t("common.total")}
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold tabular-nums tracking-tight">
                {(isTrade ? Math.abs(netAmount) : (isBuy ? totalIn : totalOut)).toLocaleString("en-EG")}
              </span>
              <span className="text-sm font-medium text-muted-foreground">EGP</span>
            </div>
            {isTrade && (
               <Badge variant={netAmount >= 0 ? "default" : "secondary"} className="mt-1 h-5 text-[10px] px-1.5">
                 {netAmount >= 0 ? t("transaction.customerPays") : t("transaction.customerReceives")}
               </Badge>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            {!customerMode && !isBuy && (
              <div className="text-right">
                <div className={cn("text-2xl font-bold tabular-nums leading-none", warningColors[warningLevel])}>
                  {sliderValue}%
                </div>
                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                  Markup
                </div>
              </div>
            )}
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 rounded-full"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {!customerMode && !isBuy && (
          <div className="space-y-3 pt-1">
             <Slider
                value={[sliderValue]}
                min={0}
                max={150}
                step={1}
                onValueChange={handleSliderChange}
                className={cn(
                  "py-2 cursor-pointer",
                  warningLevel === "loss" && "[&_[role=slider]]:bg-red-500",
                  warningLevel === "danger" && "[&_[role=slider]]:bg-orange-500",
                  warningLevel === "warning" && "[&_[role=slider]]:bg-yellow-500"
                )}
              />
              <div className="flex justify-between text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                <span className="text-red-500 flex flex-col items-start gap-0.5">
                  <span>Floor (0%)</span>
                  <span className="text-[9px] opacity-70 tabular-nums">{floor.toLocaleString("en-EG")}</span>
                </span>
                <span className="text-foreground flex flex-col items-center gap-0.5">
                  <span>Standard (100%)</span>
                </span>
                <span className="flex flex-col items-end gap-0.5">
                  <span>Max (150%)</span>
                </span>
              </div>
          </div>
        )}

        {isExpanded && (
          <div className="space-y-4 pt-2 animate-in slide-in-from-bottom-5 fade-in duration-300">
            <Separator />
            
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
              {isTrade && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("transaction.totalIn")}</span>
                    <span className="font-medium tabular-nums">{totalIn.toLocaleString("en-EG")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("transaction.totalOut")}</span>
                    <span className="font-medium tabular-nums">{totalOut.toLocaleString("en-EG")}</span>
                  </div>
                </>
              )}
              
              {!customerMode && (
                <>
                  <div className="flex justify-between col-span-2">
                    <span className="text-muted-foreground">{t("transaction.margin")}</span>
                    <div className="flex items-center gap-2">
                      <span className={cn("font-bold tabular-nums", warningColors[warningLevel])}>
                        {margin > 0 ? "+" : ""}{margin.toLocaleString("en-EG")}
                      </span>
                      <Badge 
                        variant={margin > 0 ? "default" : "destructive"} 
                        className="h-5 px-1.5 text-[10px]"
                      >
                        {marginPercent.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
