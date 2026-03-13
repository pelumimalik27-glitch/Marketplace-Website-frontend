import React, { useContext, useEffect, useMemo, useState } from "react";
import { AppContext } from "../../contexts/AppContext";
import {
  createSellerProduct,
  fetchCategories,
  deleteSellerProduct,
  fetchMySellerProfile,
  fetchSellerProducts,
  updateSellerProduct,
} from "../../lib/sellerApi";
import { formatNaira } from "../../lib/currency";

const defaultForm = {
  name: "",
  category: "",
  description: "",
  image: "",
  price: "",
  quantity: "",
  status: "active",
};

const numberValue = (value) => Number(value || 0);
const money = (value) => formatNaira(numberValue(value));
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const asImage = (product) =>
  String(product?.image || (Array.isArray(product?.images) ? product.images[0] : "") || "");
const DEFAULT_CATEGORY_OPTIONS = [
  "Electronics",
  "Fashion",
  "Home & Garden",
  "Home Appliances",
  "Beauty",
  "Sports",
];
const labelizeCategory = (value) => String(value || "").trim();
const buildCategoryOptions = (apiCategories = [], products = []) => {
  const merged = [
    ...apiCategories.map((category) => labelizeCategory(category?.name || category?.title)),
    ...products.map((product) => labelizeCategory(product?.category)),
    ...DEFAULT_CATEGORY_OPTIONS,
  ].filter(Boolean);

  const byLower = new Map();
  for (const category of merged) {
    const key = category.toLowerCase();
    if (!byLower.has(key)) {
      byLower.set(key, category);
    }
  }

  return Array.from(byLower.values());
};

function SellerProducts() {
  const { user } = useContext(AppContext);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sellerProfile, setSellerProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState(defaultForm);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");
      let productList = [];

      const profile = await fetchMySellerProfile(user?.userId);
      setSellerProfile(profile);

      if (!profile?._id) {
        setProducts([]);
      } else {
        const list = await fetchSellerProducts(profile._id);
        productList = Array.isArray(list) ? list : [];
        setProducts(productList);
      }

      const categoryPayload = await fetchCategories().catch(() => ({ data: [] }));
      const categoryList = Array.isArray(categoryPayload?.data)
        ? categoryPayload.data
        : [];
      setCategories(buildCategoryOptions(categoryList, productList));
    } catch (err) {
      setError(err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [user?.userId]);

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const matchSearch = String(product?.name || "")
          .toLowerCase()
          .includes(search.toLowerCase());
        const status = String(product?.status || "").toLowerCase();
        const matchStatus = statusFilter === "all" || status === statusFilter;
        return matchSearch && matchStatus;
      }),
    [products, search, statusFilter]
  );

  const openCreateForm = () => {
    setEditId(null);
    setFormData(defaultForm);
    setFormError("");
    setIsFormOpen(true);
  };

  const openEditForm = (product) => {
    setEditId(product?._id || null);
    setFormData({
      name: product?.name || "",
      category: product?.category || "",
      description: product?.description || "",
      image: asImage(product),
      price: String(product?.price ?? ""),
      quantity: String(product?.inventory?.quantity ?? ""),
      status: String(product?.status || "active").toLowerCase(),
    });
    setFormError("");
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditId(null);
    setFormError("");
    setFormData(defaultForm);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFormError("Please select a valid image file.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setFormError("Image is too large. Please upload an image smaller than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, image: String(reader.result || "") }));
      setFormError("");
    };
    reader.onerror = () => setFormError("Failed to read image file.");
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!sellerProfile?._id) {
      setFormError("Seller profile not found. Refresh the page or complete seller setup.");
      return;
    }

    try {
      setSaving(true);
      setFormError("");

      const name = formData.name.trim();
      if (!name) {
        setFormError("Product name is required.");
        return;
      }

      const payload = {
        sellerId: sellerProfile._id,
        name,
        category: formData.category.trim(),
        description: formData.description.trim(),
        image: formData.image.trim(),
        images: formData.image.trim() ? [formData.image.trim()] : [],
        price: numberValue(formData.price),
        inventory: { quantity: numberValue(formData.quantity) },
        status: formData.status,
      };

      if (editId) {
        await updateSellerProduct(editId, payload);
      } else {
        await createSellerProduct(payload);
      }

      closeForm();
      loadProducts();
    } catch (err) {
      setFormError(err.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm("Delete this product?")) return;

    try {
      await deleteSellerProduct(productId);
      loadProducts();
    } catch (err) {
      alert(err.message || "Failed to delete product");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Products</h1>
          <p className="text-sm text-slate-600">
            {sellerProfile?.storeName || "Seller Store"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadProducts}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            Refresh
          </button>
          <button
            onClick={openCreateForm}
            className="rounded-lg bg-orange-600 px-3 py-2 text-sm text-white shadow hover:bg-orange-700"
          >
            Add Product
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product name"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="all">All status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            Total: {filteredProducts.length}
          </div>
        </div>
      </div>

      {loading && <div className="rounded border bg-white p-4 text-sm">Loading...</div>}
      {!loading && error && (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3">Image</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-gray-500">
                    No products found.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product._id} className="border-t">
                    <td className="px-4 py-3">
                      {asImage(product) ? (
                        <img
                          src={asImage(product)}
                          alt={product?.name || "Product image"}
                          className="h-10 w-10 rounded border object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded border bg-gray-100" />
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">{product?.name || "-"}</td>
                    <td className="px-4 py-3">{money(product?.price)}</td>
                    <td className="px-4 py-3">
                      {numberValue(product?.inventory?.quantity)}
                    </td>
                    <td className="px-4 py-3">{String(product?.status || "-")}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditForm(product)}
                          className="rounded border px-2 py-1 hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product._id)}
                          className="rounded border px-2 py-1 text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <h2 className="text-lg font-semibold text-slate-900">
              {editId ? "Edit Product" : "Add Product"}
            </h2>
            <form onSubmit={handleSubmit} className="mt-3 space-y-4">
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="Product name"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm sm:col-span-2"
                  required
                />
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleFormChange}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="">Select category</option>
                  {categories.map((category) => {
                    const key = String(category || "");
                    const label = String(category || "Category");
                    return (
                      <option key={key} value={label}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>

              <textarea
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="Description"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                rows={3}
              />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Product image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                  {formData.image ? (
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="h-24 w-full rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-24 items-center justify-center text-sm text-gray-500">
                      Image preview
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <input
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleFormChange}
                  placeholder="Price"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  required
                />
                <input
                  name="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={handleFormChange}
                  placeholder="Stock qty"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  required
                />
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="pending">pending</option>
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-orange-600 px-3 py-2 text-sm text-white shadow disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SellerProducts;
