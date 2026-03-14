import React from 'react'

function SortBar({ setFilter, filter }) {
  return (
    <select
      onChange={(e) => setFilter({ ...filter, sort: e.target.value })}
      className="w-full rounded border p-2 sm:w-56"
    >
      <option value="relevant">Most Relevant</option>
      <option value="low">Price: Low to High</option>
      <option value="high">Price: High to Low</option>
    </select>
  );
}

export default SortBar;
