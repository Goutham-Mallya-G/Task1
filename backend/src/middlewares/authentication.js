import jwt from "jsonwebtoken";
import "dotenv/config";

export async function authMiddleware(req,res,next){
    try{
        const authHeader = req.headers.authorization;
        if(!authHeader){
            return res.status(401).json({
                message : "Authentication required"
            });
        }
        const [type, token] = authHeader.split(" ");

        if (type !== "Bearer" || !token) {
            return res.status(401).json({
                message: "Invalid authorization header"
            });
        }

        const decoded = jwt.verify(token , process.env.JWT_SECRET);

        req.user = decoded;

        next();

    }catch(e){
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
}