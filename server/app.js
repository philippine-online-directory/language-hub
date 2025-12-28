require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require("express-rate-limit");

const app = express()

const contributionRouter = require('./routes/contributionRouter')
const languageRouter = require('./routes/languageRouter')
const setRouter = require('./routes/setRouter');
const authRouter = require('./routes/authRouter');
const profileRouter = require('./routes/profileRouter')
const handleError = require('./middleware/errorHandler')

const origin = process.env.FRONTEND_URL || 'http://localhost:5173'

app.use(cors({
    origin,
    credentials: true,
    optionsSuccessStatus: 200
}))

if (process.env.NODE_ENV === 'production') {
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
  }));
}

app.use(express.json())
app.use(express.urlencoded({ extended: true }))



app.use('/', authRouter)
app.use('/contributions', contributionRouter)
app.use('/languages', languageRouter)
app.use('/sets', setRouter)
app.use('/profile', profileRouter)
app.use(handleError)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

//still need a seed script