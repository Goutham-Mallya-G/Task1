import express from 'express';
import "dotenv/config"
import cors from "cors";
import { pool } from './config/db.js';
import authRouter from './routes/auth.js';
import groupRouter from './routes/groups.js';
import assignmentRouter from './routes/assignment.js'
import courseRouter from './routes/courses.js';

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL,
}));
app.use(express.json());

app.get("/api/health", async (req,res)=>{
    try{

        const result = await pool.query("select now()");

        return res.json({
            database : result.rows[0],
            message : "Server is healthy"
        })
    }catch(e){
        console.log(e);
        res.status(500).json({
            message : "Internal server error"
        })
    }
})

app.use('/api/auth' , authRouter);
app.use("/api/group" , groupRouter);
app.use("/api/assignment" , assignmentRouter);
app.use("/api/course", courseRouter);

app.listen(process.env.PORT, ()=>{
    console.log("Server started at the port " + process.env.PORT);
})