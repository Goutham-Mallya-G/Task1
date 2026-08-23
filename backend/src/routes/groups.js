import express from 'express';
import { pool } from '../config/db.js';
import { authMiddleware } from '../middlewares/authentication.js';
import { checkAuthorization } from '../middlewares/roleAuthorization.js';

const router = express.Router();

router.use(authMiddleware);
router.use(checkAuthorization("STUDENT"));

router.post("/", checkAuthorization("STUDENT") , async(req,res)=>{
    const client = await pool.connect();
    try{
        const {name} = req.body;
        if(!name || !name.trim()){
            return res.status(400).json({
                message : "Group name is required"
            })
        }

        await client.query("Begin");
        
        const groupResult = await client.query(
            `insert into groups (name, created_by)
            values ($1, $2)
            returning id, name, created_by`,
            [name.trim() , req.user.id]
        );

        const group = groupResult.rows[0];
        
        await client.query(
            `insert into group_members(group_id, student_id)
            values($1, $2)`,
            [group.id , req.user.id]
        );

        await client.query("Commit");

        return res.status(201).json({
            message : "Group created successfully",
            group
        })

    }catch(e){
        await client.query("rollback");

        console.log(e);

        return res.status(500).json({
            message: "Failed to create group",
        })

    }finally{
        client.release();
    }
})

router.get("/", checkAuthorization("STUDENT") , async(req,res)=>{
    try{
        const result = await pool.query(
            `select g.id, g.name, g.created_by , g.created_at from groups g
            join group_members gm on g.id = gm.group_id
            where gm.student_id = $1
            order by g.created_at desc`,
            [req.user.id]
        )

        return res.status(200).json({
            groups : result.rows
        })

    }catch(e){
        console.log(e);
        return res.status(500).json({
            message : "Faild to fetch the groups"
        })
    }
})

router.post("/:id/add" , checkAuthorization("STUDENT"), async(req,res)=>{
    const client = await pool.connect();
    try{
        const {email} = req.body;
        const {id} = req.params;

        if(!email || !email.trim()){
            return res.status(400).json({
                message : "Studnet email is required"
            })
        }

        //check if group exits
        const groupResult = await client.query(
            `select name, created_by from groups
            where id = $1`,
            [id]
        );

        if(groupResult.rows.length === 0){
            return res.status(404).json({
                message : "Group cannot be found"
            })
        }

        const group = groupResult.rows[0];

        //check is group creator adding student
        if(group.created_by !== req.user.id){
            return res.status(403).json({
                message : "Only group creator can add studnet in groups"
            })
        }

        //check user by email exists
        const userResult = await client.query(
            `select id, name, email, role from users
            where email = $1`,
            [email.trim()]
        )
        if(userResult.rows.length === 0){
             return res.status(404).json({
                message : "User cannot be found"
            })
        }

        const user = userResult.rows[0];
        //check user is student
        if(user.role !== 'STUDENT'){
            return res.status(400).json({
                message : "Only students can be added in groups"
            })
        }

        //check if studet is already in group
        const memberResult = await client.query(
            `select 1 from group_members
            where group_id = $1 and student_id = $2`,
            [id , user.id]
        )

        if(memberResult.rows.length > 0){
            return res.status(409).json({
                message: "Student is already a member of this group"
            });
        }

        //add to group
        await client.query(
            `insert into group_members(group_id,student_id)
            values($1,$2)`,
            [id, user.id]
        )

        return res.status(201).json({
            message : "Studnet added to the group",
            student : {
                id : user.id,
                name : user.name,
                email : user.email
            }
        })

    }catch(e){
        console.log(e);
        return res.status(500).json({
            message : "Failed to add student in group"
        })
    }finally{
        client.release();
    }
})

router.get("/:id/members", checkAuthorization("STUDENT") , async(req,res) =>{
    const client = await pool.connect();
    try{
        const {id} = req.params;
        const groupResult = await client.query(
            `select id, name, created_by from groups
            where id = $1`,
            [id]
        );

        if(groupResult.rows.length === 0){
            return res.status(404).json({
                message : "Group not found"
            });
        }

        const group = groupResult.rows[0];

        const membersResult = await client.query(
            `select u.id, u.name, u.email from users u
            join group_members gm on u.id = gm.student_id
            where gm.group_id = $1
            order by u.name`,
            [id]
        )

        const isMember = membersResult.rows.some(
            member => member.id === req.user.id
        )

        if(!isMember){
            return res.status(403).json({
                message: "You are not a member of this group"
            });
        }


        return res.status(200).json({
            group: {
                ...group,
                members: membersResult.rows
            }
        });


    }catch(e){
        console.log(e);
        return res.status(500).json({
            message : "Failed to fetch the members of this group"
        })
    }finally{
        client.release();
    }
})

export default router;