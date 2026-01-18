import "dotenv/config";
import express from 'express'
import cors from 'cors'
import rateLimit from "express-rate-limit";

const app = express()

import contributionRouter from "./routes/contributionRouter.js";
import languageRouter from "./routes/languageRouter.js";
import setRouter from "./routes/setRouter.js";
import authRouter from "./routes/authRouter.js";
import profileRouter from "./routes/profileRouter.js";
import handleError from "./middleware/errorHandler.js";


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