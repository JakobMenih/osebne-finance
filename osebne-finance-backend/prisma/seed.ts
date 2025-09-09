import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const email = 'demo@financnik.app';
    const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            passwordHash: await bcrypt.hash('DemoGeslo123!', 10),
            firstName: 'Demo',
            lastName: 'Uporabnik',
            defaultCurrency: 'EUR',
            showAmounts: true,
        },
    });

    const defaults = [
        { name: 'Tekoči račun', isDefault: true },
        { name: 'Varčevalni račun', isDefault: true },
        { name: 'Vzdrževanje avtomobila', isDefault: false },
    ];

    for (const c of defaults) {
        await prisma.category.upsert({
            where: { userId_name: { userId: user.id, name: c.name } },
            update: {},
            create: { userId: user.id, name: c.name, isDefault: c.isDefault },
        });
    }
}

main().finally(() => prisma.$disconnect());
