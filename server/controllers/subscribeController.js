import subscribeService from '../services/subscribeService.js'

const subscribe = async (req, res, next) => {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: 'Valid email is required' });
    }

    try {
        await subscribeService.subscribe(email);
        res.status(200).json({ message: 'Subscribed successfully' });
    } catch (err) {
        next(err);
    }
};

const unsubscribe = async (req, res, next) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).json({ message: 'Unsubscribe token is required' });
    }

    try {
        await subscribeService.unsubscribe(token);
        res.status(200).json({ message: 'Unsubscribed successfully' });
    } catch (err) {
        if (err.message === 'Invalid unsubscribe token') {
            return res.status(404).json({ message: err.message });
        }
        next(err);
    }
};

const subscribeController = { subscribe, unsubscribe };

export default subscribeController;
