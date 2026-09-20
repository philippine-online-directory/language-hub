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

export function setCanonicalUrl(href) {
    let tag = document.head.querySelector('link[rel="canonical"]');

    if (!tag) {
        tag = document.createElement('link');
        tag.setAttribute('rel', 'canonical');
        document.head.appendChild(tag);
    }

    tag.setAttribute('href', href);
}

export function setJsonLd(id, graph) {
    let tag = document.getElementById(id);

    if (!tag) {
        tag = document.createElement('script');
        tag.type = 'application/ld+json';
        tag.id = id;
        document.head.appendChild(tag);
    }

    tag.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': Array.isArray(graph) ? graph : [graph],
    });
}

export function clearJsonLd(id) {
    const tag = document.getElementById(id);

    if (tag) {
        tag.remove();
    }
}
