export function upsertMeta(selector, attributes) {
    let tag = document.head.querySelector(selector);

    if (!tag) {
        tag = document.createElement('meta');
        document.head.appendChild(tag);
    }

    Object.entries(attributes).forEach(([key, value]) => {
        tag.setAttribute(key, value);
    });
}

export function setRobotsDirective(content) {
    upsertMeta('meta[name="robots"]', {
        name: 'robots',
        content,
    });
}
