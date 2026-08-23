import express from 'express';
const router = express.Router();
import "dotenv/config";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {pool} from "../config/db.js";
import { authMiddleware } from '../middlewares/authentication.js';
import { checkAuthorization } from '../middlewares/roleAuthorization.js';

router.post("/register" , async(req,res)=>{
    try{
        const{name, email, password} = req.body;
        if(!name || !email || !password){
            return res.status(400).json({
                message: "Name, email and password are required"
            })
        }

        const existingUser = await pool.query(
            "select id from users where email = $1", [email]
        );

        if(existingUser.rows.length > 0){
            return res.status(409).json({
                message: "Email already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `insert into users (name, email, password)
            values ($1, $2, $3)
            returning id, name, email, role`,
            [name, email, hashedPassword]
        );

        res.status(201).json({
            message: "User registered successfully",
            user: result.rows[0]
        });

    }catch(e){
        console.log(e);
        return res.status(500).json({
            message:"Internal server error"
        })
    }
})

router.post("/login" , async (req, res)=>{
    try{
        const {email, password} = req.body;

        if(!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const result = await pool.query(
            `select id,email,name,password,role from users where email = $1`,[email]
        );

        if(result.rows.length == 0){
            return res.status(401).json({
                message: "Invalid email or password"
            })
        }

        const user = result.rows[0];

        const isPasswordMatch = await bcrypt.compare(password , user.password);

        if(!isPasswordMatch){
            return res.status(401).json({
                message: "Invalid email or password"
            })
        }

        const token = jwt.sign({id:user.id , role: user.role}, process.env.JWT_SECRET, {expiresIn : '1d'});

        res.status(200).json({
            message : "You have successfully logged in",
            token : token,
            user : {
                id : user.id,
                name : user.name,
                email : user.email,
                role : user.role
            }
        })

    }catch(e){
        console.log(e);
        return res.status(500).json({
            message:"Internal server error"
        })
    }
})

router.use(authMiddleware);

router.get("/me", checkAuthorization("STUDENT"), async (req, res) => {
    res.json({
        message: "You are authenticated",
        user: req.user
    });
});

export default router;