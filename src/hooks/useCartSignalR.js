import { useEffect, useRef } from "react";
import { HubConnectionBuilder, HttpTransportType, LogLevel } from "@microsoft/signalr";
import { useDispatch } from "react-redux";
import { hydrateCartFromSignalR } from "../store/slices/cartSlice";

const SIGNALR_URL = "https://localhost:7194";
const CART_HUB_URL = `${SIGNALR_URL}/cartHub`;
const NEW_CART_ITEM_LIST_EVENT = "NewCartItemList";
const CART_ITEM_QUANTITY_UPDATE_EVENT = "CartItemQuantityUpdate";

export default function useCartSignalR({ enabled }) {
  const dispatch = useDispatch();
  const lastItemCountRef = useRef(null);

  useEffect(() => {
    if (!enabled) {
      lastItemCountRef.current = null;
      return undefined;
    }

    let cancelled = false;
    const token = localStorage.getItem("token");
    if (!token) return undefined;

    const connection = new HubConnectionBuilder()
      .withUrl(CART_HUB_URL, {
        accessTokenFactory: () => localStorage.getItem("token") || "",
        transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.None)
      .build();

    connection.on(NEW_CART_ITEM_LIST_EVENT, (_userId, items) => {
      if (cancelled) return;
      const safeItems = Array.isArray(items) ? items : [];
      lastItemCountRef.current = safeItems.reduce(
        (total, item) => total + (Number(item?.quantity) || 0),
        0
      );
      dispatch(hydrateCartFromSignalR(safeItems));
    });

    connection.on(CART_ITEM_QUANTITY_UPDATE_EVENT, (_userId, totalItems) => {
      if (cancelled) return;
      if (lastItemCountRef.current === null) return;

      const parsedTotal = Number(totalItems);
      if (Number.isNaN(parsedTotal) || parsedTotal === lastItemCountRef.current) return;

      if (import.meta.env.DEV) {
        console.warn("[Cart SignalR] Quantity mismatch detected", {
          serverTotalItems: parsedTotal,
          clientTotalItems: lastItemCountRef.current,
        });
      }
    });

    connection.start().catch((error) => {
      if (!cancelled) {
        console.error("[Cart SignalR] Connection error:", error);
      }
    });

    return () => {
      cancelled = true;
      lastItemCountRef.current = null;
      connection.off(NEW_CART_ITEM_LIST_EVENT);
      connection.off(CART_ITEM_QUANTITY_UPDATE_EVENT);
      connection.stop().catch(() => {});
    };
  }, [dispatch, enabled]);
}
