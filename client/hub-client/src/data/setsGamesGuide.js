export const setsGamesSteps = [
    {
        number: '10',
        title: 'Navigate to the Sets & Games page',
        description: 'Click Sets & Games in the navbar. No account needed — you can browse and play games with any public set without signing in.',
        action: { label: 'Go to Sets & Games', to: '/sets' },
    },
    {
        number: '11',
        title: 'Create your own set (sign-in required)',
        description: 'To create your own set, sign in or create a free account. On the My Sets tab, click Create New Set, give it a name, and select a language. You can only add words from that language.',
        action: { label: 'Create a New Set', to: '/sets/create' },
    },
    {
        number: '12',
        title: 'Add translations from the dictionary',
        description: 'Navigate to the Dictionaries tab. Open the language that matches your set. Find a word, expand its card, and click "Add to Set" to add it.',
        action: { label: 'Go to Dictionaries', to: '/languages' },
    },
    {
        number: '13',
        title: 'Play games',
        description: 'Open any set — yours or a public one — and choose Flashcards, Matching, or Writing to start practicing.',
    },
];
