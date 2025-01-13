import express from 'express';
import connection from '../DB/connection.js'; // Update path based on where your DB connection is
import { profileValidation } from '../services/table_validation.js';
import { validateLimitOffset,isString } from '../utils/verification.js';
import bcrypt from 'bcrypt';

const router = express.Router();

router.post('/', async (req, res) => {
    const { user_id, username, birthday, pfp = null, about_me = null } = req.body;

    //VALIDATION
    const validationResult = profileValidation(user_id, username, birthday, pfp, about_me, false);
    if (validationResult[0] === false) {
        return res.status(400).json({ message: validationResult[1] });
    }

    try {
        // Check if user_id exists in users table
        const [user] = await connection.query('SELECT id FROM users WHERE id = ?', [user_id]);
        if (!user.length) {
            return res.status(404).json({ message: 'user_id does not reference an existing user' });
        }
        const [existingProfile] = await connection.query('SELECT user_id FROM profiles WHERE user_id = ?', [user_id]);
        if (existingProfile.length) {
            return res.status(400).json({ message: 'This user already has a profile linked' });
        }
        // Insert the profile
        await connection.query(
            'INSERT INTO profiles (user_id, username, birthday, pfp, about_me, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
            [user_id, username, birthday, pfp, about_me]
        );

        res.status(201).json({ message: 'Profile created' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creating profile' });
    }
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { username, birthday, pfp, about_me } = req.body;

    //VALIDATION
    const validationResult = profileValidation(id, username, birthday, pfp, about_me, true);
    if (validationResult[0] === false) {
        return res.status(400).json({ message: validationResult[1] });
    }

    try {
        const [result] = await connection.query(
            'UPDATE profiles SET username = COALESCE(?, username), birthday = COALESCE(?, birthday), pfp = COALESCE(?, pfp), about_me = COALESCE(?, about_me), updated_at = NOW() WHERE id = ?',
            [username, birthday, pfp, about_me, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        res.json({ message: 'Profile updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating profile' });
    }
});

router.get('/', async (req, res) => {
    const { limit, offset } = req.query;

    // Validate `limit` and `offset` (ensure they are positive integers if provided)
    const validationResult = validateLimitOffset(limit, offset);
    if (validationResult[0] === false) {
        return res.status(400).json({ message: validationResult[1] });
    }

    try {
        // Construct query dynamically based on `limit` and `offset`
        let query = 'SELECT * FROM profiles';
        const params = [];

        if (validationResult[1] !== null) {
            query += ' LIMIT ?';
            params.push(validationResult[1]);
        }

        if (validationResult[2] !== null) {
            query += validationResult[1] !== null ? ' OFFSET ?' : ' LIMIT 18446744073709551615 OFFSET ?'; // Handle MySQL's "LIMIT only with OFFSET" case
            params.push(validationResult[2]);
        }

        const [profiles] = await connection.query(query, params);
        res.json(profiles);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching profiles' });
    }
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [profile] = await connection.query('SELECT * FROM profiles WHERE id = ?', [id]);
        if (!profile.length) {
            return res.status(404).json({ message: 'Profile not found' });
        }
        res.json(profile[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching profile' });
    }
});
router.get('/username/:username', async (req, res) => {
    const { username } = req.params; // Get the username from the URL parameter
    if (!isString(username)) {
        return res.status(400).json({ message: 'Invalid username' });
    }	
    try {
        const [user] = await connection.query(
            'SELECT * FROM profiles WHERE username = ?',
            [username]
        );
        if (user.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user[0]); // Send the first matching user
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching user' });
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await connection.query('DELETE FROM profiles WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Profile not found' });
        }
        res.json({ message: 'Profile deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error deleting profile' });
    }
});

export default router;
