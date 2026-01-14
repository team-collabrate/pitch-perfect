"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import {
  Coffee,
  Soup,
  Utensils,
  IceCream,
  CupSoda,
  Sandwich,
  Flame,
  ChevronRight,
  MapPin,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";
import { useLanguage } from "~/lib/language-context";
import { allTranslations } from "~/lib/translations/all";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";

const MENU_DATA = {
  hot_beverages: [
    { item: "Chai", price: 15 },
    { item: "Masala Chai", price: 20 },
    { item: "Coffee", price: 15 },
    { item: "Milk", price: 15 },
    { item: "Badam Milk", price: 20 },
    { item: "Boost", price: 20 },
    { item: "Horlicks", price: 20 },
    { item: "Milo", price: 20 },
  ],
  maggie_varieties: [
    { item: "Plain Maggie", price: 40 },
    { item: "Egg Maggie Single", price: 50 },
    { item: "Egg Maggie Double", price: 75 },
    { item: "Cheese Maggie", price: 60 },
    { item: "Viral Cheese Maggie", price: 99 },
  ],
  soups: [
    { item: "Veg Soup", price: 25 },
    { item: "Mushroom Soup", price: 30 },
    { item: "Vaazhaithandu Soup", price: 30 },
    { item: "Mudavatukal Soup", price: 70 },
    { item: "Thuthuvalai Soup", price: 25 },
    { item: "Herbal Soup", price: 30 },
  ],
  momos: [
    { item: "Veg Momos (Steamed)", price: 90 },
    { item: "Chicken Momos (Steamed)", price: 100 },
    { item: "Veg Momos (Fried)", price: 110 },
    { item: "Chicken Momos (Fried)", price: 120 },
  ],
  fries: [
    { item: "French Fries", price: 75 },
    { item: "Peri Peri Fries", price: 85 },
    { item: "Smiles", price: 70 },
  ],
  loaded_chicken: [
    { item: "Nachos Loaded Chicken", price: 119 },
    { item: "Lays Loaded Chicken", price: 119 },
    { item: "French Fries Loaded Chicken", price: 100 },
  ],
  rice_and_noodles: [
    { item: "Chicken Rice", price: 100 },
    { item: "Chicken Rice Combo (Rice + Chicken 65)", price: 140 },
    { item: "Schezwan Chicken Rice", price: 120 },
    { item: "Veg Rice", price: 70 },
    { item: "Egg Rice", price: 85 },
    { item: "Chicken Noodles", price: 110 },
    { item: "Schezwan Chicken Noodles", price: 120 },
  ],
  fried_specials: [
    { item: "Chicken 65", price: 140 },
    { item: "Gobi 65", price: 110 },
    { item: "Paneer 65", price: 120 },
    { item: "Mushroom 65", price: 120 },
  ],
  sandwiches: [
    { item: "Veg Sandwich", price: 50 },
    { item: "Cheese Sandwich", price: 60 },
    { item: "Egg Sandwich", price: 70 },
    { item: "Chicken Sandwich", price: 80 },
    { item: "Bread Omelette", price: 70 },
  ],
  snacks: [
    { item: "Egg Pejo", price: 30 },
    { item: "Bun Muska", price: 30 },
    { item: "Bun Butter", price: 40 },
    { item: "Pani Puri", price: 20 },
    { item: "Dahi Puri", price: 25 },
    { item: "Bhel Puri", price: 30 },
  ],
  chicken_varieties: [
    { item: "Chicken Popcorn", price: 80 },
    { item: "Chicken Bites", price: 100 },
    { item: "Chicken Samosa", price: 80 },
    { item: "Chicken Wings", price: 110 },
    { item: "Chicken Drumstick (Single Piece)", price: 100 },
  ],
  ice_cream: [
    { item: "Vanilla", price: 30 },
    { item: "Chocolate", price: 35 },
  ],
  cold_beverages: [
    { item: "Cold Coffee", price: 90 },
    { item: "Mint Mojito", price: 80 },
    { item: "Blue Curacao", price: 85 },
  ],
};

const CATEGORY_ICONS: Record<string, any> = {
  hot_beverages: Coffee,
  maggie_varieties: Flame,
  soups: Soup,
  chicken_varieties: Utensils,
  momos: Utensils,
  fries: Utensils,
  loaded_chicken: Flame,
  ice_cream: IceCream,
  cold_beverages: CupSoda,
  sandwiches: Sandwich,
  rice_and_noodles: Utensils,
  fried_specials: Flame,
  snacks: Utensils,
};

export default function CafeMenuPage() {
  const { language } = useLanguage();

  const t = allTranslations.cafe[language];

  return (
    <div className="flex flex-col gap-6 px-4 pb-12">
      <div className="mt-2">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-muted-foreground -ml-2 gap-1 px-2"
        >
          <Link href="/home">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-2"
      >
        <div className="flex items-center gap-2">
          <div className="bg-primary/20 flex h-12 w-12 items-center justify-center rounded-2xl">
            <Utensils className="text-primary h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>
            <div className="text-muted-foreground flex items-center gap-1 text-sm">
              <MapPin className="h-3 w-3" />
              {t.location}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Menu Categories */}
      <div className="flex flex-col gap-8">
        {Object.entries(MENU_DATA).map(([category, items], idx) => {
          const Icon = CATEGORY_ICONS[category] || Utensils;
          return (
            <motion.section
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="flex flex-col gap-3"
            >
              <div className="flex items-center gap-2">
                <div className="bg-secondary/50 flex h-8 w-8 items-center justify-center rounded-lg">
                  <Icon className="text-secondary-foreground h-4 w-4" />
                </div>
                <h2 className="text-lg font-semibold capitalize">
                  {/* @ts-ignore */}
                  {t.categories[category]}
                </h2>
                <div className="bg-border h-px flex-1" />
              </div>

              <div className="grid gap-2">
                {items.map((item, itemIdx) => (
                  <Card
                    key={`${category}-${itemIdx}`}
                    className="bg-secondary/10 overflow-hidden border-none py-2 shadow-none"
                  >
                    <CardContent className="flex items-center justify-between">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">{item.item}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.price ? (
                          <span className="text-primary font-bold">
                            {t.currency}
                            {item.price}
                          </span>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">
                            coming soon
                          </Badge>
                        )}
                        <ChevronRight className="text-muted-foreground/30 h-4 w-4" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.section>
          );
        })}
      </div>
    </div>
  );
}
