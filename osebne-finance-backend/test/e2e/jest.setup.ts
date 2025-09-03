import * as fs from 'fs';
import * as path from 'path';

jest.setTimeout(60000);

const dir = path.join(__dirname, 'tmp-uploads');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

process.env.UPLOAD_DIR = dir;
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';
