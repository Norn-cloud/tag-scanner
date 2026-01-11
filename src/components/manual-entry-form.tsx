"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { type Origin, type Karat, type ItemCategory } from "@/lib/config";

interface ItemFormData {
  origin: Origin;
  weightGrams: string;
  karat: Karat;
  cogsFromTag: string;
  sku: string;
  category: ItemCategory;
  isLightPiece: boolean;
  source: "BTC" | "OTHER" | undefined;
  isPackagedBtc: boolean;
}

const initialFormData: ItemFormData = {
  origin: "IT",
  weightGrams: "",
  karat: 18,
  cogsFromTag: "",
  sku: "",
  category: "JEWELRY",
  isLightPiece: false,
  source: undefined,
  isPackagedBtc: false,
};

interface ManualEntryFormProps {
  onSubmit: (data: ItemFormData) => void;
  onCancel: () => void;
}

export function ManualEntryForm({ onSubmit, onCancel }: ManualEntryFormProps) {
  const t = useTranslations();
  const [formData, setFormData] = useState<ItemFormData>(initialFormData);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const updateField = <K extends keyof ItemFormData>(
    field: K,
    value: ItemFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const showCoinIngotOptions = formData.category === "COIN" || formData.category === "INGOT";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>{t("common.origin")}</Label>
          <div className="grid grid-cols-2 gap-1">
            {(["IT", "EG", "LX", "USED"] as Origin[]).map((origin) => (
              <Button
                key={origin}
                type="button"
                size="sm"
                variant={formData.origin === origin ? "default" : "outline"}
                onClick={() => updateField("origin", origin)}
                className="text-xs"
              >
                {origin === "IT" && t("item.italian")}
                {origin === "EG" && t("item.egyptian")}
                {origin === "LX" && "LX"}
                {origin === "USED" && t("item.used")}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t("common.karat")}</Label>
          <div className="grid grid-cols-3 gap-1">
            {([18, 21, 24] as Karat[]).map((k) => (
              <Button
                key={k}
                type="button"
                size="sm"
                variant={formData.karat === k ? "default" : "outline"}
                onClick={() => updateField("karat", k)}
              >
                {k}K
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>{t("common.weight")} (g)</Label>
          <Input
            type="number"
            step="0.001"
            placeholder="4.380"
            value={formData.weightGrams}
            onChange={(e) => updateField("weightGrams", e.target.value)}
            className="text-lg"
          />
        </div>

        <div className="space-y-2">
          <Label>{t("common.cogs")}</Label>
          <Input
            type="number"
            step="0.01"
            placeholder={formData.origin === "IT" ? "50 USD" : "210 EGP"}
            value={formData.cogsFromTag}
            onChange={(e) => updateField("cogsFromTag", e.target.value)}
            disabled={formData.origin === "USED"}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t("common.category")}</Label>
        <div className="grid grid-cols-4 gap-1">
          {(["JEWELRY", "COIN", "INGOT", "FIX"] as ItemCategory[]).map((cat) => (
            <Button
              key={cat}
              type="button"
              size="sm"
              variant={formData.category === cat ? "default" : "outline"}
              onClick={() => {
                updateField("category", cat);
                if (cat === "COIN") updateField("karat", 21);
                if (cat === "INGOT") updateField("karat", 24);
              }}
              className="text-xs"
            >
              {cat === "JEWELRY" && t("item.jewelry")}
              {cat === "COIN" && t("item.coin")}
              {cat === "INGOT" && t("item.ingot")}
              {cat === "FIX" && t("transaction.fix")}
            </Button>
          ))}
        </div>
      </div>

      {showCoinIngotOptions && (
        <div className="space-y-3 rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <Label>{t("common.source")}</Label>
            <div className="flex gap-1">
              <Button
                type="button"
                size="sm"
                variant={formData.source === "BTC" ? "default" : "outline"}
                onClick={() => updateField("source", "BTC")}
              >
                BTC
              </Button>
              <Button
                type="button"
                size="sm"
                variant={formData.source === "OTHER" ? "default" : "outline"}
                onClick={() => updateField("source", "OTHER")}
              >
                {t("common.other")}
              </Button>
            </div>
          </div>

          {formData.source === "BTC" && (
            <div className="flex items-center justify-between">
              <Label>{t("item.packaged")}</Label>
              <Switch
                checked={formData.isPackagedBtc}
                onCheckedChange={(checked) => updateField("isPackagedBtc", checked)}
              />
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <Label>{t("item.lightPiece")}</Label>
          <p className="text-xs text-muted-foreground">{t("item.lightPieceDesc")}</p>
        </div>
        <Switch
          checked={formData.isLightPiece}
          onCheckedChange={(checked) => updateField("isLightPiece", checked)}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("common.sku")}</Label>
        <Input
          placeholder="16000093"
          value={formData.sku}
          onChange={(e) => updateField("sku", e.target.value)}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          {t("common.cancel")}
        </Button>
        <Button type="submit" className="flex-1">
          {t("common.add")}
        </Button>
      </div>
    </form>
  );
}

interface ManualEntryDialogProps {
  trigger: React.ReactNode;
  onItemAdd: (data: ItemFormData) => void;
}

export function ManualEntryDialog({ trigger, onItemAdd }: ManualEntryDialogProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations();

  const handleSubmit = useCallback(
    (data: ItemFormData) => {
      onItemAdd(data);
      setOpen(false);
    },
    [onItemAdd]
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("common.manual")}</DialogTitle>
        </DialogHeader>
        <ManualEntryForm onSubmit={handleSubmit} onCancel={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
