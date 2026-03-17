/**
 * Docs Drop & Save Folder API
 * Allows agents to drop context, research, and documentation safely.
 */
import fs from 'fs';
import path from 'path';
import { WriteBoundary } from '../enforcement/WriteBoundary';
import { Telemetry } from '../telemetry/TraceContract';

export class DocManager {
  /**
   * Saves a document to the /docs directory.
   */
  static async saveDoc(filename: string, content: string, agentId: string): Promise<void> {
    const targetPath = `/docs/${filename}`;
    const traceId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `trace-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Validate through the Write Boundary
    await WriteBoundary.validateWrite(targetPath, 'CREATE');

    const fullPath = path.join(process.cwd(), targetPath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(fullPath, content, 'utf8');
    
    Telemetry.log({
      traceId,
      agentId,
      eventType: 'STATE_MUTATION',
      action: 'DOC_SAVED',
      targetPath,
      payload: { size: content.length }
    });
  }

  /**
   * Lists available documents in the /docs drop folder.
   */
  static async listDocs(): Promise<string[]> {
    const docsDir = path.join(process.cwd(), 'docs');
    if (!fs.existsSync(docsDir)) {
      return [];
    }
    return fs.readdirSync(docsDir);
  }
}
