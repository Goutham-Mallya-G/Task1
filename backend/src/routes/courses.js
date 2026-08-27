import express from 'express';
import { pool } from '../config/db.js';
import { authMiddleware } from '../middlewares/authentication.js';
import { checkAuthorization } from '../middlewares/roleAuthorization.js';

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
                `select c.id, c.name, c.created_by, c.created_at,
                    exists (select 1 from course_students cs
                        where cs.course_id = c.id and cs.student_id = $1) as enrolled
             from courses c
             order by c.name`,
                [req.user.id]
        );
        return res.json({ courses: result.rows });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Failed to fetch courses' });
    }
});

router.post('/', checkAuthorization('ADMIN'), async (req, res) => {
    const { name } = req.body;
    if (!name?.trim()) {
        return res.status(400).json({ message: 'Course name is required' });
    }

    try {
        const result = await pool.query(
            `insert into courses (name, created_by)
             values ($1, $2)
             returning id, name, created_by, created_at`,
            [name.trim(), req.user.id]
        );
        return res.status(201).json({ course: result.rows[0] });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Failed to create course' });
    }
});

router.post('/:id/enroll', checkAuthorization('STUDENT'), async (req, res) => {
    try {
        const result = await pool.query(
            `insert into course_students (course_id, student_id)
             select $1, id from users where id = $2 and role = 'STUDENT'
             on conflict do nothing
             returning course_id, student_id, enrolled_at`,
            [req.params.id, req.user.id]
        );
        if (result.rows.length === 0) {
            const course = await pool.query('select id from courses where id = $1', [req.params.id]);
            return res.status(course.rows.length ? 409 : 404).json({
                message: course.rows.length ? 'You are already enrolled in this course' : 'Course not found'
            });
        }
        return res.status(201).json({ enrollment: result.rows[0] });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Failed to enroll student' });
    }
});

router.post('/:id/enroll-group', checkAuthorization('STUDENT'), async (req, res) => {
    const { groupId } = req.body;
    if (!Number.isInteger(Number(groupId))) {
        return res.status(400).json({ message: 'A valid group ID is required' });
    }

    try {
        const result = await pool.query(
            `insert into course_groups (course_id, group_id)
             select $1, id from groups
             where id = $2 and leader_id = $3
             on conflict do nothing
             returning course_id, group_id, enrolled_at`,
            [req.params.id, groupId, req.user.id]
        );
        if (result.rows.length === 0) {
            const course = await pool.query('select id from courses where id = $1', [req.params.id]);
            return res.status(course.rows.length ? 409 : 404).json({
                message: course.rows.length ? 'Your group is already enrolled or you are not its leader' : 'Course not found'
            });
        }
        return res.status(201).json({ enrollment: result.rows[0] });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Failed to enroll group' });
    }
});

export default router;
