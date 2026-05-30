import prisma from '../prisma.js';
import { slugify } from '../utils/slugify.js';

const languages = await prisma.language.findMany({ where: { slug: null } });

for (const lang of languages) {
    const slug = lang.isoCode ?? slugify(lang.name);
    await prisma.language.update({ where: { id: lang.id }, data: { slug } });
    console.log(`Set slug="${slug}" for language "${lang.name}"`);
}

console.log(`Done. Updated ${languages.length} language(s).`);
await prisma.$disconnect();
