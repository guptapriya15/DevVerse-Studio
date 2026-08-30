import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import cors from "cors";
import cookieParser from "cookie-parser";

import { connectDB } from './config/db.js'
import router from './routes/auth.route.js'

const port = process.env.PORT || 8001

const app = express()

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json())

app.use(cookieParser());

app.use("/",router)

app.get("/",(req,res)=>{
    res.json({ "message" : "Hello from Auth" })
})

app.listen(port,()=>{
    connectDB()
    console.log(`Auth Service Started at ${port}`)
})