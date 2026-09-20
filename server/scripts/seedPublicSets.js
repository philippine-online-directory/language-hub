import prisma from '../prisma.js';

const PUBLIC_SETS = [
    {
        languageSlug: 'sgb',
        ownerUsername: 'ulap_hapon',
        name: 'Ayta Mag-Antsi Food & Cooking',
        description: 'Common Ayta Mag-Antsi words for food, drinks, ingredients, and cooking.',
        meanings: ['food', 'rice', 'meat', 'fruit', 'banana', 'coconut', 'salt', 'sugar', 'water', 'drink', 'eat', 'cook', 'egg', 'coffee', 'bread', 'milk', 'soup'],
        minimumWords: 14
    },
    {
        languageSlug: 'sgb',
        ownerUsername: 'luntianTala',
        name: 'Animals Around Us',
        description: 'Ayta Mag-Antsi names for familiar animals, birds, and insects.',
        meanings: ['animal', 'dog', 'cat', 'bird', 'chicken', 'pig', 'cow', 'carabao', 'horse', 'rat', 'snake', 'goat', 'insect'],
        minimumWords: 12
    },
    {
        languageSlug: 'sgb',
        ownerUsername: 'banabaNotes',
        name: 'Home and Everyday Objects',
        description: 'Useful Ayta Mag-Antsi words for the home and ordinary household objects.',
        meanings: ['house', 'door', 'window', 'room', 'bed', 'chair', 'table', 'basket', 'pot', 'cooking pot', 'knife', 'spoon', 'plate', 'clothes', 'roof', 'wall'],
        minimumWords: 14
    },
    {
        languageSlug: 'sgb',
        ownerUsername: 'Monica Miranda',
        name: 'Nature and Weather',
        description: 'Ayta Mag-Antsi vocabulary for landscapes, plants, the sky, and weather.',
        meanings: ['sun', 'moon', 'star', 'sky', 'cloud', 'rain', 'wind', 'ocean', 'river', 'mountain', 'tree', 'flower', 'plant', 'sand', 'stone', 'fire', 'water', 'earth'],
        minimumWords: 15
    },
    {
        languageSlug: 'tagbanua',
        ownerUsername: '8man',
        name: 'Calamian Coast and Sea',
        description: 'Calamian Tagbanua words connected to the coast, sea life, and island surroundings.',
        meanings: ['beach', 'island', 'ocean', 'water', 'wave'],
        wordTexts: ['bag̓itan', 'itu', 'samban', 'siruk', 'almang', 'gukguk', 'biyag-biyag', 'karawat', 'manlët', 'ranga-ranga'],
        minimumWords: 14
    },
    {
        languageSlug: 'tagbanua',
        ownerUsername: 'Marites Caballero',
        name: 'Food, Farming and Harvest',
        description: 'Calamian Tagbanua vocabulary for food, crops, farming, and the harvest.',
        meanings: ['food', 'fruit', 'plant', 'seed', 'tree', 'vegetable'],
        wordTexts: ['lumbuy', 'kandis', 'bëngël', 'bëtëng', 'suman', 'balayang', 'kaw̓ig̓an', 'tarata', 'sayuti', 'lug̓aw'],
        minimumWords: 14
    },
    {
        languageSlug: 'tagbanua',
        ownerUsername: 'Noel Banzon',
        name: 'At Home',
        description: 'Calamian Tagbanua words for rooms, furniture, tools, and home life.',
        meanings: ['house', 'door', 'window', 'room', 'bed', 'chair', 'basket', 'cooking pot', 'knife', 'spoon', 'roof', 'wall'],
        wordTexts: ['arku', 'tangkungan', 'papag', 'lulubgan'],
        minimumWords: 14
    },
    {
        languageSlug: 'tagbanua',
        ownerUsername: 'tinay_m',
        name: 'everyday action words',
        description: 'A practical mix of Calamian Tagbanua verbs for everyday activities.',
        meanings: ['go', 'run', 'eat', 'drink', 'sleep', 'work', 'see', 'say', 'give', 'carry', 'wash', 'cook', 'buy', 'cry'],
        wordTexts: ['salya', 'usuy-usuy', 'tamyak'],
        minimumWords: 14
    },
    {
        languageSlug: 'ivv',
        ownerUsername: 'Jong',
        name: 'Basco Ivatan Starter Words',
        description: 'A beginner-friendly mix of common Basco Ivatan words and ideas.',
        meanings: ['all', 'and', 'big', 'black', 'cold', 'day', 'dirty', 'dry', 'far', 'good', 'near', 'small', 'water', 'fire', 'house', 'dog', 'fish', 'mother', 'father', 'child'],
        minimumWords: 16
    },
    {
        languageSlug: 'ivv',
        ownerUsername: 'mariatan',
        name: 'Body and Senses',
        description: 'Basco Ivatan vocabulary for parts of the body and the senses.',
        meanings: ['back', 'blood', 'ear', 'eye', 'hair', 'hand', 'head', 'mouth', 'neck', 'nose', 'skin', 'tooth', 'shoulder', 'hear', 'see'],
        minimumWords: 12
    },
    {
        languageSlug: 'dumagat',
        ownerUsername: 'Tinayyy',
        name: 'Nature Around Us',
        description: 'Casiguran Dumagat words for the sea, sky, weather, plants, and land.',
        meanings: ['rain', 'star', 'stone', 'sky', 'plant', 'wind', 'water', 'flower', 'sea', 'cloud', 'fire', 'sand', 'moon'],
        minimumWords: 12
    },
    {
        languageSlug: 'dumagat',
        ownerUsername: 'jenalyn27',
        name: 'Daily Actions',
        description: 'Useful Casiguran Dumagat action words for daily conversation and play.',
        meanings: ['buy', 'eat', 'cry', 'cook', 'see', 'sit', 'say', 'hear', 'climb', 'sleep', 'walk', 'drink', 'choose', 'stand', 'work'],
        minimumWords: 14
    },
    {
        languageSlug: 'ibg',
        ownerUsername: 'Rom3l',
        name: 'Ibanag Starter Words',
        description: 'A varied starter collection of common Ibanag words for new learners.',
        meanings: ['above', 'all', 'and', 'at', 'back', 'below', 'big', 'bone', 'branch', 'cold', 'come', 'day', 'dirty', 'dog', 'drink', 'dry', 'ear', 'eat', 'egg', 'eye', 'far', 'father', 'fire', 'fish', 'flower', 'fruit', 'good'],
        minimumWords: 20
    },
    {
        languageSlug: 'ibg',
        ownerUsername: 'ynaflores',
        name: 'body and movement',
        description: 'Ibanag words for the body, the senses, and everyday movement.',
        meanings: ['tooth', 'hand', 'back', 'eye', 'nose', 'shoulder', 'ear', 'neck', 'sleep', 'sit', 'stand', 'say', 'climb', 'eat', 'choose', 'drink', 'see', 'work', 'come', 'walk'],
        minimumWords: 18
    },
    {
        languageSlug: 'itbayat',
        ownerUsername: 'QMs0riano',
        name: 'Itbayat Action Words',
        description: 'A focused collection of Itbayat verbs for actions and everyday activities.',
        wordTexts: ['sonyiten', 'viot', 'omhinawa', 'asleb', 'ayan', 'xotoen', 'tomanyis', 'omoyog', 'madngey', 'tayoen', 'lipet', 'atta', 'akto', 'adsilen'],
        minimumWords: 14
    },
    {
        languageSlug: 'itbayat',
        ownerUsername: 'QMs0riano',
        name: 'a little bit of everything',
        description: 'A mixed Itbayat set with descriptions, objects, places, and a few extra actions.',
        wordTexts: ['toxos', 'kani', 'hiraxem', 'soso', 'rapos', 'mabkox', 'maharawi', 'lima', 'hawa', 'hanaynyed', 'pakox', 'tokpox', 'soong', 'maraxawa', 'tomayo', 'matta', 'mangtokto'],
        minimumWords: 16
    }
];

function normalize(value) {
    return value.trim().normalize('NFC').toLocaleLowerCase('en');
}

function selectTranslations(spec, translations) {
    const selected = new Map();
    const missing = [];

    for (const meaning of spec.meanings || []) {
        const candidates = translations.filter(translation => (
            normalize(translation.englishDefinition) === normalize(meaning)
        ));
        const translation = candidates.find(candidate => candidate.author.username === spec.ownerUsername)
            || candidates[0];

        if (translation) selected.set(translation.id, translation);
        else missing.push(`meaning: ${meaning}`);
    }

    for (const wordText of spec.wordTexts || []) {
        const candidates = translations.filter(translation => (
            normalize(translation.wordText) === normalize(wordText)
        ));
        const translation = candidates.find(candidate => candidate.author.username === spec.ownerUsername)
            || candidates[0];

        if (translation) selected.set(translation.id, translation);
        else missing.push(`word: ${wordText}`);
    }

    return { translations: [...selected.values()], missing };
}

async function buildPlan() {
    const names = new Set();
    const plan = [];

    for (const spec of PUBLIC_SETS) {
        if (names.has(spec.name)) throw new Error(`Duplicate set name in seed data: ${spec.name}`);
        names.add(spec.name);

        const [language, matchingOwners] = await Promise.all([
            prisma.language.findUnique({ where: { slug: spec.languageSlug } }),
            prisma.user.findMany({
                where: { username: spec.ownerUsername },
                take: 2
            })
        ]);

        if (!language) throw new Error(`Language not found: ${spec.languageSlug}`);
        if (matchingOwners.length === 0) throw new Error(`User not found: ${spec.ownerUsername}`);
        if (matchingOwners.length > 1) throw new Error(`Username is ambiguous: ${spec.ownerUsername}`);

        const owner = matchingOwners[0];

        const translations = await prisma.translation.findMany({
            where: { languageId: language.id, status: 'VERIFIED' },
            select: {
                id: true,
                wordText: true,
                englishDefinition: true,
                authorId: true,
                author: { select: { username: true } }
            },
            orderBy: [{ createdAt: 'asc' }, { id: 'asc' }]
        });

        if (!translations.some(translation => translation.authorId === owner.id)) {
            throw new Error(`${spec.ownerUsername} has no verified contributions in ${language.name}`);
        }

        const selection = selectTranslations(spec, translations);
        if (selection.translations.length < spec.minimumWords) {
            throw new Error(
                `${spec.name} has ${selection.translations.length}/${spec.minimumWords} required words. Missing: ${selection.missing.join(', ')}`
            );
        }

        const existingSet = await prisma.vocabSet.findUnique({ where: { name: spec.name } });
        if (existingSet && (existingSet.ownerId !== owner.id || existingSet.languageId !== language.id)) {
            throw new Error(`${spec.name} already exists with a different owner or language`);
        }

        const ownerWords = selection.translations.filter(translation => translation.authorId === owner.id).length;
        if (ownerWords === 0) {
            throw new Error(`${spec.ownerUsername} did not contribute any selected words to ${spec.name}`);
        }

        plan.push({ spec, language, owner, ownerWords, existingSet, ...selection });
    }

    return plan;
}

async function applyPlan(plan) {
    const results = [];

    for (const item of plan) {
        const result = await prisma.$transaction(async tx => {
            const vocabSet = item.existingSet
                ? await tx.vocabSet.update({
                    where: { id: item.existingSet.id },
                    data: {
                        description: item.spec.description,
                        isPublic: true
                    }
                })
                : await tx.vocabSet.create({
                    data: {
                        name: item.spec.name,
                        description: item.spec.description,
                        isPublic: true,
                        ownerId: item.owner.id,
                        languageId: item.language.id
                    }
                });

            const added = await tx.setWord.createMany({
                data: item.translations.map(translation => ({
                    vocabSetId: vocabSet.id,
                    translationId: translation.id
                })),
                skipDuplicates: true
            });

            return {
                name: vocabSet.name,
                owner: item.owner.username,
                language: item.language.name,
                selectedWords: item.translations.length,
                addedWords: added.count,
                created: !item.existingSet
            };
        });

        results.push(result);
    }

    return results;
}

function printPlan(plan, appliedResults) {
    const resultByName = new Map((appliedResults || []).map(result => [result.name, result]));

    console.table(plan.map(item => {
        const result = resultByName.get(item.spec.name);
        return {
            language: item.language.name,
            set: item.spec.name,
            owner: item.owner.username,
            words: item.translations.length,
            ownerWords: item.ownerWords,
            status: result
                ? `${result.created ? 'created' : 'updated'} (+${result.addedWords} words)`
                : item.existingSet ? 'would update' : 'would create'
        };
    }));

    const missing = plan.flatMap(item => item.missing.map(value => `${item.spec.name}: ${value}`));
    if (missing.length > 0) {
        console.log(`Optional vocabulary not found (${missing.length}):`);
        missing.forEach(value => console.log(`- ${value}`));
    }
}

async function main() {
    const shouldApply = process.argv.includes('--apply');
    const plan = await buildPlan();

    if (!shouldApply) {
        printPlan(plan);
        console.log('Dry run only. Re-run with --apply to write these public sets.');
        return;
    }

    const results = await applyPlan(plan);
    printPlan(plan, results);
}

main()
    .catch(error => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
