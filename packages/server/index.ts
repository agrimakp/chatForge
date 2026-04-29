import express from "express";
import type { Request, Response } from "express";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// define route and route handler

app.get("/", (req: Request, res: Response) => {
  res.send(process.env.OPENAI_API_KEY);
});

// start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});