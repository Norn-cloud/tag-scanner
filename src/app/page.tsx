"use client";

import { useState, useCallback, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ManualEntryDialog } from "@/components/manual-entry-form";
import { ItemCard } from "@/components/item-card";
import { TransactionSummary } from "@/components/transaction-summary";
import { GoldPriceInput } from "@/components/gold-price-input";
import { CameraCapture } from "@/components/camera-capture";
import { TradeUI } from "@/components/trade-ui";
import { FixUI, type FixData } from "@/components/fix-ui";
import { setLocaleCookie } from "@/lib/locale";
import { Coins, Sun, Moon, Camera, PenLine } from "lucide-react";
import {
  type Item,
  type Transaction,
  type TransactionType,
  type GoldPrices,
  type Origin,
  type Karat,
  type ItemCategory,
  type ItemSource,
} from "@/lib/config";
import { calculateItemPrice, calculateTransactionTotals } from "@/lib/pricing";

const defaultGoldPrices: GoldPrices = {
  k18: 3200,
  k21: 3700,
  k24: 4200,
};

export default function Home() {
  const t = useTranslations();
  const locale = useLocale();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<TransactionType>("SELL");
  const [items, setItems] = useState<Item[]>([]);
  const [goldPrices, setGoldPrices] = useState<GoldPrices>(defaultGoldPrices);
  const [fxRate, setFxRate] = useState(50.5);
  const [lastPriceUpdate, setLastPriceUpdate] = useState<Date | null>(new Date());
  const [customerMode, setCustomerMode] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showPrices, setShowPrices] = useState(false);

  const transactionBase = useMemo(() => ({
    id: "draft" as const,
    type: activeTab,
    deductionPercent: activeTab === "TRADE" ? 0 : 0.02,
    goldPricePerGram: goldPrices,
    fxRateUsdToEgp: fxRate,
  }), [activeTab, goldPrices, fxRate]);

  const transaction: Transaction = useMemo(() => ({
    ...transactionBase,
    items,
    ...calculateTransactionTotals({
      ...transactionBase,
      items,
      totalIn: 0,
      totalOut: 0,
      netAmount: 0,
      totalMargin: 0,
      marginPercent: 0,
    }),
  }), [transactionBase, items]);

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

  const addItem = useCallback(
    (formData: ItemFormData, direction?: "IN" | "OUT") => {
      const itemDirection = direction ?? (activeTab === "BUY" ? "IN" : "OUT");
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
        direction: itemDirection,
      };

      const price = calculateItemPrice(newItem, { ...transactionBase, items: [], totalIn: 0, totalOut: 0, netAmount: 0, totalMargin: 0, marginPercent: 0 });
      newItem.calculatedPrice = price;
      newItem.adjustedPrice = price;

      setItems((prev) => [...prev, newItem]);
    },
    [activeTab, transactionBase]
  );

  const [fixResult, setFixResult] = useState<FixData | null>(null);

  const handleFixComplete = useCallback((data: FixData) => {
    setFixResult(data);
  }, []);

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
    const newLocale = locale === "ar" ? "en" : "ar";
    await setLocaleCookie(newLocale);
    window.location.reload();
  };

  const clearTransaction = () => {
    setItems([]);
    setFixResult(null);
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
              <Coins className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={toggleLocale}>
              {locale === "ar" ? "EN" : "ع"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
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
            {activeTab === "TRADE" ? (
              <TradeUI
                items={items}
                goldPrices={goldPrices}
                onAddItem={addItem}
                onUpdatePrice={updateItemPrice}
                onToggleLock={toggleItemLock}
                onRemoveItem={removeItem}
                onShowCamera={() => setShowCamera(true)}
                customerMode={customerMode}
              />
            ) : activeTab === "FIX" ? (
              fixResult ? (
                <Card className="border-2 border-blue-500/50 bg-blue-500/5">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>{t("fix.confirmFix")}</span>
                      <Button variant="ghost" size="sm" onClick={clearTransaction}>
                        {t("common.clear")}
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("fix.description")}</span>
                      <span>{fixResult.description}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("fix.serviceFee")}</span>
                      <span>{fixResult.baseFee} {t("common.egp")}</span>
                    </div>
                    {fixResult.weightAddedGrams > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("fix.goldAdded")}</span>
                        <span className="text-amber-600">
                          {fixResult.weightAddedGrams}g @ {fixResult.karat}K
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t">
                      <span className="font-medium">{t("common.total")}</span>
                      <span className="text-xl font-bold text-blue-600">
                        {fixResult.totalPrice.toLocaleString()} {t("common.egp")}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <FixUI goldPrices={goldPrices} onComplete={handleFixComplete} />
              )
            ) : (
              <>
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
                            {t("common.clear")}
                          </Button>
                        )}
                        <Badge variant="secondary">{t(`transaction.${activeTab.toLowerCase()}`)}</Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        className="h-20 text-base flex-col gap-2"
                        variant="outline"
                        onClick={() => setShowCamera(true)}
                      >
                        <Camera className="h-6 w-6" />
                        <span>{t("common.scan")}</span>
                      </Button>
                      <ManualEntryDialog
                        trigger={
                          <Button className="h-20 text-base flex-col gap-2" variant="outline">
                            <PenLine className="h-6 w-6" />
                            <span>{t("common.manual")}</span>
                          </Button>
                        }
                        onItemAdd={(formData) => addItem(formData)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {items.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">
                        {t("common.items")} ({items.length})
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{t("common.customerView")}</span>
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
              </>
            )}
          </div>
        </Tabs>
      </div>

      {items.length > 0 && activeTab !== "FIX" && activeTab !== "TRADE" && (
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
