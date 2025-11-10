import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ShoppingCart, Leaf, Plus, Minus } from "lucide-react";

const PRODUCTS = [
  {
    id: 'fur_fresh',
    name: 'Rinse-Free Fur Fresh!',
    description: 'Designed to clean your pet\'s coat without the need for water. The foam cleanser works by lifting dirt and grime from your pet\'s fur, leaving it clean, soft, and smelling fresh. The no-rinse foam formula is ideal for pets who dislike water or those who require a quick clean-up between baths. Gentle on your pet\'s skin and coat.',
    originalPrice: 48,
    discountedPrice: 40.80,
    imageUrl: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690f36a014bb3e1119479c64/9c6ac8266_Rinsefreefurfresh.png'
  },
  {
    id: 'paw_protect',
    name: 'Paw Protéct 3-in-1 Cleanser',
    description: 'The rinse-free Paw Protéct 3-in-1 Cleanser is formulated with gentle yet effective ingredients that help cleanse, protect, and moisturise your dog\'s paws. The non-irritating foaming formula is safe for all skin types. Say goodbye to dirty paws and hello to a more convenient and efficient way of keeping your dog\'s paws clean and fresh.',
    originalPrice: 48,
    discountedPrice: 40.80,
    imageUrl: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690f36a014bb3e1119479c64/142401e31_PawProtect.png'
  },
  {
    id: 'flea_tick',
    name: 'Flea & Tick Defence Plus',
    description: 'Our innovative foam formula provides a powerful shield against fleas and ticks. It uses a natural blend of ingredients to create an environment that repels these pests, keeping your dog safe and comfortable. Free from harsh chemicals, pesticides, and artificial fragrances, it\'s gentle on your dog\'s skin and suitable for everyday use.',
    originalPrice: 42,
    discountedPrice: 35.70,
    imageUrl: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690f36a014bb3e1119479c64/f06c467f8_flea.png'
  }
];

export default function ProductSelection({ formData, setFormData, onNext, onBack }) {
  const [quantities, setQuantities] = useState(
    formData.productSelections?.reduce((acc, item) => {
      acc[item.product_id] = item.quantity;
      return acc;
    }, {}) || {}
  );

  const handleQuantityChange = (productId, change) => {
    setQuantities(prev => {
      const currentQty = prev[productId] || 0;
      const newQty = Math.max(0, currentQty + change);
      return { ...prev, [productId]: newQty };
    });
  };

  const calculateTotal = () => {
    return PRODUCTS.reduce((total, product) => {
      const qty = quantities[product.id] || 0;
      return total + (product.discountedPrice * qty);
    }, 0);
  };

  const getSelectedCount = () => {
    return Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
  };

  const handleContinue = () => {
    const selectedProducts = PRODUCTS.map(product => ({
      product_id: product.id,
      product_name: product.name,
      quantity: quantities[product.id] || 0,
      original_price: product.originalPrice,
      discounted_price: product.discountedPrice
    })).filter(item => item.quantity > 0);

    setFormData({
      ...formData,
      productSelections: selectedProducts,
      productsTotal: calculateTotal()
    });
    
    onNext();
  };

  const handleSkip = () => {
    setFormData({
      ...formData,
      productSelections: [],
      productsTotal: 0
    });
    onNext();
  };

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              Premium Care Products
            </CardTitle>
            <p className="text-sm text-slate-600 mt-1">
              Special 15% discount for booking clients!
            </p>
          </div>
          {getSelectedCount() > 0 && (
            <Badge className="bg-blue-600">
              {getSelectedCount()} item{getSelectedCount() > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 md:p-6 space-y-4">
        {/* Product Benefits Banner */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 md:p-4">
          <div className="flex items-start gap-3">
            <Leaf className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-green-900 mb-1">🌱 100% Vegan • 🤲 Handcrafted • ♻️ Biodegradable</p>
              <p className="text-green-800">All products are gentle, eco-friendly, and made with love for your furry friend.</p>
            </div>
          </div>
        </div>

        {/* Products List */}
        <div className="space-y-4">
          {PRODUCTS.map((product) => {
            const qty = quantities[product.id] || 0;
            const savings = product.originalPrice - product.discountedPrice;

            return (
              <div
                key={product.id}
                className={`border rounded-lg p-4 transition-all ${
                  qty > 0 ? 'border-blue-300 bg-blue-50/50' : 'border-slate-200'
                }`}
              >
                <div className="space-y-3">
                  {/* Product Header with Image */}
                  <div className="flex items-start gap-4">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-20 h-20 md:w-24 md:h-24 object-contain rounded-lg bg-white"
                      />
                    </div>
                    
                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 text-base md:text-lg">
                        {product.name}
                      </h3>
                      <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                        {product.description}
                      </p>
                    </div>
                  </div>

                  {/* Pricing and Quantity */}
                  <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-100">
                    <div className="space-y-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg md:text-xl font-bold text-blue-600">
                          ${product.discountedPrice.toFixed(2)}
                        </span>
                        <span className="text-xs md:text-sm text-slate-500 line-through">
                          ${product.originalPrice.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-green-600" />
                        <span className="text-xs text-green-700 font-medium">
                          Save ${savings.toFixed(2)} (15% off)
                        </span>
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 md:h-9 md:w-9"
                        onClick={() => handleQuantityChange(product.id, -1)}
                        disabled={qty === 0}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-8 md:w-10 text-center font-semibold text-base md:text-lg">
                        {qty}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 md:h-9 md:w-9"
                        onClick={() => handleQuantityChange(product.id, 1)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total Summary */}
        {getSelectedCount() > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Products Subtotal</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {getSelectedCount()} item{getSelectedCount() > 1 ? 's' : ''} • 15% discount applied
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">
                  ${calculateTotal().toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info Note */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-600">
          <p className="flex items-start gap-2">
            <span className="text-slate-400">ℹ️</span>
            <span>
              These products are optional. You can skip this step if you prefer not to purchase any products at this time.
            </span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex-1 text-sm md:text-base"
          >
            Back
          </Button>
          <Button
            variant="outline"
            onClick={handleSkip}
            className="flex-1 text-sm md:text-base"
          >
            Skip Products
          </Button>
          <Button
            onClick={handleContinue}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-sm md:text-base"
          >
            {getSelectedCount() > 0 ? 'Continue' : 'Continue without Products'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}