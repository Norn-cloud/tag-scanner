"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ManualEntryDialog } from "@/components/manual-entry-form";
import { ItemCard } from "@/components/item-card";
import { Camera, PenLine, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
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
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className={cn(
                "h-14 flex-col gap-1 relative",
                activeSection === "IN" && "ring-2 ring-orange-400 border-orange-400"
              )}
              onClick={() => setActiveSection("IN")}
            >
              <div className="flex items-center gap-2">
                <ArrowDownCircle className={cn(
                  "h-5 w-5",
                  activeSection === "IN" ? "text-orange-500" : "text-muted-foreground"
                )} />
                <span className="text-sm font-medium">{t("trade.customerGives")}</span>
              </div>
              {itemsIn.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {itemsIn.length} {t("common.items")}
                </Badge>
              )}
            </Button>
            <Button
              variant="outline"
              className={cn(
                "h-14 flex-col gap-1 relative",
                activeSection === "OUT" && "ring-2 ring-sky-400 border-sky-400"
              )}
              onClick={() => setActiveSection("OUT")}
            >
              <div className="flex items-center gap-2">
                <ArrowUpCircle className={cn(
                  "h-5 w-5",
                  activeSection === "OUT" ? "text-sky-500" : "text-muted-foreground"
                )} />
                <span className="text-sm font-medium">{t("trade.customerReceives")}</span>
              </div>
              {itemsOut.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {itemsOut.length} {t("common.items")}
                </Badge>
              )}
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowDownCircle className="h-4 w-4 text-orange-500" />
                {t("trade.customerGives")}
              </div>
              <span className="text-orange-600 font-semibold">
                {totalIn.toLocaleString()} {t("common.egp")}
              </span>
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowUpCircle className="h-4 w-4 text-sky-500" />
                {t("trade.customerReceives")}
              </div>
              <span className="text-sky-600 font-semibold">
                {totalOut.toLocaleString()} {t("common.egp")}
              </span>
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
        <Card className="overflow-hidden">
          <div className={cn(
            "h-1",
            netDifference > 0 ? "bg-green-500" : 
            netDifference < 0 ? "bg-red-500" : 
            "bg-muted"
          )} />
          <CardContent className="py-4">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <ArrowDownCircle className="h-4 w-4 text-orange-500" />
                  <span className="text-muted-foreground">{t("trade.customerGives")}</span>
                </div>
                <span className="font-medium">
                  {totalIn.toLocaleString()} {t("common.egp")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <ArrowUpCircle className="h-4 w-4 text-sky-500" />
                  <span className="text-muted-foreground">{t("trade.customerReceives")}</span>
                </div>
                <span className="font-medium">
                  {totalOut.toLocaleString()} {t("common.egp")}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="font-medium">{t("trade.netDifference")}</span>
                <div className="text-right">
                  <span className={cn(
                    "text-2xl font-bold",
                    netDifference > 0 ? "text-green-600" : 
                    netDifference < 0 ? "text-red-600" : 
                    "text-foreground"
                  )}>
                    {Math.abs(netDifference).toLocaleString()} {t("common.egp")}
                  </span>
                  <p className={cn(
                    "text-sm font-medium",
                    netDifference > 0 ? "text-green-600" : 
                    netDifference < 0 ? "text-red-600" : 
                    "text-muted-foreground"
                  )}>
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
