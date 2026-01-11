"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ManualEntryDialog } from "@/components/manual-entry-form";
import { ItemCard } from "@/components/item-card";
import { Camera, PenLine, ArrowDown, ArrowUp, ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Item, GoldPrices, Origin, Karat, ItemCategory, ItemSource } from "@/lib/config";

interface TradeUIProps {
  items: Item[];
  goldPrices: GoldPrices;
  onAddItem: (item: ItemFormData, direction: "IN" | "OUT") => void;
  onUpdatePrice: (id: string, price: number) => void;
  onToggleLock: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onShowCamera: () => void;
  customerMode: boolean;
}

interface ItemFormData {
  origin: Origin;
  weightGrams: string;
  karat: Karat;
  cogsFromTag: string;
  sku: string;
  category: ItemCategory;
  isLightPiece: boolean;
  source: ItemSource | undefined;
  isPackagedBtc: boolean;
}

export function TradeUI({
  items,
  goldPrices,
  onAddItem,
  onUpdatePrice,
  onToggleLock,
  onRemoveItem,
  onShowCamera,
  customerMode,
}: TradeUIProps) {
  const t = useTranslations();
  const [activeSection, setActiveSection] = useState<"IN" | "OUT">("IN");

  const itemsIn = items.filter((i) => i.direction === "IN");
  const itemsOut = items.filter((i) => i.direction === "OUT");

  const totalIn = itemsIn.reduce((sum, i) => sum + (i.adjustedPrice || i.calculatedPrice), 0);
  const totalOut = itemsOut.reduce((sum, i) => sum + (i.adjustedPrice || i.calculatedPrice), 0);
  const netDifference = totalOut - totalIn;

  const handleAddItem = (formData: ItemFormData) => {
    onAddItem(formData, activeSection);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ArrowRightLeft className="h-5 w-5" />
            {t("transaction.trade")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={activeSection === "IN" ? "default" : "outline"}
              className={cn(
                "h-12 flex-col gap-1",
                activeSection === "IN" && "bg-amber-600 hover:bg-amber-700"
              )}
              onClick={() => setActiveSection("IN")}
            >
              <div className="flex items-center gap-1">
                <ArrowDown className="h-4 w-4" />
                <span className="text-sm font-medium">{t("trade.customerGives")}</span>
              </div>
              <span className="text-xs opacity-80">{itemsIn.length} {t("common.items")}</span>
            </Button>
            <Button
              variant={activeSection === "OUT" ? "default" : "outline"}
              className={cn(
                "h-12 flex-col gap-1",
                activeSection === "OUT" && "bg-emerald-600 hover:bg-emerald-700"
              )}
              onClick={() => setActiveSection("OUT")}
            >
              <div className="flex items-center gap-1">
                <ArrowUp className="h-4 w-4" />
                <span className="text-sm font-medium">{t("trade.customerReceives")}</span>
              </div>
              <span className="text-xs opacity-80">{itemsOut.length} {t("common.items")}</span>
            </Button>
          </div>

          {activeSection === "IN" ? (
            <ManualEntryDialog
              trigger={
                <Button className="h-16 w-full flex-col gap-1" variant="outline">
                  <PenLine className="h-5 w-5" />
                  <span className="text-sm">{t("common.manual")}</span>
                </Button>
              }
              onItemAdd={handleAddItem}
              mode="buy"
              title={t("trade.customerGives")}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Button
                className="h-16 flex-col gap-1"
                variant="outline"
                onClick={onShowCamera}
              >
                <Camera className="h-5 w-5" />
                <span className="text-sm">{t("common.scan")}</span>
              </Button>
              <ManualEntryDialog
                trigger={
                  <Button className="h-16 flex-col gap-1" variant="outline">
                    <PenLine className="h-5 w-5" />
                    <span className="text-sm">{t("common.manual")}</span>
                  </Button>
                }
                onItemAdd={handleAddItem}
                mode="sell"
                title={t("trade.customerReceives")}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {activeSection === "IN" && itemsIn.length > 0 && (
        <Card className="border-amber-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowDown className="h-4 w-4 text-amber-500" />
                {t("trade.customerGives")}
              </div>
              <Badge variant="outline" className="text-amber-600 border-amber-500/50">
                {totalIn.toLocaleString()} {t("common.egp")}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {itemsIn.map((item) => (
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
          </CardContent>
        </Card>
      )}

      {activeSection === "OUT" && itemsOut.length > 0 && (
        <Card className="border-emerald-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowUp className="h-4 w-4 text-emerald-500" />
                {t("trade.customerReceives")}
              </div>
              <Badge variant="outline" className="text-emerald-600 border-emerald-500/50">
                {totalOut.toLocaleString()} {t("common.egp")}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {itemsOut.map((item) => (
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
          </CardContent>
        </Card>
      )}

      {items.length > 0 && (
        <Card className={cn(
          "border-2",
          netDifference > 0 ? "border-emerald-500/50 bg-emerald-500/5" : 
          netDifference < 0 ? "border-red-500/50 bg-red-500/5" : 
          "border-muted"
        )}>
          <CardContent className="py-4">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("trade.customerGives")}</span>
                <span className="text-amber-600 font-medium">
                  {totalIn.toLocaleString()} {t("common.egp")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("trade.customerReceives")}</span>
                <span className="text-emerald-600 font-medium">
                  {totalOut.toLocaleString()} {t("common.egp")}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="font-medium">{t("trade.netDifference")}</span>
                <div className="text-right">
                  <span className={cn(
                    "text-xl font-bold",
                    netDifference > 0 ? "text-emerald-600" : 
                    netDifference < 0 ? "text-red-600" : 
                    "text-foreground"
                  )}>
                    {netDifference > 0 ? "+" : ""}{netDifference.toLocaleString()} {t("common.egp")}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {netDifference > 0 
                      ? t("trade.customerPays") 
                      : netDifference < 0 
                        ? t("trade.customerReceivesBack")
                        : t("trade.evenTrade")
                    }
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
