import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
  useCallback,
} from "react";

import { getAllCategories } from "../services/services";
import { getAllProducts } from "../services/services";
import { dataReducer, initialState } from "../reducer/dataReducer";

const DataContext = createContext();

// Cache expiration time (15 minutes)
const CACHE_EXPIRATION = 15 * 60 * 1000;

export function DataProvider({ children }) {
  const [state, dispatch] = useReducer(dataReducer, initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(null);

  // Memoized data fetching function to prevent unnecessary re-fetches
  const getAllSneakers = useCallback(async (forceFetch = false) => {
    try {
      // Check if we have cached data and it's not expired
      const cachedData = localStorage.getItem('products');
      const cachedTimestamp = localStorage.getItem('products_timestamp');
      const now = Date.now();
      
      if (
        !forceFetch &&
        cachedData && 
        cachedTimestamp && 
        now - Number(cachedTimestamp) < CACHE_EXPIRATION
      ) {
        // Use cached data
        dispatch({
          type: "GET_ALL_PRODUCTS_FROM_API",
          payload: JSON.parse(cachedData),
        });
        setLastFetchTime(Number(cachedTimestamp));
        return;
      }
      
      setError(null);
      setLoading(true);
      
      const response = await getAllProducts();
      
      if (response.request.status === 200) {
        // Shuffle products once server-side to avoid client-side shuffling on each render
        const shuffledProducts = response.data.products
          .map((value) => ({ value, sort: Math.random() }))
          .sort((a, b) => a.sort - b.sort)
          .map(({ value }) => value);
        
        // Cache the products
        localStorage.setItem('products', JSON.stringify(shuffledProducts));
        localStorage.setItem('products_timestamp', String(now));
        
        setLastFetchTime(now);
        
        dispatch({
          type: "GET_ALL_PRODUCTS_FROM_API",
          payload: shuffledProducts,
        });
      }
    } catch (error) {
      setError("Failed to fetch products. Please try again later.");
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const getCategories = useCallback(async () => {
    try {
      // Check for cached categories
      const cachedCategories = localStorage.getItem('categories');
      const cachedTimestamp = localStorage.getItem('categories_timestamp');
      const now = Date.now();
      
      if (
        cachedCategories && 
        cachedTimestamp && 
        now - Number(cachedTimestamp) < CACHE_EXPIRATION
      ) {
        // Use cached categories
        dispatch({
          type: "GET_ALL_CATEGORIES",
          payload: JSON.parse(cachedCategories),
        });
        return;
      }
      
      const response = await getAllCategories();
      
      if (response.request.status === 200) {
        // Cache the categories
        localStorage.setItem('categories', JSON.stringify(response.data.categories));
        localStorage.setItem('categories_timestamp', String(now));
        
        dispatch({
          type: "GET_ALL_CATEGORIES",
          payload: response.data.categories,
        });
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, []);

  // Refresh data when the component mounts or when cache is expired
  useEffect(() => {
    getAllSneakers();
    getCategories();
    
    // Set up a timer to check cache expiration
    const intervalId = setInterval(() => {
      const now = Date.now();
      const productsTimestamp = localStorage.getItem('products_timestamp');
      
      if (productsTimestamp && now - Number(productsTimestamp) >= CACHE_EXPIRATION) {
        getAllSneakers(true); // Force refresh data
        getCategories();
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, [getAllSneakers, getCategories]);

  return (
    <DataContext.Provider value={{ state, dispatch, loading, error, refreshData: getAllSneakers }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
