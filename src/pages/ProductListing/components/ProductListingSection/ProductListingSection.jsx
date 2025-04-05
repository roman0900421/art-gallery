import "./ProductListingSection.css";
import Tilt from "react-parallax-tilt";
import React, { useState, useEffect, lazy, Suspense } from "react";
import { useInView } from "react-intersection-observer";

import { useData } from "../../../../contexts/DataProvider.js";
import { Link } from "react-router-dom";
import { getCategoryWiseProducts } from "../../../../helpers/filter-functions/category";
import { getRatedProducts } from "../../../../helpers/filter-functions/ratings";
import { getPricedProducts } from "../../../../helpers/filter-functions/price";
import { getSortedProducts } from "../../../../helpers/filter-functions/sort";
import { getSearchedProducts } from "../../../../helpers/searchedProducts";
import { AiOutlineHeart } from "react-icons/ai";
import { AiTwotoneHeart } from "react-icons/ai";
import { useUserData } from "../../../../contexts/UserDataProvider.js";

import { BsFillStarFill } from "react-icons/bs";

const ProductCard = lazy(() => import("../ProductCard/ProductCard"));

export const ProductListingSection = () => {
  const { state } = useData();
  const {
    isProductInCart,
    isProductInWishlist,
    wishlistHandler,
    addToCartHandler,
    cartLoading,
  } = useUserData();

  const {
    allProductsFromApi,
    inputSearch,
    filters: { rating, categories, price, sort },
  } = state;

  // Apply filters efficiently with memoization
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [visibleProducts, setVisibleProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 8;

  // Implement intersection observer for infinite scrolling
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  // Apply all filters and sorting in one pass
  useEffect(() => {
    const filtered = getSearchedProducts(allProductsFromApi, inputSearch);
    const withRating = getRatedProducts(filtered, rating);
    const withCategory = getCategoryWiseProducts(withRating, categories);
    const withPrice = getPricedProducts(withCategory, price);
    const sorted = getSortedProducts(withPrice, sort);
    
    setFilteredProducts(sorted);
    setCurrentPage(1);
    setVisibleProducts(sorted.slice(0, productsPerPage));
  }, [allProductsFromApi, inputSearch, rating, categories, price, sort]);

  // Load more products when user scrolls to the bottom
  useEffect(() => {
    if (inView) {
      const nextPage = currentPage + 1;
      const startIndex = (nextPage - 1) * productsPerPage;
      const endIndex = nextPage * productsPerPage;
      
      if (startIndex < filteredProducts.length) {
        setVisibleProducts(prev => [...prev, ...filteredProducts.slice(startIndex, endIndex)]);
        setCurrentPage(nextPage);
      }
    }
  }, [inView, currentPage, filteredProducts]);

  return (
    <div className="product-card-container">
      {!filteredProducts.length ? (
        <h2 className="no-products-found">
          Sorry, there are no matching products!
        </h2>
      ) : (
        <>
          <Suspense fallback={<div className="loading-products">Loading products...</div>}>
            {visibleProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                isProductInCart={isProductInCart}
                isProductInWishlist={isProductInWishlist}
                wishlistHandler={wishlistHandler}
                addToCartHandler={addToCartHandler}
                cartLoading={cartLoading}
              />
            ))}
          </Suspense>
          {visibleProducts.length < filteredProducts.length && (
            <div ref={ref} className="load-more-indicator">
              Loading more...
            </div>
          )}
        </>
      )}
    </div>
  );
};
