import { MulterModuleOptions } from '@nestjs/platform-express';
import * as path from 'path';
import * as fs from 'fs';
import { randomUUID } from 'crypto';

const maxMb = Number(process.env.MAX_UPLOAD_MB || 5);
const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

export const multerConfig: MulterModuleOptions = {
    limits: { fileSize: maxMb * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const t = String(file.mimetype || '').toLowerCase();
        const ok = t.startsWith('image/');
        cb(ok ? null : new Error('Dovoljene so samo slikovne datoteke'), ok);
    },
    storage: {
        _handleFile(_req: any, file: any, cb: any) {
            const ext = path.extname(file.originalname || '');
            const name = `${randomUUID()}${ext || ''}`;
            const target = path.join(uploadDir, name);
            const out = fs.createWriteStream(target);
            file.stream.pipe(out);
            out.on('error', cb);
            out.on('finish', () =>
                cb(null, { destination: uploadDir, filename: name, path: target, size: out.bytesWritten })
            );
        },
        _removeFile(_req: any, file: any, cb: any) {
            if (file?.path) fs.unlink(file.path, () => cb(null));
            else cb(null);
        }
    } as any
};
