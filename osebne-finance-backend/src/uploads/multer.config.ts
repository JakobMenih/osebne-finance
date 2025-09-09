import { MulterModuleOptions } from '@nestjs/platform-express';
import * as path from 'path';
import * as fs from 'fs';
import { randomUUID } from 'crypto';

const allow = (process.env.ALLOWED_MIME || 'image/png,image/jpeg,application/pdf,text/plain').split(',');
const maxMb = Number(process.env.MAX_UPLOAD_MB || 10);
const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

export const multerConfig: MulterModuleOptions = {
    dest: uploadDir,
    limits: { fileSize: maxMb * 1024 * 1024 },
    fileFilter: (_req, file, cb) => cb(null, allow.includes(file.mimetype)),
    storage: {
        _handleFile(_req: any, file: any, cb: any) {
            const ext = path.extname(file.originalname || '');
            const name = `${randomUUID()}${ext || ''}`;
            const target = path.join(uploadDir, name);
            const out = fs.createWriteStream(target);
            file.stream.pipe(out);
            out.on('error', cb);
            out.on('finish', () => cb(null, { destination: uploadDir, filename: name, path: target, size: out.bytesWritten }));
        },
        _removeFile(_req: any, file: any, cb: any) {
            fs.unlink(file.path, cb);
        },
    } as any,
};
