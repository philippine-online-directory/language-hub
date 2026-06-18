import seoService from '../services/seoService.js';
import { isAdmin } from '../middleware/roleAuth.js';

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

const getIndexNowKey = [
    async (req, res) => {
        const key = seoService.getIndexNowKey();

        if (!key) {
            return res.status(404).send('Not found');
        }

        res.type('text/plain').send(`${key}\n`);
    },
];

const submitIndexNowUrls = [
    ...isAdmin,
    async (req, res, next) => {
        const { urls } = req.body;

        if (!Array.isArray(urls) || urls.length === 0 || urls.length > 10000) {
            return res.status(400).json({ message: 'urls must be a non-empty array of at most 10000 URLs' });
        }

        if (urls.some((url) => typeof url !== 'string')) {
            return res.status(400).json({ message: 'urls must contain only strings' });
        }

        try {
            const result = await seoService.submitIndexNowUrls(urls);

            res.status(200).json(result);
        } catch (err) {
            if (err.statusCode) {
                return res.status(err.statusCode).json({ message: err.message });
            }

            next(err);
        }
    },
];

const seoController = {
    getSitemap,
    getIndexNowKey,
    submitIndexNowUrls,
};

export default seoController;
