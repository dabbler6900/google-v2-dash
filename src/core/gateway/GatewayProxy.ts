import fetch from 'node-fetch';

export class GatewayProxy {
  private static url = process.env.OPENCLAW_GATEWAY_URL || 'http://localhost:18789';
  private static token = process.env.OPENCLAW_GATEWAY_TOKEN || '';

  static async getHealth() {
    try {
      const res = await fetch(`${this.url}/health`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  static async getStatus() {
    try {
      const res = await fetch(`${this.url}/status`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  static async callMethod(method: string, params: any = {}) {
    try {
      const res = await fetch(`${this.url}/rpc`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({ method, params })
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  }
}
