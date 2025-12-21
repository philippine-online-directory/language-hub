module.exports = function handleError(err, req, res, next) {
    console.error(err);

    if (err.statusCode) {
        return res.status(err.statusCode).json({
            message: err.message
        });
    }

    if (err.code === 'P2025') {
        return res.status(404).json({
            message: 'Resource not found'
        });
    }

    if (err.code === 'P2002') {
        return res.status(400).json({
            message: 'Duplicate value'
        });
    }

    return res.status(500).json({
        message: 'Internal server error'
    });
};
