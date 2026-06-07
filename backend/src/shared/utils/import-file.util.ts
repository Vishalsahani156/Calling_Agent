import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { env } from '../../config/env';

export async function saveImportCsvFile(
  organizationId: string,
  buffer: Buffer,
): Promise<string> {
  const dir = path.join(env.UPLOAD_DIR, 'imports', organizationId);
  await fs.mkdir(dir, { recursive: true });

  const filePath = path.join(dir, `${randomUUID()}.csv`);
  await fs.writeFile(filePath, buffer);
  return filePath;
}
