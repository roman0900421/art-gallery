import React, { memo } from "react";
import Tilt from "react-parallax-tilt";
import { Link } from "react-router-dom";
import { AiOutlineHeart, AiTwotoneHeart } from "react-icons/ai";
import { BsFillStarFill } from "react-icons/bs";
import "./ProductCard.css";

const ProductCard = ({ 
  product, 
  isProductInCart, 
  isProductInWishlist, 
  wishlistHandler, 
  addToCartHandler, 
  cartLoading 
}) => {
  const {
    _id,
    id,
    name,
    original_price,
    discounted_price,
    category_name,
    is_stock,
    rating,
    reviews,
    trending,
    img,
  } = product;

  return (
    <Tilt
      key={_id}
      tiltMaxAngleX={5}
      tiltMaxAngleY={5}
      glareEnable={false}
      transitionSpeed={2000}
      scale={1.02}
    >
      <div className="product-card" key={_id}>
        <Link to={`/product-details/${id}`}>
          <div className="product-card-image">
            <Tilt
              transitionSpeed={2000}
              tiltMaxAngleX={15}
              tiltMaxAngleY={15}
              scale={1.08}
            >
              <img 
                src={img} 
                alt={name} 
                loading="lazy" 
              />
            </Tilt>
          </div>
        </Link>

        <div className="product-card-details">
          <h3>{name}</h3>
          <p className="ratings">
            {rating}
            <BsFillStarFill color="orange" /> ({reviews} reviews){" "}
          </p>
          <div className="price-container">
            <p className="original-price">${original_price}</p>
            <p className="discount-price">${discounted_price}</p>
          </div>

          <p>Genre: {category_name}</p>
          <div className="info">
            {!is_stock && <p className="out-of-stock">Out of stock</p>}
            {trending && <p className="trending">Trending</p>}
          </div>
        </div>

        <div className="product-card-buttons">
          <button
            disabled={cartLoading}
            onClick={() => addToCartHandler(product)}
            className="cart-btn"
          >
            {!isProductInCart(product) ? "Add To Cart" : "Go to Cart"}
          </button>
          <button
            onClick={() => wishlistHandler(product)}
            className="wishlist-btn"
          >
            {!isProductInWishlist(product) ? (
              <AiOutlineHeart size={30} />
            ) : (
              <AiTwotoneHeart color="red" size={30} />
            )}
          </button>
        </div>
      </div>
    </Tilt>
  );
};

// Use memo to prevent unnecessary re-renders
export default memo(ProductCard); 