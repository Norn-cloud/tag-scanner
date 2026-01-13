"use client";

import { useState, useCallback, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useTheme } from "next-themes";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { LoginForm } from "@/components/login-form";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ManualEntryDialog } from "@/components/manual-entry-form";
import { ItemCard } from "@/components/item-card";
import { TransactionSummary } from "@/components/transaction-summary";
import { GoldPriceInput } from "@/components/gold-price-input";
import { CameraCapture } from "@/components/camera-capture";
import { TradeUI } from "@/components/trade-ui";
import { BuyUI } from "@/components/buy-ui";
import { ScanConfirmDialog, type ConfirmedScanData } from "@/components/scan-confirm-dialog";
import { setLocaleCookie } from "@/lib/locale";
import { Settings, Sun, Moon, Camera, PenLine, Loader2, LogOut, Eye, EyeOff, Trash2 } from "lucide-react";
import {
  type Item,
  type TransactionType,
  type GoldPrices,
  type Origin,
  type Condition,
  type Karat,
  type ItemCategory,
  type ItemSource,
  type TransactionContext,
  GOLD_CONFIG,
} from "@/lib/config";
import { calculateTransactionTotals } from "@/lib/pricing";

const defaultGoldPrices: GoldPrices = {
  k18: 3200,
  k21: 3700,
  k24: 4200,
};

export default function Home() {
  const t = useTranslations();
  const locale = useLocale();
  const { theme, setTheme } = useTheme();

  const { data: session, isPending: sessionLoading } = authClient.useSession();

  const [activeTab, setActiveTab] = useState<TransactionType>("SELL");
  const [items, setItems] = useState<Item[]>([]);
  const [goldPrices, setGoldPrices] = useState<GoldPrices>(defaultGoldPrices);
  const [fxRate, setFxRate] = useState(50.5);
  const [lastPriceUpdate, setLastPriceUpdate] = useState<Date | null>(new Date());
  const [customerMode, setCustomerMode] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showPrices, setShowPrices] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showScanConfirm, setShowScanConfirm] = useState(false);
  const [markupMultiplier, setMarkupMultiplier] = useState(1.0);
  const [pendingScan, setPendingScan] = useState<{
    result: { weight?: number; karat?: number; origin?: string; sku?: string; cogs?: number };
    imageData: string;
  } | null>(null);

  const scanTag = useAction(api.ocr.scanTag);
  const fetchPrices = useAction(api.pricesFetch.fetchPrices);

  const ctx: TransactionContext = useMemo(() => ({
    type: activeTab,
    goldPrices,
    fxRate,
    deductionPercent: activeTab === "TRADE" ? 0 : GOLD_CONFIG.deduction.default,
    markupMultiplier,
  }), [activeTab, goldPrices, fxRate, markupMultiplier]);

  const totals = useMemo(() => calculateTransactionTotals(items, ctx), [items, ctx]);

  interface ItemFormData {
    origin: Origin;
    condition: Condition;
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
        condition: formData.condition,
        weightGrams: parseFloat(formData.weightGrams) || 0,
        karat: formData.karat,
        cogsFromTag: formData.cogsFromTag ? parseFloat(formData.cogsFromTag) : undefined,
        sku: formData.sku || undefined,
        category: formData.category,
        source: formData.source,
        isLightPiece: formData.isLightPiece,
        isPackagedBtc: formData.isPackagedBtc,
        direction: itemDirection,
      };

      setItems((prev) => [...prev, newItem]);
    },
    [activeTab]
  );

  const addBuyItem = useCallback(
    (data: { karat: Karat; weightGrams: string }) => {
      const newItem: Item = {
        id: crypto.randomUUID(),
        origin: "EG",
        condition: "USED",
        weightGrams: parseFloat(data.weightGrams) || 0,
        karat: data.karat,
        category: "JEWELRY",
        isLightPiece: false,
        direction: "IN",
      };

      setItems((prev) => [...prev, newItem]);
    },
    []
  );

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleSliderChange = useCallback((value: number) => {
    setMarkupMultiplier(value / 100);
  }, []);

  const handleCapture = useCallback(async (imageData: string) => {
    setShowCamera(false);
    setIsScanning(true);
    
    try {
      const result = await scanTag({ imageBase64: imageData });
      
      setPendingScan({
        result: result.parsed,
        imageData,
      });
      setShowScanConfirm(true);
    } catch (error) {
      console.error("OCR error:", error);
      alert("Scan failed. Please try again or enter manually.");
    } finally {
      setIsScanning(false);
    }
  }, [scanTag]);

  const handleScanConfirm = useCallback((data: ConfirmedScanData) => {
    const newItem: Item = {
      id: crypto.randomUUID(),
      origin: data.origin,
      condition: data.origin === "USED" ? "USED" : "NEW",
      weightGrams: data.weightGrams,
      karat: data.karat,
      cogsFromTag: data.cogsFromTag,
      cogsCurrency: data.cogsCurrency,
      sku: data.sku,
      category: data.category,
      isLightPiece: data.isLightPiece,
      tagImageUrl: data.tagImageUrl,
      direction: activeTab === "BUY" ? "IN" : "OUT",
    };

    setItems((prev) => [...prev, newItem]);
    setPendingScan(null);
  }, [activeTab]);

  const toggleLocale = async () => {
    const newLocale = locale === "ar" ? "en" : "ar";
    await setLocaleCookie(newLocale);
    window.location.reload();
  };

  const clearTransaction = () => {
    setItems([]);
    setMarkupMultiplier(1.0);
  };

  const handleSignOut = async () => {
    await authClient.signOut();
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <LoginForm />;
  }

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
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setCustomerMode(!customerMode)}
              className={customerMode ? "text-primary" : "text-muted-foreground"}
            >
              {customerMode ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowPrices(!showPrices)}>
              <Settings className="h-4 w-4" />
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
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
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
            onRefresh={async () => {
              const result = await fetchPrices({});
              if (result.success && result.goldPrices && result.fxRate) {
                setGoldPrices(result.goldPrices);
                setFxRate(result.fxRate);
                setLastPriceUpdate(new Date());
              }
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="SELL" className="text-sm">
              {t("transaction.sell")}
            </TabsTrigger>
            <TabsTrigger value="BUY" className="text-sm">
              {t("transaction.buy")}
            </TabsTrigger>
            <TabsTrigger value="TRADE" className="text-sm">
              {t("transaction.trade")}
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 space-y-4">
            {activeTab === "TRADE" ? (
              <TradeUI
                items={items}
                ctx={ctx}
                onAddItem={addItem}
                onRemoveItem={removeItem}
                onShowCamera={() => setShowCamera(true)}
              />
            ) : activeTab === "BUY" ? (
              <BuyUI
                items={items}
                ctx={ctx}
                onAddItem={addBuyItem}
                onRemoveItem={removeItem}
                onClear={clearTransaction}
              />
            ) : (
              <>
                {!customerMode && (
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      className="h-12 text-sm gap-2 shadow-sm"
                      onClick={() => setShowCamera(true)}
                    >
                      <Camera className="h-4 w-4" />
                      <span>{t("common.scan")}</span>
                    </Button>
                    <ManualEntryDialog
                      trigger={
                        <Button className="h-12 text-sm gap-2 shadow-sm" variant="outline">
                          <PenLine className="h-4 w-4" />
                          <span>{t("common.manual")}</span>
                        </Button>
                      }
                      onItemAdd={(formData) => addItem(formData)}
                    />
                  </div>
                )}

                {items.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">
                        {t("common.items")} ({items.length})
                      </h3>
                      {!customerMode && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearTransaction}
                          className="h-6 text-xs text-muted-foreground hover:text-destructive gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          {t("common.clear")}
                        </Button>
                      )}
                    </div>

                    {items.map((item) => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        ctx={ctx}
                        onRemove={removeItem}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </Tabs>
      </div>

      {items.length > 0 && activeTab !== "TRADE" && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <TransactionSummary
            totals={totals}
            type={activeTab}
            sliderValue={Math.round(markupMultiplier * 100)}
            onSliderChange={handleSliderChange}
            customerMode={customerMode}
          />
        </div>
      )}

      {pendingScan && (
        <ScanConfirmDialog
          open={showScanConfirm}
          onOpenChange={setShowScanConfirm}
          scanResult={pendingScan.result}
          imageData={pendingScan.imageData}
          onConfirm={handleScanConfirm}
        />
      )}

      {isScanning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm text-muted-foreground">Scanning tag...</p>
          </div>
        </div>
      )}
    </main>
  );
}
