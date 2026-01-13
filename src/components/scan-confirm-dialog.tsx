"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, X, AlertTriangle } from "lucide-react";
import type { Origin, Karat, ItemCategory } from "@/lib/config";

interface ScanResult {
  weight?: number;
  karat?: number;
  sku?: string;
  cogs?: number;
}

interface ScanConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scanResult: ScanResult;
  imageData: string;
  onConfirm: (data: ConfirmedScanData) => void;
}

export interface ConfirmedScanData {
  origin: Origin;
  weightGrams: number;
  karat: Karat;
  cogsFromTag?: number;
  sku?: string;
  category: ItemCategory;
  isLightPiece: boolean;
  tagImageUrl: string;
}

export function ScanConfirmDialog({
  open,
  onOpenChange,
  scanResult,
  imageData,
  onConfirm,
}: ScanConfirmDialogProps) {
  const [origin, setOrigin] = useState<Origin>("EG");
  const [weight, setWeight] = useState(scanResult.weight?.toString() ?? "");
  const [karat, setKarat] = useState<Karat>(
    (scanResult.karat as Karat) ?? 21
  );
  const [cogs, setCogs] = useState(scanResult.cogs?.toString() ?? "");
  const [sku, setSku] = useState(scanResult.sku ?? "");
  const [category, setCategory] = useState<ItemCategory>("JEWELRY");
  const [isLightPiece, setIsLightPiece] = useState(false);

  const weightNum = parseFloat(weight) || 0;
  const cogsNum = parseFloat(cogs) || undefined;
  const isValid = weightNum > 0;

  const handleConfirm = () => {
    if (!isValid) return;

    onConfirm({
      origin,
      weightGrams: weightNum,
      karat,
      cogsFromTag: cogsNum,
      sku: sku || undefined,
      category,
      isLightPiece,
      tagImageUrl: imageData,
    });
    onOpenChange(false);
  };

  const inferOriginFromCogs = () => {
    if (!cogsNum) return "USED";
    if (cogsNum < 100) return "IT";
    return "EG";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confirm Scanned Data</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg overflow-hidden border bg-muted/50">
            <img
              src={imageData}
              alt="Scanned tag"
              className="w-full h-32 object-contain"
            />
          </div>

          {!scanResult.weight && (
            <div className="flex items-center gap-2 p-2 rounded-md bg-yellow-500/10 text-yellow-600 text-sm">
              <AlertTriangle className="h-4 w-4" />
              <span>Could not detect weight - please enter manually</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="weight">Weight (g)</Label>
              <Input
                id="weight"
                type="number"
                step="0.001"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="0.000"
                className={!weightNum ? "border-red-500" : ""}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="karat">Karat</Label>
              <Select
                value={karat.toString()}
                onValueChange={(v) => setKarat(parseInt(v) as Karat)}
              >
                <SelectTrigger id="karat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="18">18K</SelectItem>
                  <SelectItem value="21">21K</SelectItem>
                  <SelectItem value="24">24K</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="origin">Origin</Label>
              <Select
                value={origin}
                onValueChange={(v) => setOrigin(v as Origin)}
              >
                <SelectTrigger id="origin">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IT">Italian (IT)</SelectItem>
                  <SelectItem value="EG">Egyptian (EG)</SelectItem>
                  <SelectItem value="LX">Lux (LX)</SelectItem>
                  <SelectItem value="USED">Used</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cogs">COGS</Label>
              <Input
                id="cogs"
                type="number"
                step="0.01"
                value={cogs}
                onChange={(e) => setCogs(e.target.value)}
                placeholder={origin === "IT" ? "USD" : "EGP"}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as ItemCategory)}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JEWELRY">Jewelry</SelectItem>
                  <SelectItem value="COIN">Coin</SelectItem>
                  <SelectItem value="INGOT">Ingot</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <Label htmlFor="light-piece" className="cursor-pointer">
              Light Piece (higher markup)
            </Label>
            <Switch
              id="light-piece"
              checked={isLightPiece}
              onCheckedChange={setIsLightPiece}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!isValid}>
            <Check className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
