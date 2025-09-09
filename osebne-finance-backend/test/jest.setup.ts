import * as fs from 'fs';
import * as path from 'path';

jest.setTimeout(60000);

const dir = path.join(__dirname, 'tmp-uploads');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads_test';
process.env.USE_DB_TRIGGERS = process.env.USE_DB_TRIGGERS || 'false';