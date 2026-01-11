"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { X } from "lucide-react";
import { type Item, type GoldPrices } from "@/lib/config";
import { getPriceWarningLevel, getCogsFloor } from "@/lib/pricing";
import { cn } from "@/lib/utils";

interface ItemCardProps {
  item: Item;
  goldPrices: GoldPrices;
  onPriceChange: (id: string, price: number) => void;
  onLockToggle: (id: string) => void;
  onRemove: (id: string) => void;
  showSlider?: boolean;
}

export function ItemCard({
  item,
  goldPrices,
  onPriceChange,
  onLockToggle,
  onRemove,
  showSlider = true,
}: ItemCardProps) {
  const t = useTranslations();
  const warningLevel = getPriceWarningLevel(item, goldPrices);
  const cogsFloor = getCogsFloor(item, goldPrices);
  const currentPrice = item.adjustedPrice || item.calculatedPrice;
  const maxPrice = item.calculatedPrice * 1.5;

  const warningColors = {
    safe: "border-green-500/50 bg-green-500/5",
    warning: "border-yellow-500/50 bg-yellow-500/5",
    danger: "border-orange-500/50 bg-orange-500/5",
    loss: "border-red-500/50 bg-red-500/5",
  };

  const warningBadges = {
    safe: { variant: "default" as const, text: t("warnings.priceSafe") },
    warning: { variant: "secondary" as const, text: t("warnings.belowRecommended") },
    danger: { variant: "destructive" as const, text: t("warnings.nearCogs") },
    loss: { variant: "destructive" as const, text: t("warnings.belowCogs") },
  };

  return (
    <Card className={cn("transition-colors", warningColors[warningLevel])}>
      <CardContent className="p-3 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline">{item.origin}</Badge>
              <Badge variant="outline">{item.karat}K</Badge>
              <Badge variant="outline">{item.weightGrams.toFixed(3)}g</Badge>
              {item.isLightPiece && (
                <Badge variant="secondary" className="text-xs">
                  {t("item.lightPiece")}
                </Badge>
              )}
            </div>
            {item.sku && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                SKU: {item.sku}
              </p>
            )}
          </div>

          <div className="text-right">
            <p className={cn(
              "text-2xl font-bold tabular-nums",
              warningLevel === "safe" && "text-emerald-600",
              warningLevel === "warning" && "text-amber-600",
              warningLevel === "danger" && "text-orange-600",
              warningLevel === "loss" && "text-red-600"
            )}>
              {currentPrice.toLocaleString("en-EG")}
            </p>
            <p className="text-xs text-muted-foreground">EGP</p>
          </div>
        </div>

        {showSlider && (
          <>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Floor: {cogsFloor.toLocaleString()}</span>
                <span>Recommended: {item.calculatedPrice.toLocaleString()}</span>
              </div>
              <Slider
                value={[currentPrice]}
                min={cogsFloor * 0.9}
                max={maxPrice}
                step={10}
                onValueChange={([value]) => onPriceChange(item.id, value)}
                disabled={item.isLocked}
                className={cn(item.isLocked && "opacity-50")}
              />
            </div>

            <div className="flex items-center justify-between">
              <Badge variant={warningBadges[warningLevel].variant}>
                {warningBadges[warningLevel].text}
              </Badge>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Switch
                    checked={item.isLocked}
                    onCheckedChange={() => onLockToggle(item.id)}
                    className="scale-75"
                  />
                  <span className="text-xs">
                    {item.isLocked ? t("item.locked") : t("item.unlock")}
                  </span>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemove(item.id)}
                  className="h-7 w-7 text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}

        {item.tagImageUrl && (
          <div className="pt-2">
            <Separator className="mb-2" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{t("scan.tagImage")}:</span>
              <img
                src={item.tagImageUrl}
                alt="Tag"
                className="h-12 rounded border object-contain"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
