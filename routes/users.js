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
        await connection.query(
            'INSERT INTO users (email, password, is_admin, blacklisted, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
            [email, hashedPassword, is_admin, blacklisted]
        );

        res.status(201).json({ message: 'User created' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creating user' });
    }
});

// Update a user by ID
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { email, password, is_admin, blacklisted } = req.body;
    //VALIDATION

    const validationResult = userValidation(email, password, is_admin, blacklisted, true);
    if (validationResult[0] === false) {
        return res.status(400).json({ message: validationResult[1] });
    }

    try {
        const hashedPassword = password ? await bcrypt.hash(password, 12) : null;

        const [result] = await connection.query(
            'UPDATE users SET email = COALESCE(?, email), password = COALESCE(?, password), is_admin = COALESCE(?, is_admin), blacklisted = COALESCE(?, blacklisted), updated_at = NOW() WHERE id = ?',
            [email, hashedPassword, is_admin, blacklisted, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User updated' });
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
        res.status(500).send('Error deleting user');
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


export default router;
