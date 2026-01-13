import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Tag } from "lucide-react";
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
    <Card className="relative overflow-hidden transition-all hover:bg-muted/50 group border-l-4 border-l-transparent hover:border-l-primary/50">
      <div className="flex items-center p-3 gap-3">
        <div className="flex-shrink-0">
          {item.tagImageUrl ? (
            <div className="h-10 w-10 rounded-md overflow-hidden border bg-background relative">
              <img
                src={item.tagImageUrl}
                alt="Tag"
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="h-10 w-10 rounded-md border bg-muted flex items-center justify-center text-muted-foreground">
              <Tag className="h-5 w-5" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-base">{item.karat}K</span>
            <span className="text-sm font-medium">{item.weightGrams.toFixed(2)}g</span>
            <span className="text-xs text-muted-foreground truncate max-w-[100px]">
              {item.sku ? `#${item.sku}` : item.category}
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
            <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-normal tracking-wide uppercase shrink-0">
              {item.origin}
            </Badge>
            <Badge 
              variant={item.condition === "USED" ? "secondary" : "outline"}
              className="h-5 px-1.5 text-[10px] font-normal tracking-wide uppercase shrink-0"
            >
              {item.condition === "USED" ? "USED" : "NEW"}
            </Badge>
            {item.isLightPiece && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] shrink-0">
                LIGHT
              </Badge>
            )}
            {item.direction === "IN" && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] shrink-0">
                IN
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {showPrice && (
            <div className="text-right">
              <div className="font-bold tabular-nums text-lg leading-none">
                {price.toLocaleString("en-EG")}
              </div>
              <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">
                EGP
              </div>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(item.id)}
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mr-1"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
