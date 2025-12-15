import "@testing-library/jest-dom";

// Basic WebSocket mock helper for tests that need it.
// Tests can override global.WebSocket per-suite if they need custom behavior.
class MockWebSocket {
  static instances: MockWebSocket[] = [];
  url: string;
  readyState: number = 0; // CONNECTING
  onopen: ((ev: Event) => any) | null = null;
  onmessage: ((ev: MessageEvent) => any) | null = null;
  onerror: ((ev: Event) => any) | null = null;
  onclose: ((ev: Event) => any) | null = null;

  constructor(url: string) {
    this.url = url;
    // @ts-ignore
    MockWebSocket.instances.push(this);
    // simulate async open
    setTimeout(() => {
      this.readyState = 1; // OPEN
      this.onopen && this.onopen(new Event("open"));
    }, 0);
  }

  send(_data: string) {
    // no-op; tests can inspect instances if needed
  }

  close() {
    this.readyState = 3; // CLOSED
    // Use generic Event for compatibility across jsdom versions
    this.onclose && this.onclose(new Event("close"));
  }
}

// Provide a default that tests can override if they need a richer mock.
Object.defineProperty(global, "WebSocket", {
  configurable: true,
  writable: true,
  value: MockWebSocket,
});
