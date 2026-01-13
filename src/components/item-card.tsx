"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { X } from "lucide-react";
import { type Item, type TransactionContext } from "@/lib/config";
import { getItemDisplayPrice } from "@/lib/pricing";

interface ItemCardProps {
  item: Item;
  ctx: TransactionContext;
  onRemove: (id: string) => void;
  showPrice?: boolean;
}

export function ItemCard({
  item,
  ctx,
  onRemove,
  showPrice = true,
}: ItemCardProps) {
  const t = useTranslations();
  const price = getItemDisplayPrice(item, ctx);

  return (
    <Card>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline">{item.origin}</Badge>
              <Badge variant={item.condition === "USED" ? "secondary" : "outline"}>
                {item.condition === "USED" ? t("item.used") : t("item.new")}
              </Badge>
              <Badge variant="outline">{item.karat}K</Badge>
              <Badge variant="outline">{item.weightGrams.toFixed(3)}g</Badge>
              {item.isLightPiece && (
                <Badge variant="secondary" className="text-xs">
                  {t("item.lightPiece")}
                </Badge>
              )}
              {item.direction === "IN" && (
                <Badge variant="secondary" className="text-xs">
                  IN
                </Badge>
              )}
            </div>
            {item.sku && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                SKU: {item.sku}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {showPrice && (
              <div className="text-right">
                <p className="text-xl font-bold tabular-nums">
                  {price.toLocaleString("en-EG")}
                </p>
                <p className="text-xs text-muted-foreground">EGP</p>
              </div>
            )}
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
