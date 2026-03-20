import { useEffect, useRef } from "react";
import {
  HubConnectionBuilder,
  HttpTransportType,
  LogLevel,
} from "@microsoft/signalr";

import {
  normalizeTicket,
  normalizeTicketMessage,
} from "../utils/ticket";

const SIGNALR_URL = "https://localhost:7194";
const TICKET_HUB_URL = `${SIGNALR_URL}/ticketHub`;

export default function useTicketSignalR({
  enabled,
  onTicketUpdated,
  onTicketMessageReceived,
}) {
  const ticketUpdatedRef = useRef(onTicketUpdated);
  const ticketMessageRef = useRef(onTicketMessageReceived);

  useEffect(() => {
    ticketUpdatedRef.current = onTicketUpdated;
  }, [onTicketUpdated]);

  useEffect(() => {
    ticketMessageRef.current = onTicketMessageReceived;
  }, [onTicketMessageReceived]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      return undefined;
    }

    let cancelled = false;
    const connection = new HubConnectionBuilder()
      .withUrl(TICKET_HUB_URL, {
        accessTokenFactory: () => localStorage.getItem("token") || "",
        transport:
          HttpTransportType.WebSockets | HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.None)
      .build();

    connection.on("TicketUpdated", (payload) => {
      if (cancelled) return;
      ticketUpdatedRef.current?.(normalizeTicket(payload));
    });

    connection.on("TicketMessageReceived", (payload) => {
      if (cancelled) return;
      ticketMessageRef.current?.(normalizeTicketMessage(payload));
    });

    connection.start().catch((error) => {
      if (!cancelled) {
        console.error("[Ticket SignalR] Kết nối thất bại:", error);
      }
    });

    return () => {
      cancelled = true;
      connection.off("TicketUpdated");
      connection.off("TicketMessageReceived");
      connection.stop().catch(() => {});
    };
  }, [enabled]);
}
