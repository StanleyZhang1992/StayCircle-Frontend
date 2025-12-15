import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChatPanel from "../components/ChatPanel";
import * as api from "../lib/api";
import * as auth from "../lib/auth";

describe("ChatPanel", () => {
  beforeEach(() => {
    // Fake logged-in tenant
    jest.spyOn(auth, "getAuth").mockReturnValue({
      token: "test-token",
      user: { id: 123, email: "guest@example.com", role: "tenant" },
    } as any);
    jest.spyOn(auth, "getToken").mockReturnValue("test-token");
    jest.spyOn(api, "buildChatWsUrl").mockImplementation((pid: number, token: string) => `ws://example/ws/chat/property/${pid}?token=${token}`);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // Close any open mock sockets
    const WS: any = (global as any).WebSocket;
    if (WS && WS.instances) {
      WS.instances.forEach((ws: any) => {
        try { ws.close(); } catch {}
      });
      WS.instances.length = 0;
    }
  });

  test("renders history and appends live message via WS", async () => {
    // Seed history
    const hist: api.ChatMessage[] = [
      { id: 1, property_id: 1, sender_id: 999, text: "earlier", created_at: new Date().toISOString() },
    ];
    jest.spyOn(api, "listMessagesHistory").mockResolvedValue(hist);

    render(<ChatPanel propertyId={1} />);

    // History loads
    await waitFor(() => {
      expect(screen.getByText("earlier")).toBeInTheDocument();
    });

    // Grab the last created mock ws instance
    const WS: any = (global as any).WebSocket;
    expect(WS.instances?.length).toBeGreaterThan(0);
    const ws = WS.instances[WS.instances.length - 1];

    // Simulate server broadcast
    const live: api.ChatMessage = {
      id: 2,
      property_id: 1,
      sender_id: 123,
      text: "hello world",
      created_at: new Date().toISOString(),
    };
    ws.onmessage?.({ data: JSON.stringify(live) } as MessageEvent);

    // UI shows new message
    await waitFor(() => {
      expect(screen.getByText("hello world")).toBeInTheDocument();
    });
  });

  test("sends message and shows optimistic entry", async () => {
    jest.spyOn(api, "listMessagesHistory").mockResolvedValue([]);

    render(<ChatPanel propertyId={1} />);

    // Wait for empty state to ensure initial render done
    await waitFor(() => {
      expect(screen.getByText("No messages yet.")).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText("Type a message");
    await userEvent.type(input, "client msg");
    const sendBtn = screen.getByRole("button", { name: "Send" });
    await userEvent.click(sendBtn);

    // Optimistic bubble appears
    expect(screen.getByText("client msg")).toBeInTheDocument();
  });
});
