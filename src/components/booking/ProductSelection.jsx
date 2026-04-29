import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, ShoppingCart, Plus, Minus, Maximize2, ChevronLeft, ChevronRight, Gift } from "lucide-react";

const COMPLIMENTARY_IDS = ['flea_tick'];

const PRODUCTS = [
  {
    id: 'fur_fresh',
    name: 'Rinse-Free Fur Fresh!',
    description: "Designed to clean your pet's coat without the need for water. The foam cleanser works by lifting dirt and grime from your pet's fur, leaving it clean, soft, and smelling fresh. The no-rinse foam formula is ideal for pets who dislike water or those who require a quick clean-up between baths. Gentle on your pet's skin and coat.",
    originalPrice: 38,
    discountedPrice: 30.40,
    discountPercent: 20,
    showEcoLabel: true,
    imageUrls: [
      'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690f36a014bb3e1119479c64/9c6ac8266_Rinsefreefurfresh.png',
      'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690f36a014bb3e1119479c64/08857c17b_RinseFreeFurFresh.jpg'
    ]
  },
  {
    id: 'paw_protect',
    name: 'Paw Protéct 3-in-1 Cleanser',
    description: "The rinse-free Paw Protéct 3-in-1 Cleanser is formulated with gentle yet effective ingredients that help cleanse, protect, and moisturise your dog's paws. The non-irritating foaming formula is safe for all skin types. Say goodbye to dirty paws and hello to a more convenient and efficient way of keeping your dog's paws clean and fresh.",
    originalPrice: 38,
    discountedPrice: 30.40,
    discountPercent: 20,
    showEcoLabel: true,
    imageUrls: [
      'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690f36a014bb3e1119479c64/142401e31_PawProtect.png',
      'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690f36a014bb3e1119479c64/69e87cf70_PawCleanser1.jpg'
    ]
  },
  {
    id: 'flea_tick',
    name: 'Flea & Tick Defence Plus',
    description: "Our innovative foam formula provides a powerful shield against fleas and ticks. It uses a natural blend of ingredients to create an environment that repels these pests, keeping your dog safe and comfortable. Free from harsh chemicals, pesticides, and artificial fragrances, it's gentle on your dog's skin and suitable for everyday use.",
    originalPrice: 32,
    discountedPrice: 25.60,
    discountPercent: 20,
    showEcoLabel: true,
    imageUrls: [
      'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690f36a014bb3e1119479c64/f06c467f8_flea.png',
      'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690f36a014bb3e1119479c64/0effce2ad_RinseFreeFurFresh1.jpg'
    ]
  },
  {
    id: 'puppy_kit_small',
    name: 'Puppy Playtime Starter Kit – S',
    description: 'A set of toys specially selected to help puppies engage in safe and fun playtime activities. Includes chew toys, plush toys, and interactive toys for different textures and sounds. Perfect for new puppy guardians! Bundle includes: Lion Plush Friendz Squeaker, Suppa Puppa Racoon Squeaker/Crinkle, Wooden Chew (XS), GiGwi Ball w/Squeaker (S), and GiGwi Bulb Rubber Treats Dispenser (S). Suitable for small breeds like Pomeranian, Chihuahua, Shih Tzu, Toy Poodle & Maltese.',
    originalPrice: 50.35,
    discountedPrice: 45.32,
    discountPercent: 10,
    showEcoLabel: false,
    imageUrls: [
      'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690f36a014bb3e1119479c64/585e2cd8b_Screenshot2025-11-13001718.png',
      'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690f36a014bb3e1119479c64/6376be453_Screenshot2025-11-13001731.png',
      'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690f36a014bb3e1119479c64/18f2f2e44_Screenshot2025-11-13001751.png',
      'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690f36a014bb3e1119479c64/73ec49b2d_Screenshot2025-11-13001807.png',
      'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690f36a014bb3e1119479c64/2cec983d0_8508-3.png'
    ]
  },
  {
    id: 'puppy_kit_medium',
    name: 'Puppy Playtime Starter Kit – M',
    description: 'A set of toys specially selected to help puppies engage in safe and fun playtime activities. Includes chew toys, plush toys, and interactive toys for different textures and sounds. Perfect for new puppy guardians! Bundle includes: Plush Friendz Elephant w/Squeaker, Crinkle & TPR Stick, Plush Friendz Monkey w/Squeaker/Crinkle Paper, Wooden Chew (M), GiGwi Ball w/Squeaker (M), and GiGwi Bulb Rubber Treats Dispenser (M). Suitable for medium breeds like Shiba Inu, Corgi, Beagle, Border Collie & Australian Shepherd.',
    originalPrice: 64.35,
    discountedPrice: 57.92,
    discountPercent: 10,
    showEcoLabel: false,
    imageUrls: []
  },
  {
    id: 'puppy_kit_large',
    name: 'Puppy Playtime Starter Kit – L',
    description: 'A set of toys specially selected to help puppies engage in safe and fun playtime activities. Includes chew toys, plush toys, and interactive toys for different textures and sounds. Perfect for new puppy guardians! Bundle includes: Crunchy Plush Friendz Duck w/bone & squeaker, Shaking Fun Lion, Wooden Chew (M), GiGwi Ball w/Squeaker (L), and Toothbrush Rubber Dental Chew w/cracking sound. Suitable for large breeds like Golden Retrievers, German Shepherds, Rottweilers, Siberian Huskies & Bernese Mountain Dog.',
    originalPrice: 76.25,
    discountedPrice: 68.63,
    discountPercent: 10,
    showEcoLabel: false,
    imageUrls: []
  }
];

export default function ProductSelection({ formData, setFormData, onNext, onBack }) {
  const isKinderPuppy = formData.serviceType === 'kinder_puppy_in_home' || formData.serviceType === 'kinder_puppy_fyog';

  const [selectedComplimentary, setSelectedComplimentary] = useState(() => {
    const prev = formData.productSelections?.find(item => {
      const product = PRODUCTS.find(p => p.name === item.product_name);
      return product && COMPLIMENTARY_IDS.includes(product.id) && item.discounted_price === 0;
    });
    if (prev) {
      const product = PRODUCTS.find(p => p.name === prev.product_name);
      return product?.id || null;
    }
    return null;
  });

  const [quantities, setQuantities] = useState(
    formData.productSelections?.reduce((acc, item) => {
      const product = PRODUCTS.find(p => p.name === item.product_name);
      if (product && !COMPLIMENTARY_IDS.includes(product.id)) {
        acc[product.id] = item.quantity;
      }
      return acc;
    }, {}) || {}
  );
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const handleQuantityChange = (productId, change) => {
    setQuantities(prev => {
      const currentQty = prev[productId] || 0;
      const newQty = Math.max(0, currentQty + change);
      return { ...prev, [productId]: newQty };
    });
  };

  const calculateTotal = () => {
    return PRODUCTS.filter(p => !COMPLIMENTARY_IDS.includes(p.id)).reduce((total, product) => {
      const qty = quantities[product.id] || 0;
      return total + (product.discountedPrice * qty);
    }, 0);
  };

  const getSelectedCount = () => {
    return Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
  };

  const handleContinue = () => {
    const selectedProducts = PRODUCTS
      .filter(p => !COMPLIMENTARY_IDS.includes(p.id))
      .map(product => ({
        product_name: product.name,
        quantity: quantities[product.id] || 0,
        original_price: product.originalPrice,
        discounted_price: product.discountedPrice
      })).filter(item => item.quantity > 0);

    if (isKinderPuppy && selectedComplimentary) {
      const complimentaryProduct = PRODUCTS.find(p => p.id === selectedComplimentary);
      if (complimentaryProduct) {
        selectedProducts.unshift({
          product_name: complimentaryProduct.name,
          quantity: 1,
          original_price: complimentaryProduct.originalPrice,
          discounted_price: 0
        });
      }
    }

    setFormData(prev => ({
      ...prev,
      productSelections: selectedProducts,
      productsTotal: calculateTotal()
    }));

    onNext();
  };

  const handleSkip = () => {
    setFormData(prev => ({
      ...prev,
      productSelections: [],
      productsTotal: 0
    }));
    onNext();
  };

  const handleImageClick = (product, index = 0) => {
    setSelectedImage(product);
    setSelectedImageIndex(index);
  };

  const handleNextImage = () => {
    if (selectedImage && selectedImage.imageUrls && selectedImageIndex < selectedImage.imageUrls.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  const handlePreviousImage = () => {
    if (selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  const paidProducts = isKinderPuppy
    ? PRODUCTS.filter(p => !COMPLIMENTARY_IDS.includes(p.id))
    : PRODUCTS;

  const complimentaryProducts = PRODUCTS.filter(p => COMPLIMENTARY_IDS.includes(p.id));

  return (
    <>
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                Premium Care Products
              </CardTitle>
              <p className="text-sm text-slate-600 mt-1">
                Special discount for booking clients!
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

          {/* Complimentary Section (Kinder Puppy only) */}
          {isKinderPuppy && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-slate-900">Complimentary Gift — Pick 1!</h3>
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border border-emerald-200">FREE</Badge>
              </div>
              <p className="text-sm text-slate-600">As a Kinder Puppy client, you're entitled to one complimentary product. Select your preferred item below.</p>
              <div className="space-y-3">
                {complimentaryProducts.map(product => {
                  const isSelected = selectedComplimentary === product.id;
                  const hasImages = product.imageUrls && product.imageUrls.length > 0;
                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => setSelectedComplimentary(isSelected ? null : product.id)}
                      className={`w-full text-left border rounded-lg p-4 transition-all ${
                        isSelected ? 'border-emerald-400 bg-emerald-50/60 ring-2 ring-emerald-200' : 'border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`mt-1 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                          isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'
                        }`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        {hasImages && (
                          <img
                            src={product.imageUrls[0]}
                            alt={product.name}
                            className="w-16 h-16 object-contain rounded-lg bg-white flex-shrink-0"
                            onClick={e => { e.stopPropagation(); handleImageClick(product, 0); }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-900">{product.name}</span>
                            <span className="text-sm text-slate-400 line-through">${product.originalPrice.toFixed(2)}</span>
                            <span className="text-sm font-bold text-emerald-600">FREE</span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-2">{product.description}</p>
                          {product.showEcoLabel && (
                            <p className="text-xs text-green-700 mt-1 font-medium">🌱 100% Vegan • 🤲 Handcrafted • ♻️ Biodegradable</p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <hr className="border-slate-200" />
            </div>
          )}

          {/* Paid Products List */}
          <div className="space-y-4">
            {paidProducts.map((product) => {
              const qty = quantities[product.id] || 0;
              const savings = product.originalPrice - product.discountedPrice;
              const hasImages = product.imageUrls && product.imageUrls.length > 0;

              return (
                <div
                  key={product.id}
                  className={`border rounded-lg p-4 transition-all ${
                    qty > 0 ? 'border-blue-300 bg-blue-50/50' : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start gap-4">
                      {hasImages && (
                        <div className="flex-shrink-0 space-y-2">
                          <button
                            type="button"
                            onClick={() => handleImageClick(product, 0)}
                            className="relative rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all group"
                          >
                            <img
                              src={product.imageUrls[0]}
                              alt={product.name}
                              className="w-20 h-20 md:w-24 md:h-24 object-contain rounded-lg bg-white transition-transform group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center">
                              <Maximize2 className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </button>
                          {product.imageUrls.length > 1 && (
                            <div className="flex gap-1">
                              {product.imageUrls.slice(1).map((imageUrl, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={() => handleImageClick(product, index + 1)}
                                  className="relative rounded overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all group w-10 h-10"
                                >
                                  <img
                                    src={imageUrl}
                                    alt={`${product.name} ${index + 2}`}
                                    className="w-full h-full object-cover bg-white transition-transform group-hover:scale-110"
                                  />
                                </button>
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-slate-500 text-center">Click to zoom</p>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 text-base md:text-lg">
                          {product.name}
                        </h3>
                        <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                          {product.description}
                        </p>
                        {product.showEcoLabel && (
                          <p className="text-xs text-green-700 mt-2 font-medium">
                            🌱 100% Vegan • 🤲 Handcrafted • ♻️ Biodegradable
                          </p>
                        )}
                      </div>
                    </div>

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
                            Save ${savings.toFixed(2)} ({product.discountPercent}% off)
                          </span>
                        </div>
                      </div>
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
                    {getSelectedCount()} item{getSelectedCount() > 1 ? 's' : ''} • Discounts applied
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
              {getSelectedCount() > 0 || (isKinderPuppy && selectedComplimentary) ? 'Continue' : 'Continue without Products'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Image Zoom Dialog with Gallery */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{selectedImage?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedImage && selectedImage.imageUrls && selectedImage.imageUrls.length > 0 && (
              <>
                <div className="relative flex justify-center bg-slate-50 rounded-lg p-6">
                  {selectedImageIndex > 0 && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-10"
                      onClick={handlePreviousImage}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                  )}
                  <img
                    src={selectedImage.imageUrls[selectedImageIndex]}
                    alt={selectedImage.name}
                    className="max-h-[60vh] w-auto object-contain"
                  />
                  {selectedImageIndex < selectedImage.imageUrls.length - 1 && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-10"
                      onClick={handleNextImage}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  )}
                </div>
                {selectedImage.imageUrls.length > 1 && (
                  <div className="text-center text-sm text-slate-600">
                    Image {selectedImageIndex + 1} of {selectedImage.imageUrls.length}
                  </div>
                )}
                {selectedImage.imageUrls.length > 1 && (
                  <div className="flex justify-center gap-2">
                    {selectedImage.imageUrls.map((url, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                          index === selectedImageIndex
                            ? 'border-blue-600 ring-2 ring-blue-200'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <img
                          src={url}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
            <div className="space-y-2">
              <p className="text-sm text-slate-600 leading-relaxed">
                {selectedImage?.description}
              </p>
              {selectedImage?.showEcoLabel && (
                <p className="text-xs text-green-700 font-medium">
                  🌱 100% Vegan • 🤲 Handcrafted • ♻️ Biodegradable
                </p>
              )}
              <div className="flex items-center gap-3 pt-2 border-t border-slate-200">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-blue-600">
                    ${selectedImage?.discountedPrice.toFixed(2)}
                  </span>
                  <span className="text-sm text-slate-500 line-through">
                    ${selectedImage?.originalPrice.toFixed(2)}
                  </span>
                </div>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                  Save ${((selectedImage?.originalPrice || 0) - (selectedImage?.discountedPrice || 0)).toFixed(2)} ({selectedImage?.discountPercent}% off)
                </Badge>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}