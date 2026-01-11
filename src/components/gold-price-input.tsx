"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface GoldPriceInputProps {
  prices: {
    k18: number;
    k21: number;
    k24: number;
  };
  fxRate: number;
  lastUpdated: Date | null;
  onPriceChange: (karat: 18 | 21 | 24, price: number) => void;
  onFxChange: (rate: number) => void;
  onRefresh: () => void;
}

export function GoldPriceInput({
  prices,
  fxRate,
  lastUpdated,
  onPriceChange,
  onFxChange,
  onRefresh,
}: GoldPriceInputProps) {
  const t = useTranslations();

  const hoursAgo = lastUpdated
    ? Math.floor((Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60))
    : null;
  const isStale = hoursAgo !== null && hoursAgo >= 24;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          {t("prices.goldPrice")}
          <Button variant="ghost" size="sm" onClick={onRefresh}>
            🔄 {t("prices.refreshPrice")}
          </Button>
        </CardTitle>
        {lastUpdated && (
          <p className={`text-xs ${isStale ? "text-destructive" : "text-muted-foreground"}`}>
            {t("prices.lastUpdated")}: {hoursAgo} {t("prices.hoursAgo")}
            {isStale && ` - ${t("prices.staleWarning")}`}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {([18, 21, 24] as const).map((k) => (
            <div key={k} className="space-y-1">
              <Label className="text-xs">{k}K (EGP/g)</Label>
              <Input
                type="number"
                value={prices[`k${k}`]}
                onChange={(e) => onPriceChange(k, parseFloat(e.target.value) || 0)}
                className="text-center tabular-nums"
              />
            </div>
          ))}
        </div>

        <Separator />

        <div className="space-y-1">
          <Label className="text-xs">{t("prices.usdToEgp")}</Label>
          <Input
            type="number"
            step="0.01"
            value={fxRate}
            onChange={(e) => onFxChange(parseFloat(e.target.value) || 0)}
            className="text-center tabular-nums"
          />
        </div>
      </CardContent>
    </Card>
  );
}
