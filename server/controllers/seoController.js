import seoService from '../services/seoService.js';

const getSitemap = [
    async (req, res, next) => {
        try {
            const sitemap = await seoService.getSitemapXml();

            res.type('application/xml').send(sitemap);
        } catch (err) {
            next(err);
        }
    },
];

const seoController = {
    getSitemap,
};

export default seoController;
