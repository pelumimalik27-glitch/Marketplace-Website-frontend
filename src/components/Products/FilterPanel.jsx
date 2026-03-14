import React from "react";
import { Filter } from "lucide-react";
import { formatNaira } from "../../lib/currency";

const MAX_PRICE = 1000000;

function FilterPanel({ filter, setFilter }) {
  const categories = ["All", "Electronics", "Fashion", "Home & Garden", "Sports"];

  return (
    <div className="w-full p-5 bg-white shadow-lg rounded-lg lg:w-72">
      <div className="flex items-center gap-2 mb-6">
        <Filter size={20} className="text-orange-600" />
        <h3 className="text-lg font-bold">Filters</h3>
      </div>

      {/* Search */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Search</label>
        <input
          type="text"
          placeholder="Search products..."
          value={filter.search}
          onChange={e => setFilter({...filter, search: e.target.value})}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* Categories */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-3">Category</label>
        <div className="space-y-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter({...filter, category: cat})}
              className={`w-full text-left px-3 py-2 rounded-lg transition ${
                filter.category === cat
                  ? 'bg-orange-100 text-orange-700 font-medium'
                  : 'hover:bg-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium">Price Range</label>
          <span className="text-orange-600 font-bold">{formatNaira(filter.price)}</span>
        </div>
        <input
          type="range"
          min="0"
          max={MAX_PRICE}
          step="1000"
          value={filter.price}
          onChange={e => setFilter({...filter, price: +e.target.value})}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-sm text-gray-500 mt-1">
          <span>{formatNaira(0)}</span>
          <span>{formatNaira(MAX_PRICE)}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={filter.freeShipping}
            onChange={e => setFilter({...filter, freeShipping: e.target.checked})}
            className="w-4 h-4 text-orange-600 rounded"
          />
          <span>Free Shipping</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={filter.inStock}
            onChange={e => setFilter({...filter, inStock: e.target.checked})}
            className="w-4 h-4 text-orange-600 rounded"
          />
          <span>In Stock Only</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={filter.sellerVerified}
            onChange={e => setFilter({...filter, sellerVerified: e.target.checked})}
            className="w-4 h-4 text-orange-600 rounded"
          />
          <span>Verified Sellers Only</span>
        </label>
      </div>

      {/* Rating Filter */}
      <div className="mt-6">
        <label className="block text-sm font-medium mb-3">Minimum Rating</label>
        <div className="flex flex-wrap gap-2">
          {[4, 3, 2, 1].map(rating => (
            <button
              key={rating}
              onClick={() => setFilter({...filter, rating: filter.rating === rating ? 0 : rating})}
              className={`px-3 py-1 border rounded-lg ${
                filter.rating === rating
                  ? 'bg-orange-600 text-white border-orange-600'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {rating}+ ★
            </button>
          ))}
        </div>
      </div>

      {/* Reset Button */}
      <button
        onClick={() => setFilter({
          category: 'All',
          price: MAX_PRICE,
          freeShipping: false,
          inStock: false,
          sellerVerified: false,
          rating: 0,
          search: '',
          sort: 'relevant'
        })}
        className="w-full mt-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
      >
        Reset Filters
      </button>
    </div>
  );
}

export default FilterPanel;
