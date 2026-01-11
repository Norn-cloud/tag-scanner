"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ItemCard } from "@/components/item-card";
import { Plus } from "lucide-react";
import { type Karat, type GoldPrices, type Item } from "@/lib/config";

interface BuyFormData {
  karat: Karat;
  weightGrams: string;
}

interface BuyUIProps {
  items: Item[];
  goldPrices: GoldPrices;
  onAddItem: (data: BuyFormData) => void;
  onUpdatePrice: (id: string, price: number) => void;
  onToggleLock: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onClear: () => void;
  customerMode: boolean;
}

export function BuyUI({
  items,
  goldPrices,
  onAddItem,
  onUpdatePrice,
  onToggleLock,
  onRemoveItem,
  onClear,
  customerMode,
}: BuyUIProps) {
  const t = useTranslations();
  const [karat, setKarat] = useState<Karat>(21);
  const [weight, setWeight] = useState("");

  const handleAdd = useCallback(() => {
    if (!weight) return;
    onAddItem({ karat, weightGrams: weight });
    setWeight("");
  }, [karat, weight, onAddItem]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  const totalValue = items.reduce(
    (sum, item) => sum + (item.adjustedPrice || item.calculatedPrice),
    0
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-base">
            <span>{t("buy.addItem")}</span>
            {items.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="text-xs text-muted-foreground"
              >
                {t("common.clear")}
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t("common.karat")}</Label>
            <div className="grid grid-cols-3 gap-2">
              {([18, 21, 24] as Karat[]).map((k) => (
                <Button
                  key={k}
                  type="button"
                  size="lg"
                  variant={karat === k ? "default" : "outline"}
                  onClick={() => setKarat(k)}
                  className="h-12 text-lg"
                >
                  {k}K
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("common.weight")} (g)</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.001"
                placeholder="4.380"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                onKeyDown={handleKeyDown}
                className="text-xl h-12 text-center flex-1"
                autoFocus
              />
              <Button
                onClick={handleAdd}
                disabled={!weight}
                className="h-12 px-6"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {items.length > 0 && (
        <>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">
                {t("common.items")} ({items.length})
              </h3>
            </div>

            {items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                goldPrices={goldPrices}
                onPriceChange={onUpdatePrice}
                onLockToggle={onToggleLock}
                onRemove={onRemoveItem}
                showSlider={!customerMode}
              />
            ))}
          </div>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">{t("buy.youPay")}</span>
                <span className="text-2xl font-bold text-primary">
                  {totalValue.toLocaleString()} {t("common.egp")}
                </span>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
