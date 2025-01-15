import express from 'express';
import connection from '../DB/connection.js'; // Update path based on where your DB connection is
import { userValidation } from '../services/table_validation.js';
import { validateLimitOffset } from '../utils/verification.js';
import bcrypt from 'bcrypt';

const router = express.Router();

router.get('/', async (req, res) => {
    const { limit = 10, offset = 0 } = req.query;

    // Validate limit and offset
    const validationResult = validateLimitOffset(limit, offset);
    if (validationResult[0] === false) {
        return res.status(400).json({ message: validationResult[1] });
    }
    try {
        const [rows] = await connection.query(
            'SELECT * FROM users LIMIT ? OFFSET ?',
            [validationResult[1], validationResult[2] ? null : offset]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching users');
    }
});

// Get user details by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await connection.query('SELECT * FROM users WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).send('User not found');
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching user details');
    }
});

// Add a new user
router.post('/', async (req, res) => {
    const { email, password, is_admin = false, blacklisted = false } = req.body;

    // Validate the user input
    const validationResult = userValidation(email, password, is_admin, blacklisted, false);
    if (validationResult[0] === false) {
        return res.status(400).json({ message: validationResult[1] });
    }

    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Insert the user into the database
        const [result] = await connection.query(
            'INSERT INTO users (email, password, is_admin, blacklisted, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
            [email, hashedPassword, is_admin, blacklisted]
        );

        // Get the newly created user from the database
        const [user] = await connection.query(
            'SELECT id, email, is_admin, blacklisted, created_at, updated_at FROM users WHERE id = ?',
            [result.insertId] // Use the ID of the newly inserted user
        );

        // Return the user data along with a success message
        res.status(201).json({ message: 'User created', user: user[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creating user' });
    }
});


// Update a user by ID
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { email, password, is_admin, blacklisted } = req.body;

    // Validate the user input
    const validationResult = userValidation(email, password, is_admin, blacklisted, true);
    if (validationResult[0] === false) {
        return res.status(400).json({ message: validationResult[1] });
    }

    try {
        // Optionally hash the password if it's provided
        const hashedPassword = password ? await bcrypt.hash(password, 12) : null;

        // Update the user in the database
        const [result] = await connection.query(
            'UPDATE users SET email = COALESCE(?, email), password = COALESCE(?, password), is_admin = COALESCE(?, is_admin), blacklisted = COALESCE(?, blacklisted), updated_at = NOW() WHERE id = ?',
            [email, hashedPassword, is_admin, blacklisted, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Fetch the updated user details
        const [user] = await connection.query(
            'SELECT id, email, is_admin, blacklisted, created_at, updated_at FROM users WHERE id = ?',
            [id]
        );

        // Return the updated user data
        res.json({ message: 'User updated', user: user[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating user' });
    }
});

// Delete a user by ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await connection.query('DELETE FROM users WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).send('User not found');
        }
        res.send('User deleted');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error deleting user with ID ' + id);
    }
});

// Get only admin users
router.get('/filter/admins', async (req, res) => {
    try {
        const [rows] = await connection.query('SELECT * FROM users WHERE is_admin = true');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching admins');
    }
});

// Get only blacklisted users
router.get('/filter/blacklisted', async (req, res) => {
    try {
        const [rows] = await connection.query('SELECT * FROM users WHERE blacklisted = true');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching blacklisted users');
    }
});

router.get('/userAndProfile/:id', async (req, res) => {
    const { id } = req.params; // Get the user id from the URL parameter
    try {
        const [result] = await connection.query(
            `SELECT users.*, profiles.* 
             FROM users 
             LEFT JOIN profiles ON users.id = profiles.user_id 
             WHERE users.id = ?`, 
            [id]
        );

        if (result.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = result[0];
        res.json({
            user: {
                id: user.id,
                email: user.email,
                is_admin: user.is_admin,
                blacklisted: user.blacklisted,
                created_at: user.created_at,
                updated_at: user.updated_at
            },
            profile: {
                id: user.profile_id,
                username: user.username,
                birthday: user.birthday,
                pfp: user.pfp,
                about_me: user.about_me,
                created_at: user.profile_created_at,
                updated_at: user.profile_updated_at
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching user and profile' });
    }
});

router.get('/combinedQuery/userDetails', async (req, res) => {
    const { name, limit = 10, offset = 0 } = req.query;

    // Validate limit and offset
    const validationResult = validateLimitOffset(limit, offset);
    if (validationResult[0] === false) {
        return res.status(400).json({ message: validationResult[1] });
    }

    try {        // Construct the SQL query with joins and optional name filtering
        let query = `
            SELECT 
                users.id AS user_id, users.email AS user_email,
                profiles.username, profiles.about_me, profiles.pfp, 
                leaderboards.highscore,
                comments.content AS comment_content, comments.created_at AS comment_created_at,
                faqs.question AS faq_question, faqs.answer AS faq_answer,
                news.title AS news_title, news.content AS news_content,
                profile_comments.content AS profile_comment_content,
                achievements.name AS achievement_name
            FROM users
            LEFT JOIN profiles ON users.id = profiles.user_id
            LEFT JOIN leaderboards ON users.id = leaderboards.user_id
            LEFT JOIN comments ON users.id = comments.user_id
            LEFT JOIN faqs ON users.id = faqs.user_id
            LEFT JOIN news ON users.id = news.user_id
            LEFT JOIN profile_comments ON users.id = profile_comments.user_id
            LEFT JOIN achievement_user ON users.id = achievement_user.user_id
            LEFT JOIN achievements ON achievement_user.achievement_id = achievements.id
        `;

        const params = [];

        console.log('Executing SQL Query:', query, params);


        // Add a name filter if provided
        if (name) {
            query += ' WHERE profiles.username LIKE ?';
            params.push(`%${name}%`);
        }

        // Add LIMIT and OFFSET
        query += ' LIMIT ? OFFSET ?';
        params.push(Number(limit), Number(offset));

        // Execute the query
        const [results] = await connection.query(query, params);

        // Group achievements by profile
        const response = {};
        results.forEach(row => {
            if (!response[row.user_id]) {
                response[row.user_id] = {
                    user: {
                        id: row.user_id,
                        email: row.user_email,
                    },
                    profile: {
                        username: row.username,
                        about_me: row.about_me,
                        pfp: row.pfp,
                    },
                    leaderboard: {
                        highscore: row.highscore,
                    },
                    comments: [],
                    faqs: [],
                    news: [],
                    profile_comments: [],
                    achievements: [],
                };
            }

            const userResponse = response[row.user_id];

            // Add comment (ensure no duplicates)
            if (row.comment_content && !userResponse.comments.some(c => 
                c.content.trim().toLowerCase() === row.comment_content.trim().toLowerCase() &&
                new Date(c.created_at).getTime() === new Date(row.comment_created_at).getTime()
            )) {
                userResponse.comments.push({
                    content: row.comment_content.trim(),
                    created_at: new Date(row.comment_created_at).toISOString(),
                });
            }

            // Add FAQ (ensure no duplicates)
            if (row.faq_question && !userResponse.faqs.some(f => f.question === row.faq_question && f.answer === row.faq_answer)) {
                userResponse.faqs.push({
                    question: row.faq_question,
                    answer: row.faq_answer,
                });
            }

            // Add News (ensure no duplicates)
            if (row.news_title && !userResponse.news.some(n => n.title === row.news_title && n.content === row.news_content)) {
                userResponse.news.push({
                    title: row.news_title,
                    content: row.news_content,
                });
            }

            // Add Profile Comment (ensure no duplicates)
            if (row.profile_comment_content && !userResponse.profile_comments.some(pc => pc.content === row.profile_comment_content)) {
                userResponse.profile_comments.push({
                    content: row.profile_comment_content,
                });
            }

            // Add Achievement (ensure no duplicates)
            if (row.achievement_name && !userResponse.achievements.includes(row.achievement_name)) {
                userResponse.achievements.push(row.achievement_name);
            }
        });
        console.log('Query Results:', results);
        res.status(200).json({
            data: Object.values(response),
        });

    } catch (err) {
        console.error('Error fetching user details:', err);
        res.status(500).json({ message: 'Error fetching user details' });
    }
});

router.get('/filter/userAndProfilesBasedOnHighscore', async (req, res) => {
    try {
        // Assuming you're using a raw SQL query with a database library
        const query = `
            SELECT 
                users.id AS userId, 
                users.email, 
                profiles.username AS profileName, 
                profiles.birthday, 
                profiles.about_me,
                leaderboards.highscore
            FROM 
                users
            INNER JOIN 
                profiles ON users.id = profiles.user_id
            INNER JOIN 
                leaderboards ON users.id = leaderboards.user_id
            ORDER BY 
                leaderboards.highscore DESC;
        `;

        const [results] = await connection.query(query);

        res.status(200).json({
            data: results,
        });
    } catch (error) {
        console.error('Error fetching user profiles based on highscore:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching data.',
        });
    }

})



export default router;
