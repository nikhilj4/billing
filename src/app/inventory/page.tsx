"use client";

import React, { useState, useEffect } from "react";
import {
  getInventory,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  restockInventoryItem
} from "@/lib/storage";
import { InventoryItem } from "@/lib/types";
import { useToast } from "@/components/Toast";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  Pill,
  Search,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  X,
  Package,
  Barcode as BarcodeIcon
} from "lucide-react";
import Barcode from "react-barcode";

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { showToast } = useToast();

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState(500);

  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [editName, setEditName] = useState("");

  const [restockItem, setRestockItem] = useState<InventoryItem | null>(null);
  const [restockQty, setRestockQty] = useState(100);

  const [deleteCandidate, setDeleteCandidate] = useState<InventoryItem | null>(null);
  const [barcodeModalItem, setBarcodeModalItem] = useState<InventoryItem | null>(null);

  const loadData = () => {
    setItems(getInventory());
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredItems = items.filter((item) =>
    item.itemName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add Item Handler
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || newItemQty < 0) return;

    addInventoryItem({
      itemName: newItemName.trim(),
      initialQty: newItemQty,
      currentQty: newItemQty
    });

    showToast("success", "Item Added", `${newItemName.trim()} with ${newItemQty} stock added to inventory.`);
    setNewItemName("");
    setNewItemQty(500);
    setIsAddModalOpen(false);
    loadData();
  };

  // Edit Item Handler
  const handleEditItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem || !editName.trim()) return;

    updateInventoryItem(editItem.id, { itemName: editName.trim() });
    showToast("success", "Item Updated", `Item name updated to "${editName.trim()}".`);
    setEditItem(null);
    loadData();
  };

  // Restock Handler
  const handleRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockItem || restockQty <= 0) return;

    const result = restockInventoryItem(restockItem.id, restockQty);
    if (result) {
      showToast(
        "success",
        "Stock Restocked",
        `${restockItem.itemName} stock increased by ${restockQty}. New total: ${result.item.currentQty}.`
      );
      setRestockItem(null);
      setRestockQty(100);
      loadData();
    }
  };

  // Delete Handler
  const confirmDelete = () => {
    if (!deleteCandidate) return;
    deleteInventoryItem(deleteCandidate.id);
    showToast("info", "Item Deleted", `Removed ${deleteCandidate.itemName} from inventory.`);
    setDeleteCandidate(null);
    loadData();
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Info & Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">
              Medicine Inventory ({filteredItems.length} SKUs)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time stock quantities. Subtractions are calculated deterministically; current quantity never goes negative.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search medicine item..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs text-slate-900 outline-none transition-all"
            />
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Medicine Item</span>
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-6">SKU ID</th>
                <th className="py-3.5 px-6">Medicine Item Name</th>
                <th className="py-3.5 px-6 text-right">Initial Stock</th>
                <th className="py-3.5 px-6 text-right">Quantity Used</th>
                <th className="py-3.5 px-6 text-right">Remaining Stock</th>
                <th className="py-3.5 px-6">Stock Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No medicine items found matching "{searchTerm}"
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const usedQty = Math.max(0, item.initialQty - item.currentQty);
                  const isOutOfStock = item.currentQty === 0;
                  const isLowStock = item.currentQty > 0 && item.currentQty < 50;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 font-mono text-slate-500 font-semibold">{item.id}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="font-bold text-slate-900">{item.itemName}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right font-mono text-slate-600">
                        {item.initialQty.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-right font-mono font-bold text-amber-700">
                        {usedQty.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-right font-mono font-bold text-slate-900">
                        {item.currentQty.toLocaleString()}
                      </td>
                      <td className="py-4 px-6">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-800 border border-red-200">
                            <AlertTriangle className="w-3 h-3" />
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                            <AlertTriangle className="w-3 h-3" />
                            Low Stock (&lt;50)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            In Stock
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => setBarcodeModalItem(item)}
                          className="p-1 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50 inline-block align-middle"
                          title="Generate & View Barcode"
                        >
                          <BarcodeIcon className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setRestockItem(item);
                            setRestockQty(100);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 text-[11px] font-semibold border border-blue-200 transition-colors"
                          title="Increase stock"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Restock</span>
                        </button>

                        <button
                          onClick={() => {
                            setEditItem(item);
                            setEditName(item.itemName);
                          }}
                          className="p-1 text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100"
                          title="Edit item name"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setDeleteCandidate(item)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50"
                          title="Delete item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Add New Medicine Item</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddItem} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g. Paracetamol 500mg"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Initial Stock Quantity</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={newItemQty}
                  onChange={(e) => setNewItemQty(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-xs font-semibold rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Edit Medicine Item</h3>
              <button onClick={() => setEditItem(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleEditItem} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditItem(null)}
                  className="px-4 py-2 border border-slate-300 text-xs font-semibold rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {restockItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">Restock Medicine</h3>
                <p className="text-xs text-slate-500">{restockItem.itemName} (Current Stock: {restockItem.currentQty})</p>
              </div>
              <button onClick={() => setRestockItem(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleRestock} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Quantity to Add</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={restockQty}
                  onChange={(e) => setRestockQty(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-blue-500"
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900">
                Stock after restock: <strong className="font-bold">{restockItem.currentQty + restockQty}</strong> units
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRestockItem(null)}
                  className="px-4 py-2 border border-slate-300 text-xs font-semibold rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Confirm Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Modal */}
      {barcodeModalItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <BarcodeIcon className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Medicine Item Barcode</h3>
              </div>
              <button
                onClick={() => setBarcodeModalItem(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 inline-block mx-auto overflow-hidden max-w-full">
              <Barcode
                value={barcodeModalItem.itemName}
                height={55}
                width={1.2}
                fontSize={11}
                margin={4}
              />
            </div>

            <div className="text-left bg-blue-50/60 p-3 rounded-lg border border-blue-100 text-xs space-y-1">
              <p className="font-bold text-slate-900">{barcodeModalItem.itemName}</p>
              {barcodeModalItem.manufacturer && (
                <p className="text-slate-600 text-[11px]">Manufacturer: {barcodeModalItem.manufacturer}</p>
              )}
              <div className="grid grid-cols-2 gap-1 pt-1 font-mono text-[11px] text-slate-700">
                <div>Code: <strong className="text-slate-900">{barcodeModalItem.itemCode || barcodeModalItem.id}</strong></div>
                <div>MRP: <strong className="text-slate-900">₹{(barcodeModalItem.mrp || 0).toFixed(2)}</strong></div>
                <div>Batch: <strong className="text-slate-900">{barcodeModalItem.batchNumber || "N/A"}</strong></div>
                <div>Exp: <strong className="text-slate-900">{barcodeModalItem.expiryDate || "N/A"}</strong></div>
              </div>
              <p className="font-mono text-slate-600 text-[11px] pt-1">Available Stock: <strong>{barcodeModalItem.currentQty} units</strong></p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setBarcodeModalItem(null)}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteCandidate}
        title="Delete Medicine Item?"
        description={`Are you sure you want to remove ${deleteCandidate?.itemName} from inventory? This action cannot be undone.`}
        confirmText="Delete Item"
        isDestructive
        onConfirm={confirmDelete}
        onClose={() => setDeleteCandidate(null)}
      />
    </div>
  );
}
