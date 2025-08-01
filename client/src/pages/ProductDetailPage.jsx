import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Star, ShoppingCart, Heart, ChevronLeft, Check } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import Loader from '../components/ui/Loader';
import { toast } from 'react-hot-toast';
import { addToCart } from '../redux/slices/cartSlice';
import { motion, AnimatePresence } from 'framer-motion';

const ProductDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/route/product/${id}`);
        const data = await response.json();
        if (data.success) {
          setProduct(data.product);
        } else {
          throw new Error(data.message);
        }
      } catch (err) {
        setError(err.message);
        toast.error('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    try {
      const response = await fetch(`/api/route/product/${id}`);
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message);
      }
      const freshProduct = data.product;
      if (freshProduct.countInStock < quantity) {
        toast.error('Sorry, this product is out of stock or insufficient quantity available.');
        return;
      }
      dispatch(addToCart({ ...freshProduct, quantity }));
      setIsAdded(true);
      toast.success(`${freshProduct.name} added to cart!`);
      setTimeout(() => setIsAdded(false), 1500);
    } catch (err) {
      toast.error('Failed to add to cart: ' + err.message);
    }
  };

  if (loading) return <Loader />;
  if (error) return <div className="text-red-500 text-center py-8">{error}</div>;
  if (!product) return <div className="text-center py-8">Product not found</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ChevronLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      <div className="grid md:grid-cols-2 gap-8">
        {/* Product Image */}
        <div className="relative">
          <img src={product.images[0]} alt={product.name} className="w-full rounded-lg shadow-md" />
        </div>
        {/* Product Info */}
        <div>
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          <div className="flex items-center mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`h-5 w-5 ${i < Math.round(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
            ))}
            <span className="ml-2 text-sm text-gray-500">({product.numReviews} reviews)</span>
          </div>
          <p className="text-2xl font-bold mb-4">₵{product.price.toFixed(2)}</p>
          <p className="text-gray-600 mb-6">{product.description}</p>
          <div className="flex items-center mb-6">
            <label className="mr-4">Quantity:</label>
            <input
              type="number"
              min="1"
              max={product.countInStock}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              className="w-20 border rounded px-2 py-1"
            />
          </div>
          <div className="flex gap-4">
            <AnimatePresence>
              <motion.div
                initial={{ scale: 1 }}
                animate={isAdded ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Button 
                  onClick={handleAddToCart} 
                  disabled={isAdded || product.countInStock < quantity}
                  className={`${isAdded ? 'bg-green-500 hover:bg-green-600' : ''} transition-colors duration-300`}
                >
                  {isAdded ? (
                    <>
                      <Check className="mr-2 h-4 w-4" /> Added to Cart
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
                    </>
                  )}
                </Button>
              </motion.div>
            </AnimatePresence>
            <Button variant="outline">
              <Heart className="mr-2 h-4 w-4" /> Wishlist
            </Button>
          </div>
        </div>
      </div>
      <Tabs defaultValue="description" className="mt-12">
        <TabsList>
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>
        <TabsContent value="description">
          <Card>
            <CardContent className="pt-6">
              <p>{product.description}</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reviews">
          <Card>
            <CardContent className="pt-6">
              {/* Mock reviews */}
              <p>No reviews yet.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductDetailPage;
