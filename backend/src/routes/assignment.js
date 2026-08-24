import express from 'express';
const router = express.Router();
import { pool } from '../config/db.js';
import { checkAuthorization } from '../middlewares/roleAuthorization.js';
import { authMiddleware } from '../middlewares/authentication.js';

router.use(authMiddleware);

router.post("/", checkAuthorization("ADMIN"), async (req, res) => {
    const client = await pool.connect();

    try {
        const { title, description, dueDate, onedriveUrl, targetType, groupIds } = req.body;

        if(!title || !title.trim()){
            return res.status(400).json({
                message: "Assignment title is required"
            });

        }

        if(!dueDate){
            return res.status(400).json({
                message: "Due date is required"
            });
        }

        if(!onedriveUrl || !onedriveUrl.trim()){
            return res.status(400).json({
                message: "OneDrive URL is required"
            });
        }

        if(!["ALL", "GROUP"].includes(targetType)){
            return res.status(400).json({
                message: "Target type must be ALL or GROUP"
            });
        }

        if(targetType === "GROUP" && (!Array.isArray(groupIds) || groupIds.length === 0)){
            return res.status(400).json({
                message: "At least one group is required"
            });
        }

        await client.query("begin");

        if (targetType === "GROUP") {
            const groupResult = await client.query(
                `select id from groups
                 where id = $1`,
                [groupIds]
            );

            if (groupResult.rows.length !== groupIds.length) {
                await client.query("rollback");

                return res.status(404).json({
                    message: "One or more groups not found"
                });
            }
        }


        const assignmentResult = await client.query(
            `insert into assignments (title, description, due_date, onedrive_url, target_type, created_by)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, title, description, due_date, onedrive_url, target_type, created_by, created_at`,
            [title.trim(), description || null, dueDate, onedriveUrl.trim(), targetType, req.user.id]
        );

        const assignment = assignmentResult.rows[0];

        if(targetType === "GROUP"){
            for (const groupId of groupIds) {
                await client.query(
                    `insert into assignment_groups (assignment_id, group_id)
                     values ($1, $2)`,
                    [assignment.id, groupId]
                );
            }
        }

        await client.query("commit");

        return res.status(201).json({
            message: "Assignment created successfully",
            assignment
        });

    } catch (e) {
        await client.query("rollback");

        console.log(e);

        return res.status(500).json({
            message: "Failed to create assignment"
        });

    } finally {
        client.release();
    }
});

router.get("/", checkAuthorization("STUDENT"), async (req, res) => {
        try {
            const result = await pool.query(
                `select distinct a.id, a.title, a.description, a.due_date, a.onedrive_url, a.target_type, a.created_at from assignments a
                 left join assignment_groups ag on a.id = ag.assignment_id
                 left join group_members gm on ag.group_id = gm.group_id
                 where a.target_type = 'ALL' or gm.student_id = $1
                 order by a.due_date ASC`,
                [req.user.id]
            );

            return res.status(200).json({
                assignments: result.rows
            });

        } catch (e) {
            console.log(e);

            return res.status(500).json({
                message: "Failed to fetch assignments"
            });
        }
    }
);

router.post("/:id/submit",checkAuthorization("STUDENT"),async (req, res) => {
        const client = pool.connect();
        try {
            const assignmentId = req.params.id;
            const studentId = req.user.id;

            const assignmentResult = await client.query(
                `select id, target_type from assignments
                 where id = $1`,
                [assignmentId]
            );

            if (assignmentResult.rows.length === 0) {
                return res.status(404).json({
                    message: "Assignment not found"
                });
            }

            const accessResult = await client.query(
                `select 1 from assignments a
                 left join assignment_groups ag on a.id = ag.assignment_id
                 left join group_members gm on ag.group_id = gm.group_id
                 where a.id = $1 and ( a.target_type = 'ALL' or gm.student_id = $2)
                 limit 1`,
                [assignmentId, studentId]
            );

            if (accessResult.rows.length === 0) {
                return res.status(403).json({
                    message: "You are not allowed to submit this assignment"
                });
            }

            const existingSubmission = await client.query(
                `select id from submissions
                 where assignment_id = $1 and student_id = $2`,
                [assignmentId, studentId]
            );

            if (existingSubmission.rows.length > 0) {
                return res.status(409).json({
                    message: "Assignment already submitted"
                });
            }

            const result = await client.query(
                `insert into submissions (assignment_id, student_id)
                 values ($1, $2)
                 returning id, assignment_id, student_id, confirmed_at`,
                [assignmentId, studentId]
            );

            return res.status(201).json({
                message: "Assignment submission confirmed",
                submission: result.rows[0]
            });

        } catch (e) {
            console.log(e);

            return res.status(500).json({
                message: "Failed to confirm submission"
            });
        }finally{
            client.release();
        }
    }
);

router.get("/:id/status", checkAuthorization("STUDENT"), async (req, res) => {
        try {
            const assignmentId = req.params.id;
            const studentId = req.user.id;

            const assignmentResult = await pool.query(
                `select a.id, a.due_date, s.id as submission_id from assignments a
                 left join submissions s on a.id = s.assignment_id and s.student_id = $2
                 where a.id = $1`,
                [assignmentId, studentId]
            );

            if (assignmentResult.rows.length === 0) {
                return res.status(404).json({
                    message: "Assignment not found"
                });
            }

            const assignment = assignmentResult.rows[0];

            let status;

            if (assignment.submission_id) {
                status = "SUBMITTED";
            } else if (new Date(assignment.due_date) < new Date()) {
                status = "OVERDUE";
            } else {
                status = "PENDING";
            }

            return res.status(200).json({
                assignmentId: assignment.id,
                status
            });

        } catch (e) {
            console.log(e);

            return res.status(500).json({
                message: "Failed to fetch assignment status"
            });
        }
    }
);

router.get("/:id/progress",checkAuthorization("ADMIN"),async (req, res) => {
        try {
            const assignmentId = req.params.id;

            const assignmentResult = await pool.query(
                `select id, title, target_type from assignments
                 where id = $1`,
                [assignmentId]
            );

            if (assignmentResult.rows.length === 0) {
                return res.status(404).json({
                    message: "Assignment not found"
                });
            }

            const result = await pool.query(
                `select count(distinct u.id) as total_students, count(distinct s.student_id) as submitted from users u
                 left join group_members gm on u.id = gm.student_id
                 left join assignment_groups ag on gm.group_id = ag.group_id and ag.assignment_id = $1
                 left join submissions s on s.assignment_id = $1 and s.student_id = u.id
                 where u.role = 'STUDENT' and ($2 = 'ALL' OR ag.assignment_id IS NOT NULL)`,
                [assignmentId,assignmentResult.rows[0].target_type]
            );

            const totalStudents = Number(result.rows[0].total_students);
            const submitted = Number(result.rows[0].submitted);
            const pending = totalStudents - submitted;

            const progress = (totalStudents === 0) ? 0 : Number(((submitted / totalStudents) * 100).toFixed(2));

            return res.status(200).json({
                assignmentId,
                totalStudents,
                submitted,
                pending,
                progress
            });

        } catch (e) {
            console.log(e);

            return res.status(500).json({
                message: "Failed to fetch assignment progress"
            });
        }
    }
);

router.get("/:id/submissions", checkAuthorization("ADMIN"), async (req, res) => {
        try {
            const assignmentId = req.params.id;

            const assignment = await pool.query(
                `select id from assignments
                 where id = $1`,
                [assignmentId]
            );

            if (assignment.rows.length === 0) {
                return res.status(404).json({
                    message: "Assignment not found"
                });
            }

            const result = await pool.query(
                `select u.id, u.name, u.email, s.confirmed_at from submissions s
                 join users u on u.id = s.student_id
                 where s.assignment_id = $1
                 order by s.confirmed_at desc`,
                [assignmentId]
            );

            return res.status(200).json({
                submissions: result.rows
            });

        } catch (e) {
            console.log(e);

            return res.status(500).json({
                message: "Failed to fetch submissions"
            });
        }
    }
);


router.get("/admin", checkAuthorization("ADMIN"), async (req, res) => {
        try {
            const result = await pool.query(
                `select id, title, description, due_date, onedrive_url, target_type, created_at from assignments
                 where created_by = $1
                 order by created_at desc`,
                [req.user.id]
            );

            return res.status(200).json({
                assignments: result.rows
            });

        } catch (e) {
            console.log(e);

            return res.status(500).json({
                message: "Failed to fetch assignments"
            });
        }
    }
);

export default router;