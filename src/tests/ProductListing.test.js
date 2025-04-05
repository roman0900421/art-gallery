import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ProductListing } from '../pages/ProductListing/ProductListing';
import { DataProvider } from '../contexts/DataProvider';
import { UserDataProvider } from '../contexts/UserDataProvider';

// Mock IntersectionObserver
class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
    this.elements = new Set();
  }
  
  observe(element) {
    this.elements.add(element);
    this.callback([{ isIntersecting: false, target: element }]);
  }

  unobserve(element) {
    this.elements.delete(element);
  }

  disconnect() {
    this.elements.clear();
  }

  // Test helper to simulate scrolling
  triggerIntersection(isIntersecting) {
    const entries = [];
    this.elements.forEach(element => {
      entries.push({
        isIntersecting,
        target: element,
        boundingClientRect: {},
        intersectionRatio: isIntersecting ? 1 : 0,
        intersectionRect: {},
        rootBounds: null,
        time: Date.now()
      });
    });
    
    this.callback(entries);
  }
}

// Mock fetch responses
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      products: [
        {
          _id: "1",
          id: "product1",
          name: "Test Product 1",
          original_price: 100,
          discounted_price: 80,
          category_name: "Digital Art",
          is_stock: true,
          rating: 4.5,
          reviews: 10,
          trending: true,
          img: "test-image-1.jpg"
        },
        {
          _id: "2",
          id: "product2",
          name: "Test Product 2",
          original_price: 120,
          discounted_price: 90,
          category_name: "Digital Art",
          is_stock: true,
          rating: 4.0,
          reviews: 8,
          trending: false,
          img: "test-image-2.jpg"
        }
      ]
    })
  })
);

// Mock the services
jest.mock('../services/services', () => ({
  getAllProducts: jest.fn(() => Promise.resolve({
    request: { status: 200 },
    data: {
      products: [
        {
          _id: "1",
          id: "product1",
          name: "Test Product 1",
          original_price: 100,
          discounted_price: 80,
          category_name: "Digital Art",
          is_stock: true,
          rating: 4.5,
          reviews: 10,
          trending: true,
          img: "test-image-1.jpg"
        },
        {
          _id: "2",
          id: "product2",
          name: "Test Product 2",
          original_price: 120,
          discounted_price: 90,
          category_name: "Digital Art",
          is_stock: true,
          rating: 4.0,
          reviews: 8,
          trending: false,
          img: "test-image-2.jpg"
        }
      ]
    }
  })),
  getAllCategories: jest.fn(() => Promise.resolve({
    request: { status: 200 },
    data: {
      categories: [
        { _id: "1", categoryName: "Digital Art" },
        { _id: "2", categoryName: "Photography" }
      ]
    }
  }))
}));

// Setup before tests
beforeAll(() => {
  window.IntersectionObserver = MockIntersectionObserver;
  // Clear localStorage before tests
  localStorage.clear();
});

afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

const renderProductListing = () => {
  return render(
    <BrowserRouter>
      <DataProvider>
        <UserDataProvider>
          <ProductListing />
        </UserDataProvider>
      </DataProvider>
    </BrowserRouter>
  );
};

describe('ProductListing Component', () => {
  test('renders product listing component', async () => {
    renderProductListing();
    
    // Wait for products to load
    await waitFor(() => {
      expect(screen.getByText(/Test Product 1/i)).toBeInTheDocument();
    });
    
    expect(screen.getByText(/Test Product 2/i)).toBeInTheDocument();
  });
  
  test('displays correct product information', async () => {
    renderProductListing();
    
    await waitFor(() => {
      expect(screen.getByText(/Test Product 1/i)).toBeInTheDocument();
    });
    
    expect(screen.getByText(/\$100/i)).toBeInTheDocument();
    expect(screen.getByText(/\$80/i)).toBeInTheDocument();
    expect(screen.getByText(/4.5/i)).toBeInTheDocument();
    expect(screen.getByText(/10 reviews/i)).toBeInTheDocument();
    expect(screen.getByText(/Trending/i)).toBeInTheDocument();
  });
  
  test('loads more products when scrolling to bottom', async () => {
    renderProductListing();
    
    await waitFor(() => {
      expect(screen.getByText(/Test Product 1/i)).toBeInTheDocument();
    });
    
    // Get the IntersectionObserver instance
    const observer = window.IntersectionObserver.instances[0];
    
    // Simulate scrolling to trigger loading more products
    observer.triggerIntersection(true);
    
    // Verify loading indicator is shown
    await waitFor(() => {
      expect(screen.getByText(/Loading more/i)).toBeInTheDocument();
    });
  });
  
  test('filters products correctly when search is used', async () => {
    renderProductListing();
    
    await waitFor(() => {
      expect(screen.getByText(/Test Product 1/i)).toBeInTheDocument();
    });
    
    // Simulate search for "Product 1"
    const searchInput = screen.getByPlaceholderText(/Search/i);
    userEvent.type(searchInput, 'Product 1');
    
    // After search, only Product 1 should be visible
    await waitFor(() => {
      expect(screen.getByText(/Test Product 1/i)).toBeInTheDocument();
      expect(screen.queryByText(/Test Product 2/i)).not.toBeInTheDocument();
    });
  });
}); 