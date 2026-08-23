import express from 'express';
import "dotenv/config"
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req,res)=>{
    return res.json({
        message : "Server is healthy"
    })
})

app.listen(process.env.PORT, ()=>{
    console.log("Server started at the port " + process.env.PORT);
})