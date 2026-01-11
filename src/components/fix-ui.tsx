"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Wrench, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { GOLD_CONFIG, type GoldPrices, type Karat } from "@/lib/config";

interface FixUIProps {
  goldPrices: GoldPrices;
  onComplete: (fixData: FixData) => void;
}

export interface FixData {
  description: string;
  baseFee: number;
  weightAddedGrams: number;
  karat: Karat;
  totalPrice: number;
}

const FIX_TYPES = [
  { id: "resize", labelKey: "fix.resize" },
  { id: "polish", labelKey: "fix.polish" },
  { id: "repair", labelKey: "fix.repair" },
  { id: "solder", labelKey: "fix.solder" },
  { id: "stone", labelKey: "fix.stoneReset" },
  { id: "custom", labelKey: "fix.custom" },
] as const;

export function FixUI({ goldPrices, onComplete }: FixUIProps) {
  const t = useTranslations();
  
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [baseFee, setBaseFee] = useState<number>(GOLD_CONFIG.fixes.defaultEgp);
  const [weightAdded, setWeightAdded] = useState(0);
  const [karat, setKarat] = useState<Karat>(18);
  const [customDescription, setCustomDescription] = useState("");

  const goldCost = weightAdded * goldPrices[`k${karat}`];
  const totalPrice = baseFee + goldCost;

  const adjustFee = (delta: number) => {
    const newFee = Math.max(GOLD_CONFIG.fixes.minEgp, Math.min(GOLD_CONFIG.fixes.maxEgp, baseFee + delta));
    setBaseFee(newFee);
  };

  const adjustWeight = (delta: number) => {
    const newWeight = Math.max(0, weightAdded + delta);
    setWeightAdded(parseFloat(newWeight.toFixed(1)));
  };

  const handleComplete = () => {
    if (!selectedType) return;
    
    onComplete({
      description: selectedType === "custom" ? customDescription : t(`fix.${selectedType}`),
      baseFee,
      weightAddedGrams: weightAdded,
      karat,
      totalPrice,
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wrench className="h-5 w-5" />
            {t("transaction.fix")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">
              {t("fix.selectType")}
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {FIX_TYPES.map((type) => (
                <Button
                  key={type.id}
                  variant={selectedType === type.id ? "default" : "outline"}
                  className={cn(
                    "h-12 text-sm",
                    selectedType === type.id && "bg-blue-600 hover:bg-blue-700"
                  )}
                  onClick={() => setSelectedType(type.id)}
                >
                  {t(type.labelKey)}
                </Button>
              ))}
            </div>
          </div>

          {selectedType === "custom" && (
            <div>
              <Label htmlFor="custom-desc">{t("fix.description")}</Label>
              <Input
                id="custom-desc"
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder={t("fix.descriptionPlaceholder")}
                className="mt-1"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {selectedType && (
        <>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t("fix.serviceFee")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => adjustFee(-50)}
                  disabled={baseFee <= GOLD_CONFIG.fixes.minEgp}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <div className="text-center">
                  <span className="text-2xl font-bold">{baseFee}</span>
                  <span className="text-sm text-muted-foreground ml-1">{t("common.egp")}</span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => adjustFee(50)}
                  disabled={baseFee >= GOLD_CONFIG.fixes.maxEgp}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                {t("fix.feeRange", { min: GOLD_CONFIG.fixes.minEgp, max: GOLD_CONFIG.fixes.maxEgp })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t("fix.goldAdded")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => adjustWeight(-0.1)}
                  disabled={weightAdded <= 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <div className="text-center">
                  <span className="text-2xl font-bold">{weightAdded.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground ml-1">{t("common.grams")}</span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => adjustWeight(0.1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {weightAdded > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">{t("common.karat")}</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {([18, 21, 24] as Karat[]).map((k) => (
                      <Button
                        key={k}
                        variant={karat === k ? "default" : "outline"}
                        size="sm"
                        onClick={() => setKarat(k)}
                      >
                        {k}K
                      </Button>
                    ))}
                  </div>
                  <div className="flex justify-between text-sm pt-2">
                    <span className="text-muted-foreground">{t("fix.goldCost")}</span>
                    <span className="font-medium text-amber-600">
                      +{goldCost.toLocaleString()} {t("common.egp")}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-500/50 bg-blue-500/5">
            <CardContent className="py-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("fix.serviceFee")}</span>
                  <span>{baseFee.toLocaleString()} {t("common.egp")}</span>
                </div>
                {weightAdded > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("fix.goldAdded")} ({weightAdded}g × {karat}K)
                    </span>
                    <span className="text-amber-600">+{goldCost.toLocaleString()} {t("common.egp")}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between items-center pt-1">
                  <span className="font-medium">{t("common.total")}</span>
                  <span className="text-xl font-bold text-blue-600">
                    {totalPrice.toLocaleString()} {t("common.egp")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700"
            onClick={handleComplete}
            disabled={selectedType === "custom" && !customDescription.trim()}
          >
            {t("fix.confirmFix")}
          </Button>
        </>
      )}
    </div>
  );
}
