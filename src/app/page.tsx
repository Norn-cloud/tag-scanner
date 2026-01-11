"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ManualEntryDialog } from "@/components/manual-entry-form";
import { ItemCard } from "@/components/item-card";
import { TransactionSummary } from "@/components/transaction-summary";
import { GoldPriceInput } from "@/components/gold-price-input";
import { CameraCapture } from "@/components/camera-capture";
import { setLocaleCookie } from "@/lib/locale";
import {
  type Item,
  type Transaction,
  type TransactionType,
  type GoldPrices,
} from "@/lib/config";
import { calculateItemPrice, calculateTransactionTotals } from "@/lib/pricing";

const defaultGoldPrices: GoldPrices = {
  k18: 3200,
  k21: 3700,
  k24: 4200,
};

export default function Home() {
  const t = useTranslations();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<TransactionType>("SELL");
  const [items, setItems] = useState<Item[]>([]);
  const [goldPrices, setGoldPrices] = useState<GoldPrices>(defaultGoldPrices);
  const [fxRate, setFxRate] = useState(50.5);
  const [lastPriceUpdate, setLastPriceUpdate] = useState<Date | null>(new Date());
  const [customerMode, setCustomerMode] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showPrices, setShowPrices] = useState(false);

  const transaction: Transaction = {
    id: "draft",
    type: activeTab,
    items,
    deductionPercent: activeTab === "TRADE" ? 0 : 0.02,
    goldPricePerGram: goldPrices,
    fxRateUsdToEgp: fxRate,
    ...calculateTransactionTotals({
      id: "draft",
      type: activeTab,
      items,
      deductionPercent: activeTab === "TRADE" ? 0 : 0.02,
      goldPricePerGram: goldPrices,
      fxRateUsdToEgp: fxRate,
      totalIn: 0,
      totalOut: 0,
      netAmount: 0,
      totalMargin: 0,
      marginPercent: 0,
    }),
  };

  const addItem = useCallback(
    (formData: any) => {
      const newItem: Item = {
        id: crypto.randomUUID(),
        origin: formData.origin,
        weightGrams: parseFloat(formData.weightGrams) || 0,
        karat: formData.karat,
        cogsFromTag: formData.cogsFromTag ? parseFloat(formData.cogsFromTag) : undefined,
        sku: formData.sku || undefined,
        category: formData.category,
        source: formData.source,
        isLightPiece: formData.isLightPiece,
        isPackagedBtc: formData.isPackagedBtc,
        calculatedPrice: 0,
        adjustedPrice: 0,
        isLocked: false,
        direction: activeTab === "BUY" ? "IN" : "OUT",
      };

      const price = calculateItemPrice(newItem, transaction);
      newItem.calculatedPrice = price;
      newItem.adjustedPrice = price;

      setItems((prev) => [...prev, newItem]);
    },
    [activeTab, transaction]
  );

  const updateItemPrice = useCallback((id: string, price: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, adjustedPrice: price } : item
      )
    );
  }, []);

  const toggleItemLock = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isLocked: !item.isLocked } : item
      )
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleMasterSlider = useCallback((multiplier: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.isLocked) return item;
        const newPrice = item.calculatedPrice * multiplier;
        return { ...item, adjustedPrice: Math.round(newPrice / 10) * 10 };
      })
    );
  }, []);

  const handleCapture = useCallback((imageData: string) => {
    setShowCamera(false);
    console.log("Captured image, would send to OCR:", imageData.slice(0, 100));
  }, []);

  const toggleLocale = async () => {
    const currentLocale = document.documentElement.lang;
    const newLocale = currentLocale === "ar" ? "en" : "ar";
    await setLocaleCookie(newLocale);
    window.location.reload();
  };

  const clearTransaction = () => {
    setItems([]);
  };

  if (showCamera) {
    return (
      <CameraCapture
        onCapture={handleCapture}
        onCancel={() => setShowCamera(false)}
      />
    );
  }

  return (
    <main className="min-h-screen bg-background pb-48">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <h1 className="text-lg font-bold">{t("common.appName")}</h1>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setShowPrices(!showPrices)}>
              💰
            </Button>
            <Button variant="ghost" size="sm" onClick={toggleLocale}>
              {typeof window !== "undefined" && document.documentElement.lang === "ar" ? "EN" : "ع"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </Button>
          </div>
        </div>
      </header>

      <div className="container px-4 py-4 space-y-4">
        {showPrices && (
          <GoldPriceInput
            prices={goldPrices}
            fxRate={fxRate}
            lastUpdated={lastPriceUpdate}
            onPriceChange={(k, p) =>
              setGoldPrices((prev) => ({ ...prev, [`k${k}`]: p }))
            }
            onFxChange={setFxRate}
            onRefresh={() => {
              setLastPriceUpdate(new Date());
            }}
          />
        )}

        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v as TransactionType);
            clearTransaction();
          }}
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="SELL" className="text-sm">
              {t("transaction.sell")}
            </TabsTrigger>
            <TabsTrigger value="BUY" className="text-sm">
              {t("transaction.buy")}
            </TabsTrigger>
            <TabsTrigger value="TRADE" className="text-sm">
              {t("transaction.trade")}
            </TabsTrigger>
            <TabsTrigger value="FIX" className="text-sm">
              {t("transaction.fix")}
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  <span>{t("transaction.newTransaction")}</span>
                  <div className="flex items-center gap-2">
                    {!customerMode && items.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearTransaction}
                        className="text-xs text-muted-foreground"
                      >
                        Clear
                      </Button>
                    )}
                    <Badge variant="secondary">{t(`transaction.${activeTab.toLowerCase()}`)}</Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    className="h-20 text-base flex-col gap-1"
                    variant="outline"
                    onClick={() => setShowCamera(true)}
                  >
                    <span className="text-2xl">📷</span>
                    <span>{t("common.scan")}</span>
                  </Button>
                  <ManualEntryDialog
                    trigger={
                      <Button className="h-20 text-base flex-col gap-1" variant="outline">
                        <span className="text-2xl">✏️</span>
                        <span>{t("common.manual")}</span>
                      </Button>
                    }
                    onItemAdd={addItem}
                  />
                </div>
              </CardContent>
            </Card>

            {items.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">
                    Items ({items.length})
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Customer View</span>
                    <Switch
                      checked={customerMode}
                      onCheckedChange={setCustomerMode}
                    />
                  </div>
                </div>

                {items.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    goldPrices={goldPrices}
                    onPriceChange={updateItemPrice}
                    onLockToggle={toggleItemLock}
                    onRemove={removeItem}
                    showSlider={!customerMode}
                  />
                ))}
              </div>
            )}
          </div>
        </Tabs>
      </div>

      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <TransactionSummary
            transaction={transaction}
            onMasterSliderChange={handleMasterSlider}
            customerMode={customerMode}
          />
        </div>
      )}
    </main>
  );
}
