type Listener = (isOpen: boolean) => void;

class LedgerSignManager {
  private listeners: Set<Listener> = new Set();
  private counter = 0;

  show() {
    this.counter += 1;
    if (this.counter === 1) {
      this.notify(true);
    }
  }

  hide() {
    if (this.counter === 0) {
      return;
    }
    this.counter -= 1;
    if (this.counter === 0) {
      this.notify(false);
    }
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(isOpen: boolean) {
    this.listeners.forEach(listener => listener(isOpen));
  }
}

export const ledgerSignManager = new LedgerSignManager();

