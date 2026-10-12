import dotenv from "dotenv";
dotenv.config();
import express from "express";
import { connectDB } from "./config/db.js";
import router from "./routes/payment.route.js";

const port = process.env.PORT || 8006;

const app = express();

app.use(express.json());
app.use("/", router);

app.get("/", (req, res) => {
  res.json({ message: "Hello from Payment Service" });
});

app.listen(port, () => {
  connectDB();
  console.log(`Payment Service Started at ${port}`);
});
