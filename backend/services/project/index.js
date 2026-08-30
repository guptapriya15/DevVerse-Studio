import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import { connectDB } from './config/db.js'
import router from './routes/project.route.js'


const port = process.env.PORT || 8002

const app = express()

app.use(express.json())

app.use("/",router)



app.get("/",(req,res)=>{
    res.json({ "message" : "Hello from Project Service" })
})

app.listen(port,()=>{
    connectDB()
    console.log(`Project Service Started at ${port}`)
})