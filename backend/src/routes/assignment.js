import express from 'express';
const router = express.Router();
import { pool } from '../config/db.js';
import { checkAuthorization } from '../middlewares/roleAuthorization.js';
import { authMiddleware } from '../middlewares/authentication.js';

router.use(authMiddleware);

router.post("/", checkAuthorization("ADMIN"), async (req, res) => {
    const client = await pool.connect();

    try {
        const { title, description, dueDate, onedriveUrl, targetType, groupIds, courseId } = req.body;

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

        const parsedDueDate = new Date(dueDate);
        if (Number.isNaN(parsedDueDate.getTime()) || parsedDueDate.getTime() < Date.now() + 60 * 60 * 1000) {
            return res.status(400).json({
                message: "Due date must be at least 1 hour from now"
            });
        }

        if(!onedriveUrl || !onedriveUrl.trim()){
            return res.status(400).json({
                message: "OneDrive URL is required"
            });
        }

        if(!["ALL", "GROUP", "COURSE"].includes(targetType)){
            return res.status(400).json({
                message: "Target type must be ALL, GROUP, or COURSE"
            });
        }

        if (targetType === "GROUP" && (!Array.isArray(groupIds) || groupIds.length === 0)){
            return res.status(400).json({
                message: "At least one group is required"
            });
        }

        if (targetType === "GROUP" && groupIds.some((groupId) => !Number.isInteger(Number(groupId)))) {
            return res.status(400).json({
                message: "Group IDs must be valid numbers"
            });
        }

        if (targetType === "COURSE" && !Number.isInteger(Number(courseId))) {
            return res.status(400).json({ message: "A valid course ID is required" });
        }

        await client.query("begin");

        if (targetType === "GROUP") {
            const groupResult = await client.query(
                `select id from groups
                 where id = any($1::bigint[])`,
                [groupIds]
            );

            if (groupResult.rows.length !== groupIds.length) {
                await client.query("rollback");

                return res.status(404).json({
                    message: "One or more groups not found"
                });
            }
        }

        if (targetType === "COURSE") {
            const courseResult = await client.query(`select id from courses where id = $1`, [courseId]);
            if (courseResult.rows.length === 0) {
                await client.query("rollback");
                return res.status(404).json({ message: "Course not found" });
            }
        }


        const assignmentResult = await client.query(
            `insert into assignments (title, description, due_date, onedrive_url, target_type, created_by, course_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, title, description, due_date, onedrive_url, target_type, course_id, created_by, created_at`,
            [title.trim(), description || null, dueDate, onedriveUrl.trim(), targetType, req.user.id, courseId || null]
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
                `select distinct a.id, a.title, a.description, a.due_date, a.onedrive_url, a.target_type, a.course_id, a.created_at,
                    c.name as course_name,
                    (select string_agg(distinct g.name, ', ' order by g.name)
                     from assignment_groups assigned_ag
                     join groups g on g.id = assigned_ag.group_id
                     join group_members assigned_gm on assigned_gm.group_id = g.id
                     where assigned_ag.assignment_id = a.id and assigned_gm.student_id = $1) as group_names
                 from assignments a
                 left join courses c on c.id = a.course_id
                 left join assignment_groups ag on a.id = ag.assignment_id
                      left join group_members gm on ag.group_id = gm.group_id
                 left join course_students cs on cs.course_id = a.course_id and cs.student_id = $1
                 left join course_groups cg on cg.course_id = a.course_id
                 left join group_members course_gm on course_gm.group_id = cg.group_id and course_gm.student_id = $1
                      where a.target_type = 'ALL'
                          or (a.target_type = 'GROUP' and gm.student_id = $1)
                        or (a.target_type = 'COURSE' and (cs.student_id is not null or course_gm.student_id is not null))
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
    const client = await pool.connect();
        try {
            const assignmentId = req.params.id;
            const studentId = req.user.id;

            const assignmentResult = await client.query(
                `select id, target_type, course_id from assignments
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
                      left join course_students cs on cs.course_id = a.course_id and cs.student_id = $2
                      left join course_groups cg on cg.course_id = a.course_id
                      left join group_members course_gm on course_gm.group_id = cg.group_id and course_gm.student_id = $2
                      where a.id = $1 and (a.target_type = 'ALL'
                          or (a.target_type = 'GROUP' and gm.student_id = $2)
                          or (a.target_type = 'COURSE' and (cs.student_id is not null or course_gm.student_id is not null)))
                 limit 1`,
                [assignmentId, studentId]
            );

            if (accessResult.rows.length === 0) {
                return res.status(403).json({
                    message: "You are not allowed to submit this assignment"
                });
            }

            let groupId = null;
            if (assignmentResult.rows[0].target_type === 'GROUP') {
                const leaderResult = await client.query(
                    `select ag.group_id
                     from assignment_groups ag
                     join groups g on g.id = ag.group_id
                     join group_members gm on gm.group_id = g.id and gm.student_id = $2
                     where ag.assignment_id = $1 and g.leader_id = $2
                     limit 1`,
                    [assignmentId, studentId]
                );

                if (leaderResult.rows.length === 0) {
                    return res.status(403).json({
                        message: "Only the group leader can submit this assignment"
                    });
                }
                groupId = leaderResult.rows[0].group_id;
            } else if (assignmentResult.rows[0].target_type === 'COURSE') {
                const courseGroupResult = await client.query(
                    `select cg.group_id, g.leader_id
                     from course_groups cg
                     join groups g on g.id = cg.group_id
                     join group_members gm on gm.group_id = cg.group_id and gm.student_id = $2
                     where cg.course_id = $1
                     limit 1`,
                    [assignmentResult.rows[0].course_id, studentId]
                );

                if (courseGroupResult.rows.length > 0 &&
                    Number(courseGroupResult.rows[0].leader_id) !== Number(studentId)) {
                    return res.status(403).json({
                        message: "Only the group leader can submit this course assignment"
                    });
                }

                groupId = courseGroupResult.rows[0]?.group_id || null;
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
                groupId
                    ? `insert into submissions (assignment_id, student_id)
                       select $1, student_id from group_members where group_id = $2
                       on conflict (assignment_id, student_id) do nothing
                       returning id, assignment_id, student_id, confirmed_at`
                    : `insert into submissions (assignment_id, student_id)
                       values ($1, $2)
                       returning id, assignment_id, student_id, confirmed_at`,
                groupId ? [assignmentId, groupId] : [assignmentId, studentId]
            );

            return res.status(201).json({
                message: "Assignment submission confirmed",
                submission: result.rows[0],
                shared: Boolean(groupId)
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
                `select a.id, a.due_date, a.target_type,
                    exists (
                        select 1 from submissions s
                        where s.assignment_id = a.id and (
                            (a.target_type <> 'GROUP' and s.student_id = $2)
                            or (a.target_type = 'GROUP' and exists (
                                select 1 from assignment_groups ag
                                join group_members gm on gm.group_id = ag.group_id and gm.student_id = $2
                                where ag.assignment_id = a.id
                                  and exists (select 1 from group_members group_submission_member
                                              where group_submission_member.group_id = ag.group_id
                                                and group_submission_member.student_id = s.student_id)
                            ))
                        )
                    ) as submitted,
                    (a.target_type = 'ALL' or (a.target_type = 'GROUP' and exists (
                        select 1 from assignment_groups ag
                        join groups g on g.id = ag.group_id
                        join group_members gm on gm.group_id = g.id and gm.student_id = $2
                        where ag.assignment_id = a.id and g.leader_id = $2
                    )) or (a.target_type = 'COURSE' and exists (
                        select 1 from course_groups cg
                        join groups g on g.id = cg.group_id
                        join group_members gm on gm.group_id = cg.group_id and gm.student_id = $2
                        where cg.course_id = a.course_id and g.leader_id = $2
                    )) or (a.target_type = 'COURSE' and exists (
                        select 1 from course_students cs
                        where cs.course_id = a.course_id and cs.student_id = $2
                          and not exists (
                              select 1 from course_groups grouped_course
                              join group_members grouped_member on grouped_member.group_id = grouped_course.group_id
                              where grouped_course.course_id = a.course_id and grouped_member.student_id = $2
                          )
                    ))) as can_submit,
                    (a.target_type = 'GROUP' or (a.target_type = 'COURSE' and exists (
                        select 1 from course_groups cg
                        join group_members gm on gm.group_id = cg.group_id and gm.student_id = $2
                        where cg.course_id = a.course_id
                    ))) as shared
                 from assignments a
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

            if (assignment.submitted) {
                status = "SUBMITTED";
            } else if (new Date(assignment.due_date) < new Date()) {
                status = "OVERDUE";
            } else {
                status = "PENDING";
            }

            return res.status(200).json({
                assignmentId: assignment.id,
                status,
                canSubmit: assignment.can_submit,
                shared: assignment.shared
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
                `select id, title, description, due_date, onedrive_url, target_type, course_id, created_at from assignments
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

router.get("/:id", checkAuthorization("ADMIN"), async (req, res) => {
    try {
        const result = await pool.query(
            `select a.id, a.title, a.description, a.due_date, a.onedrive_url,
                    a.target_type, a.course_id, a.created_by,
                    coalesce(array_agg(ag.group_id) filter (where ag.group_id is not null), '{}') as group_ids
             from assignments a
             left join assignment_groups ag on ag.assignment_id = a.id
             where a.id = $1 and a.created_by = $2
             group by a.id`,
            [req.params.id, req.user.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Assignment not found' });
        }
        return res.json({ assignment: result.rows[0] });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Failed to fetch assignment' });
    }
});

router.put("/:id", checkAuthorization("ADMIN"), async (req, res) => {
    const client = await pool.connect();
    try {
        const { title, description, dueDate, onedriveUrl, targetType, groupIds, courseId } = req.body;
        if (!title?.trim() || !dueDate || !onedriveUrl?.trim()) {
            return res.status(400).json({ message: 'Title, due date, and OneDrive URL are required' });
        }
        const parsedDueDate = new Date(dueDate);
        if (Number.isNaN(parsedDueDate.getTime()) || parsedDueDate.getTime() < Date.now() + 60 * 60 * 1000) {
            return res.status(400).json({ message: 'Due date must be at least 1 hour from now' });
        }
        if (!['ALL', 'GROUP', 'COURSE'].includes(targetType)) {
            return res.status(400).json({ message: 'Target type must be ALL, GROUP, or COURSE' });
        }
        if (targetType === 'GROUP' && (!Array.isArray(groupIds) || groupIds.length === 0)) {
            return res.status(400).json({ message: 'At least one group is required' });
        }
        if (targetType === 'COURSE' && !Number.isInteger(Number(courseId))) {
            return res.status(400).json({ message: 'A valid course ID is required' });
        }

        await client.query('begin');
        const ownership = await client.query(
            'select id from assignments where id = $1 and created_by = $2',
            [req.params.id, req.user.id]
        );
        if (ownership.rows.length === 0) {
            await client.query('rollback');
            return res.status(404).json({ message: 'Assignment not found' });
        }
        if (targetType === 'GROUP') {
            const groups = await client.query('select id from groups where id = any($1::bigint[])', [groupIds]);
            if (groups.rows.length !== groupIds.length) {
                await client.query('rollback');
                return res.status(404).json({ message: 'One or more groups not found' });
            }
        }
        if (targetType === 'COURSE') {
            const course = await client.query('select id from courses where id = $1', [courseId]);
            if (course.rows.length === 0) {
                await client.query('rollback');
                return res.status(404).json({ message: 'Course not found' });
            }
        }
        const updated = await client.query(
            `update assignments
             set title = $1, description = $2, due_date = $3, onedrive_url = $4,
                 target_type = $5, course_id = $6, updated_at = current_timestamp
             where id = $7
             returning id, title, description, due_date, onedrive_url, target_type, course_id, created_by, updated_at`,
            [title.trim(), description || null, dueDate, onedriveUrl.trim(), targetType, courseId || null, req.params.id]
        );
        await client.query('delete from assignment_groups where assignment_id = $1', [req.params.id]);
        if (targetType === 'GROUP') {
            await client.query(
                `insert into assignment_groups (assignment_id, group_id)
                 select $1, unnest($2::bigint[])`,
                [req.params.id, groupIds]
            );
        }
        await client.query('commit');
        return res.json({ message: 'Assignment updated successfully', assignment: updated.rows[0] });
    } catch (error) {
        await client.query('rollback');
        console.log(error);
        return res.status(500).json({ message: 'Failed to update assignment' });
    } finally {
        client.release();
    }
});

export default router;