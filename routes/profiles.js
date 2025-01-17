import express from 'express';
import connection from '../DB/connection.js'; // Update path based on where your DB connection is
import { profileValidation } from '../services/table_validation.js';
import { validateLimitOffset,isString } from '../utils/verification.js';
import bcrypt from 'bcrypt';

const router = express.Router();

router.post('/', async (req, res) => {
    const { user_id, username, birthday, pfp, about_me } = req.body;

    // VALIDATION
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

        // Check if the user already has a profile
        const [existingProfile] = await connection.query('SELECT user_id FROM profiles WHERE user_id = ?', [user_id]);
        if (existingProfile.length) {
            return res.status(400).json({ message: 'This user already has a profile linked' });
        }

        // Insert the profile
        const [insertResult] = await connection.query(
            'INSERT INTO profiles (user_id, username, birthday, pfp, about_me, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
            [user_id, username, birthday, pfp, about_me]
        );

        // Fetch the newly created profile
        const [newProfile] = await connection.query('SELECT * FROM profiles WHERE id = ?', [insertResult.insertId]);

        res.status(201).json({ message: 'Profile created', profile: newProfile[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creating profile' });
    }
});

router.put('/:id', async (req, res) => {
    let { id } = req.params;
    const { username, birthday, pfp, about_me } = req.body;

    // Parse ID to integer
    id = parseInt(id, 10);
    if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
    }

    // VALIDATION
    const validationResult = profileValidation(username, birthday, pfp, about_me, true);
    if (validationResult[0] === false) {
        return res.status(400).json({ message: validationResult[1] });
    }

    try {
        // Update the profile
        const [result] = await connection.query(
            'UPDATE profiles SET username = COALESCE(?, username), birthday = COALESCE(?, birthday), pfp = COALESCE(?, pfp), about_me = COALESCE(?, about_me), updated_at = NOW() WHERE id = ?',
            [username, birthday, pfp, about_me, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        // Fetch the updated profile
        const [updatedProfile] = await connection.query('SELECT * FROM profiles WHERE id = ?', [id]);

        res.json({ message: 'Profile updated', profile: updatedProfile[0] });
    } catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).json({ 
            message: 'Error updating profile',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

router.get('/', async (req, res) => {
    const { limit, offset, name } = req.query;

    // Validate `limit` and `offset` (ensure they are positive integers if provided)
    const validationResult = validateLimitOffset(limit, offset);
    if (validationResult[0] === false) {
        return res.status(400).json({ message: validationResult[1] });
    }

    try {
        // Construct query dynamically based on `limit`, `offset`, and `name`
        let query = 'SELECT * FROM profiles';
        const params = [];

        // Add WHERE clause if `name` is provided
        if (name) {
            query += ' WHERE username LIKE ?';
            params.push(`%${name}%`); // Partial match with wildcards
        }

        // Add LIMIT and OFFSET clauses
        if (validationResult[1] !== null) {
            query += ' LIMIT ?';
            params.push(validationResult[1]);
        }

        if (validationResult[2] !== null) {
            query += validationResult[1] !== null ? ' OFFSET ?' : ' LIMIT 18446744073709551615 OFFSET ?'; // Handle MySQL's "LIMIT only with OFFSET" case
            params.push(validationResult[2]);
        }

        // Execute the query
        const [profiles] = await connection.query(query, params);

        // Return the results
        res.json(profiles);
    } catch (err) {
        console.error('Error fetching profiles:', err);
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

router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await connection.query('DELETE FROM profiles WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Profile not found' });
        }
        res.json({ message: 'Profile deleted with ID:' + id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error deleting profile' });
    }
});

export default router;
