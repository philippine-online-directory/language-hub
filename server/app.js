require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express()

const contributionRouter = require('./routes/contributionRouter')
const languageRouter = require('./routes/languageRouter')
const setRouter = require('./routes/setRouter');
const authRouter = require('./routes/authRouter');

const origin = process.env.FRONTEND_URL || 'http://localhost:5173'

app.use(express.json())
app.use(cors({
    origin,
    optionsSuccessStatus: 200
}))

app.use('/', authRouter)
app.use('/contributions', contributionRouter)
app.use('/languages', languageRouter)
app.use('/sets', setRouter)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});