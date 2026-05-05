import express from "express";
import type { Request, Response } from "express";
import dotenv from "dotenv";
import router from "./routes";
dotenv.config();
// setting up app middleware
const app = express();
app.use(express.json());
app.use(router);

// initialize port
const port = process.env.PORT || 3000;

app.get("/", (req: Request, res: Response) => {
  res.send(process.env.OPENAI_API_KEY);
});

// start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
