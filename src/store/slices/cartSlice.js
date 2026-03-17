import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { cartService } from "../../services/cartService";

const CART_STORAGE_KEY = "techexpress_cart_v1";
const CART_SELECTION_STORAGE_KEY = "techexpress_cart_selection_v1";

const initialState = {
  items: [],
  selectedItemKeys: [],
  initialized: false,
  source: "local",
  loading: false,
  actionLoading: {
    add: false,
    update: false,
    remove: false,
    clear: false,
  },
  error: null,
  lastSyncedAt: null,
};

function normalizeServerItem(item) {
  const productStatus = item?.productStatus || null;
  const parsedStock =
    item?.availableStock === null || item?.availableStock === undefined
      ? null
      : Math.max(Number(item.availableStock) || 0, 0);
  const availableStock =
    parsedStock === 0 && productStatus === "Available" ? null : parsedStock;
  const rawQuantity = Math.max(Number(item?.quantity) || 0, 0);
  const quantity = rawQuantity;
  const unitPrice = Number(item?.unitPrice) || 0;
  const fallbackSubTotal = unitPrice * quantity;
  const subTotal =
    Number(item?.subTotal) > 0 ? Number(item.subTotal) : fallbackSubTotal;

  return {
    key: item?.id || item?.productId,
    serverItemId: item?.id || null,
    productId: item?.productId || "",
    productName: item?.productName || "",
    productImage: item?.productImage || "",
    quantity,
    unitPrice,
    subTotal,
    availableStock,
    productStatus,
  };
}

function normalizeServerItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map(normalizeServerItem);
}

function normalizeLocalItem(item) {
  const quantity = Math.max(Number(item?.quantity) || 1, 1);
  const unitPrice = Number(item?.unitPrice ?? item?.price) || 0;
  const availableStock =
    item?.availableStock === null || item?.availableStock === undefined
      ? null
      : Math.max(Number(item.availableStock) || 0, 0);

  return {
    key:
      item?.key ||
      item?.productId ||
      item?.id ||
      `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    serverItemId: null,
    productId: item?.productId || item?.id || "",
    productName: item?.productName || item?.name || "",
    productImage: item?.productImage || item?.image || "",
    quantity,
    unitPrice,
    subTotal: unitPrice * quantity,
    availableStock,
    productStatus: item?.productStatus || "Available",
  };
}

function isItemInvalid(item) {
  const outOfStatus = item?.productStatus && item.productStatus !== "Available";
  const outOfStock = item?.availableStock !== null && item?.availableStock <= 0;
  const overStock =
    item?.availableStock !== null && item?.quantity > item.availableStock;

  return outOfStatus || outOfStock || overStock;
}

function isItemSelectable(item) {
  return !isItemInvalid(item);
}

function readCartFromStorage() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeLocalItem);
  } catch (error) {
    console.warn("Failed to read cart storage:", error);
    return [];
  }
}

function writeCartToStorage(items) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.warn("Failed to write cart storage:", error);
  }
}

function removeCartStorage() {
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to clear cart storage:", error);
  }
}

function readSelectionFromStorage() {
  try {
    const raw = sessionStorage.getItem(CART_SELECTION_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((key) => typeof key === "string");
  } catch (error) {
    console.warn("Failed to read cart selection storage:", error);
    return [];
  }
}

function writeSelectionToStorage(keys) {
  try {
    sessionStorage.setItem(CART_SELECTION_STORAGE_KEY, JSON.stringify(keys));
  } catch (error) {
    console.warn("Failed to write cart selection storage:", error);
  }
}

function mergeLocalCartWithServer(localItems, serverItems) {
  const mergedMap = new Map();

  for (const item of serverItems) {
    mergedMap.set(item.productId, item);
  }

  for (const localItem of localItems) {
    const existed = mergedMap.get(localItem.productId);
    if (!existed) {
      mergedMap.set(localItem.productId, {
        ...localItem,
        serverItemId: null,
      });
      continue;
    }

    const nextQuantity = (existed.quantity || 0) + (localItem.quantity || 0);
    mergedMap.set(localItem.productId, {
      ...existed,
      quantity: nextQuantity,
      subTotal: (existed.unitPrice || 0) * nextQuantity,
    });
  }

  return Array.from(mergedMap.values());
}

function syncSelectedItemKeys(previousSelectedKeys = [], previousItems = [], nextItems = []) {
  const previousKeySet = new Set(previousItems.map((item) => item.key));
  const selectableNextKeys = nextItems
    .filter(isItemSelectable)
    .map((item) => item.key);
  const selectableNextKeySet = new Set(selectableNextKeys);

  const nextSelectedKeys = previousSelectedKeys.filter((key) =>
    selectableNextKeySet.has(key)
  );

  selectableNextKeys.forEach((key) => {
    if (!previousKeySet.has(key) && !nextSelectedKeys.includes(key)) {
      nextSelectedKeys.push(key);
    }
  });

  if (previousItems.length === 0 && previousSelectedKeys.length === 0) {
    return selectableNextKeys;
  }

  return nextSelectedKeys;
}

export const bootstrapCart = createAsyncThunk(
  "cart/bootstrap",
  async ({ isAuthenticated } = {}, { rejectWithValue }) => {
    try {
      const localItems = readCartFromStorage();
      const selectedItemKeys = readSelectionFromStorage();

      return {
        isAuthenticated: !!isAuthenticated,
        localItems,
        selectedItemKeys,
      };
    } catch (error) {
      return rejectWithValue(error?.message || "Bootstrap cart failed");
    }
  }
);

export const fetchCartItems = createAsyncThunk(
  "cart/fetchItems",
  async (_, { rejectWithValue }) => {
    const response = await cartService.getItems();
    if (!response.succeeded) {
      return rejectWithValue(response.message || "Failed to fetch cart items");
    }

    return normalizeServerItems(response.value || []);
  }
);

export const syncCartAfterLogin = createAsyncThunk(
  "cart/syncAfterLogin",
  async (_, { rejectWithValue }) => {
    const serverResponse = await cartService.getItems();
    if (!serverResponse.succeeded) {
      return rejectWithValue(serverResponse?.message || "Failed to fetch server cart");
    }

    const serverItems = normalizeServerItems(serverResponse.value || []);
    const localItems = readCartFromStorage();

    if (localItems.length === 0) {
      return serverItems;
    }

    const mergedItems = mergeLocalCartWithServer(localItems, serverItems);

    for (const item of mergedItems) {
      if (item.serverItemId) {
        const updateRes = await cartService.updateItem(item.serverItemId, {
          quantity: item.quantity,
        });
        if (!updateRes.succeeded) {
          return rejectWithValue(updateRes.message || "Failed to sync cart item");
        }
      } else {
        const createRes = await cartService.addItem({
          productId: item.productId,
          quantity: item.quantity,
        });
        if (!createRes.succeeded) {
          return rejectWithValue(createRes.message || "Failed to sync local item");
        }
      }
    }

    const latestServerResponse = await cartService.getItems();
    if (!latestServerResponse.succeeded) {
      return rejectWithValue(latestServerResponse.message || "Failed to refresh cart");
    }

    removeCartStorage();
    return normalizeServerItems(latestServerResponse.value || []);
  }
);

export const addCartItem = createAsyncThunk(
  "cart/addItem",
  async ({ productId, quantity = 1, meta, isAuthenticated }, { getState, rejectWithValue }) => {
    if (!productId) {
      return rejectWithValue("Missing productId");
    }

    if (!isAuthenticated) {
      if (!meta?.productName || meta?.unitPrice === undefined) {
        return rejectWithValue("Missing product info for local cart");
      }

      const currentItems = getState().cart.items || [];
      const existed = currentItems.find((item) => item.productId === productId);
      let nextItems;

      if (existed) {
        nextItems = currentItems.map((item) => {
          if (item.productId !== productId) return item;
          const nextQuantity = item.quantity + quantity;
          return {
            ...item,
            quantity: nextQuantity,
            subTotal: item.unitPrice * nextQuantity,
          };
        });
      } else {
        nextItems = [
          ...currentItems,
          normalizeLocalItem({
            productId,
            quantity,
            productName: meta.productName,
            productImage: meta.productImage,
            unitPrice: meta.unitPrice,
            availableStock: meta.availableStock,
            productStatus: meta.productStatus || "Available",
          }),
        ];
      }

      writeCartToStorage(nextItems);
      return {
        mode: "local",
        items: nextItems,
      };
    }

    const createRes = await cartService.addItem({ productId, quantity });
    if (!createRes.succeeded) {
      return rejectWithValue(createRes.message || "Failed to add cart item");
    }

    const latest = await cartService.getItems();
    if (!latest.succeeded) {
      return rejectWithValue(latest.message || "Failed to refresh cart");
    }

    return {
      mode: "server",
      items: normalizeServerItems(latest.value || []),
    };
  }
);

export const changeCartItemQuantity = createAsyncThunk(
  "cart/changeQuantity",
  async ({ serverItemId, productId, quantity, isAuthenticated }, { getState, rejectWithValue }) => {
    const safeQuantity = Math.max(Number(quantity) || 0, 0);

    if (!isAuthenticated) {
      const currentItems = getState().cart.items || [];
      const nextItems =
        safeQuantity <= 0
          ? currentItems.filter((item) => item.productId !== productId)
          : currentItems.map((item) => {
              if (item.productId !== productId) return item;
              return {
                ...item,
                quantity: safeQuantity,
                subTotal: item.unitPrice * safeQuantity,
              };
            });

      writeCartToStorage(nextItems);
      return {
        mode: "local",
        items: nextItems,
      };
    }

    if (!serverItemId) {
      return rejectWithValue("Missing serverItemId");
    }

    const response =
      safeQuantity <= 0
        ? await cartService.removeItem(serverItemId)
        : await cartService.updateItem(serverItemId, { quantity: safeQuantity });

    if (!response.succeeded) {
      return rejectWithValue(response.message || "Failed to update quantity");
    }

    const latest = await cartService.getItems();
    if (!latest.succeeded) {
      return rejectWithValue(latest.message || "Failed to refresh cart");
    }

    return {
      mode: "server",
      items: normalizeServerItems(latest.value || []),
    };
  }
);

export const removeCartItem = createAsyncThunk(
  "cart/removeItem",
  async ({ serverItemId, productId, isAuthenticated }, { getState, rejectWithValue }) => {
    if (!isAuthenticated) {
      const currentItems = getState().cart.items || [];
      const nextItems = currentItems.filter((item) => item.productId !== productId);
      writeCartToStorage(nextItems);
      return {
        mode: "local",
        items: nextItems,
      };
    }

    if (!serverItemId) {
      return rejectWithValue("Missing serverItemId");
    }

    const response = await cartService.removeItem(serverItemId);
    if (!response.succeeded) {
      return rejectWithValue(response.message || "Failed to remove cart item");
    }

    const latest = await cartService.getItems();
    if (!latest.succeeded) {
      return rejectWithValue(latest.message || "Failed to refresh cart");
    }

    return {
      mode: "server",
      items: normalizeServerItems(latest.value || []),
    };
  }
);

export const clearCartItems = createAsyncThunk(
  "cart/clearItems",
  async ({ isAuthenticated }, { rejectWithValue }) => {
    if (!isAuthenticated) {
      removeCartStorage();
      return {
        mode: "local",
        items: [],
      };
    }

    const response = await cartService.clearCart();
    if (!response.succeeded) {
      return rejectWithValue(response.message || "Failed to clear cart");
    }

    return {
      mode: "server",
      items: [],
    };
  }
);

export const removeCheckedOutLocalItems = createAsyncThunk(
  "cart/removeCheckedOutLocalItems",
  async ({ productIds }, { getState, rejectWithValue }) => {
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return rejectWithValue("Missing productIds");
    }

    const productIdSet = new Set(productIds);
    const currentItems = getState().cart.items || [];
    const nextItems = currentItems.filter((item) => !productIdSet.has(item.productId));

    writeCartToStorage(nextItems);

    return {
      mode: "local",
      items: nextItems,
    };
  }
);

function persistSelection(keys) {
  writeSelectionToStorage(keys);
}

function setItemsFromPayload(state, action) {
  const nextItems = action.payload?.items || [];
  state.selectedItemKeys = syncSelectedItemKeys(
    state.selectedItemKeys,
    state.items,
    nextItems
  );
  state.items = nextItems;
  state.source = action.payload?.mode || state.source;
  state.error = null;
  state.lastSyncedAt = new Date().toISOString();
  persistSelection(state.selectedItemKeys);
}

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    hydrateCartFromSignalR(state, action) {
      const nextItems = normalizeServerItems(action.payload);
      state.selectedItemKeys = syncSelectedItemKeys(
        state.selectedItemKeys,
        state.items,
        nextItems
      );
      state.items = nextItems;
      state.source = "server";
      state.error = null;
      state.lastSyncedAt = new Date().toISOString();
      persistSelection(state.selectedItemKeys);
    },
    toggleCartItemSelection(state, action) {
      const itemKey = action.payload;
      const item = state.items.find((entry) => entry.key === itemKey);
      if (!item || !isItemSelectable(item)) return;

      if (state.selectedItemKeys.includes(itemKey)) {
        state.selectedItemKeys = state.selectedItemKeys.filter((key) => key !== itemKey);
      } else {
        state.selectedItemKeys.push(itemKey);
      }

      persistSelection(state.selectedItemKeys);
    },
    toggleSelectAllCartItems(state) {
      const selectableKeys = state.items
        .filter(isItemSelectable)
        .map((item) => item.key);

      if (selectableKeys.length === 0) {
        state.selectedItemKeys = [];
        persistSelection(state.selectedItemKeys);
        return;
      }

      const hasSelectedAll = selectableKeys.every((key) =>
        state.selectedItemKeys.includes(key)
      );

      if (hasSelectedAll) {
        state.selectedItemKeys = state.selectedItemKeys.filter(
          (key) => !selectableKeys.includes(key)
        );
      } else {
        const selectedKeySet = new Set(state.selectedItemKeys);
        selectableKeys.forEach((key) => selectedKeySet.add(key));
        state.selectedItemKeys = Array.from(selectedKeySet);
      }

      persistSelection(state.selectedItemKeys);
    },
    clearCartSelection(state) {
      state.selectedItemKeys = [];
      persistSelection(state.selectedItemKeys);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bootstrapCart.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.items = action.payload.localItems || [];
        state.selectedItemKeys = syncSelectedItemKeys(
          action.payload.selectedItemKeys || [],
          [],
          state.items
        );
        state.source = action.payload.isAuthenticated ? "server" : "local";
        state.error = null;
        persistSelection(state.selectedItemKeys);
      })
      .addCase(bootstrapCart.rejected, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.error = action.payload || action.error.message || "Bootstrap cart failed";
      })
      .addCase(fetchCartItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCartItems.fulfilled, (state, action) => {
        state.loading = false;
        setItemsFromPayload(state, action);
      })
      .addCase(fetchCartItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message || "Failed to fetch cart";
      })
      .addCase(syncCartAfterLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(syncCartAfterLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedItemKeys = syncSelectedItemKeys(
          state.selectedItemKeys,
          state.items,
          action.payload || []
        );
        state.items = action.payload || [];
        state.source = "server";
        state.lastSyncedAt = new Date().toISOString();
        state.error = null;
        persistSelection(state.selectedItemKeys);
      })
      .addCase(syncCartAfterLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message || "Failed to sync cart";
      })
      .addCase(addCartItem.pending, (state) => {
        state.actionLoading.add = true;
        state.error = null;
      })
      .addCase(addCartItem.fulfilled, (state, action) => {
        state.actionLoading.add = false;
        setItemsFromPayload(state, action);
      })
      .addCase(addCartItem.rejected, (state, action) => {
        state.actionLoading.add = false;
        state.error = action.payload || action.error.message || "Failed to add item";
      })
      .addCase(changeCartItemQuantity.pending, (state) => {
        state.actionLoading.update = true;
        state.error = null;
      })
      .addCase(changeCartItemQuantity.fulfilled, (state, action) => {
        state.actionLoading.update = false;
        setItemsFromPayload(state, action);
      })
      .addCase(changeCartItemQuantity.rejected, (state, action) => {
        state.actionLoading.update = false;
        state.error = action.payload || action.error.message || "Failed to update quantity";
      })
      .addCase(removeCartItem.pending, (state) => {
        state.actionLoading.remove = true;
        state.error = null;
      })
      .addCase(removeCartItem.fulfilled, (state, action) => {
        state.actionLoading.remove = false;
        setItemsFromPayload(state, action);
      })
      .addCase(removeCartItem.rejected, (state, action) => {
        state.actionLoading.remove = false;
        state.error = action.payload || action.error.message || "Failed to remove item";
      })
      .addCase(clearCartItems.pending, (state) => {
        state.actionLoading.clear = true;
        state.error = null;
      })
      .addCase(clearCartItems.fulfilled, (state, action) => {
        state.actionLoading.clear = false;
        setItemsFromPayload(state, action);
      })
      .addCase(clearCartItems.rejected, (state, action) => {
        state.actionLoading.clear = false;
        state.error = action.payload || action.error.message || "Failed to clear cart";
      })
      .addCase(removeCheckedOutLocalItems.fulfilled, (state, action) => {
        setItemsFromPayload(state, action);
      })
      .addCase(removeCheckedOutLocalItems.rejected, (state, action) => {
        state.error =
          action.payload || action.error.message || "Failed to sync local checkout items";
      });
  },
});

export default cartSlice.reducer;
export const {
  clearCartSelection,
  hydrateCartFromSignalR,
  toggleCartItemSelection,
  toggleSelectAllCartItems,
} = cartSlice.actions;

export const selectCartItems = (state) => state.cart.items;
export const selectCartSelectedItemKeys = (state) => state.cart.selectedItemKeys;
export const selectCartLoading = (state) => state.cart.loading;
export const selectCartActionLoading = (state) => state.cart.actionLoading;
export const selectCartError = (state) => state.cart.error;

export const selectCartItemCount = (state) =>
  (state.cart.items || []).reduce((total, item) => total + (item.quantity || 0), 0);

export const selectCartSubtotal = (state) =>
  (state.cart.items || []).reduce((total, item) => {
    const quantity = item.quantity || 0;
    const unitPrice = item.unitPrice || 0;
    const subTotal = item.subTotal || unitPrice * quantity;
    return total + subTotal;
  }, 0);

export const selectCartInvalidItems = (state) =>
  (state.cart.items || []).filter(isItemInvalid);

export const selectCartSelectedItems = (state) => {
  const selectedKeySet = new Set(state.cart.selectedItemKeys || []);
  return (state.cart.items || []).filter((item) => selectedKeySet.has(item.key));
};

export const selectCartSelectedLineCount = (state) =>
  selectCartSelectedItems(state).length;

export const selectCartSelectedItemCount = (state) =>
  selectCartSelectedItems(state).reduce(
    (total, item) => total + (item.quantity || 0),
    0
  );

export const selectCartSelectedSubtotal = (state) =>
  selectCartSelectedItems(state).reduce((total, item) => {
    const quantity = item.quantity || 0;
    const unitPrice = item.unitPrice || 0;
    const subTotal = item.subTotal || unitPrice * quantity;
    return total + subTotal;
  }, 0);

export const selectCartSelectableItems = (state) =>
  (state.cart.items || []).filter(isItemSelectable);

export const selectCartSelectableItemCount = (state) =>
  selectCartSelectableItems(state).length;

export const selectCartAllSelectableSelected = (state) => {
  const selectableItems = selectCartSelectableItems(state);
  if (selectableItems.length === 0) return false;

  const selectedKeySet = new Set(selectCartSelectedItemKeys(state));
  return selectableItems.every((item) => selectedKeySet.has(item.key));
};

export const selectCartCanCheckout = (state) =>
  selectCartSelectedItems(state).length > 0;
