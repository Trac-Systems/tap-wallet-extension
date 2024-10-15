import browser from 'webextension-polyfill';
export class PortMessage {
  private port: browser.Runtime.Port;

  constructor(port: browser.Runtime.Port) {
    this.port = port;
  }

  // Listen for incoming messages and process them with the provided callback
  listen(callback: (data: any) => any): void {
    this.port.onMessage.addListener(async (message: any) => {
      try {
        const result = await callback(message);
        if (result !== undefined) {
          this.send('response', {id: message.id, result});
        }
      } catch (error) {
        this.send('error', {id: message.id, error: error.message});
      }
    });
  }

  // Send a message to the port
  send(type: string, data: any): void {
    this.port.postMessage({type, ...data});
  }

  // Request data and wait for a response
  request(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const messageId = this.generateUniqueId();
      const listener = (response: any) => {
        if (response.id === messageId) {
          this.port.onMessage.removeListener(listener);
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response.result);
          }
        }
      };

      this.port.onMessage.addListener(listener);
      this.port.postMessage({id: messageId, ...data});
    });
  }

  // Generate a unique ID for message tracking
  private generateUniqueId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}
