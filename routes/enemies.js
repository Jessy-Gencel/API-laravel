import express from 'express';
import connection from '../DB/connection.js'; // Update path based on where your DB connection is
import { enemyCoreValidation,rangedEnemyValidation,healerEnemyValidation,barrierEnemyValidation,cloakEnemyValidation,spawnerEnemyValidation } from '../services/table_validation.js';
import { validateLimitOffset,isString } from '../utils/verification.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const [enemies] = await connection.query('SELECT * FROM enemies');
        res.json(enemies);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching enemies' });
    }
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await connection.query('SELECT * FROM enemies WHERE id = ?', [id]);
        if (result.length === 0) {
            return res.status(404).json({ message: 'Enemy not found' });
        }
        res.json(result[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching enemy' });
    }
});
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const [result] = await connection.query('DELETE FROM enemies WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Enemy not found' });
        }
        
        res.json({ message: 'Enemy deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error deleting enemy' });
    }
});
router.post('/', async (req, res) => {
    const {
        type,
        name,
        health,
        speed,
        damage,
        score,
        attack_speed,
        sprite,
        sound,
        projectile_sprite,
        projectile_sound,
        projectile_speed,
        range,
        fire_rate,
        heal_amount,
        heal_rate,
        heal_range,
        barrier_health,
        barrier_cooldown,
        barrier_regen,
        barrier_regen_cooldown,
        barrier_radius,
        spawn_rate,
        cloak_duration,
        cloak_radius,
        cloak_cooldown,
        timer_based,
        proximity_based,
    } = req.body;

    //VALIDATION
    const coreValidation = enemyCoreValidation(name, health, speed, damage, score, attack_speed, sprite);
    const rangedValidation = rangedEnemyValidation(projectile_sprite, projectile_sound, projectile_speed, range, fire_rate);
    const healerValidation = healerEnemyValidation(heal_amount, heal_rate, heal_range);
    const barrierValidation = barrierEnemyValidation(barrier_health, barrier_cooldown, barrier_regen, barrier_regen_cooldown, barrier_radius);
    const cloakValidation = cloakEnemyValidation(cloak_duration, cloak_radius, cloak_cooldown,timer_based, proximity_based);
    const spawnerValidation = spawnerEnemyValidation(spawn_rate);
    if (coreValidation[0] === false) {
        return res.status(400).json({ message: coreValidation[1] });
    }
    if (rangedValidation[0] === false) {
        return res.status(400).json({ message: rangedValidation[1] });
    }
    if (healerValidation[0] === false) {
        return res.status(400).json({ message: healerValidation[1] });
    }
    if (barrierValidation[0] === false) {
        return res.status(400).json({ message: barrierValidation[1] });
    }
    if (cloakValidation[0] === false) {
        return res.status(400).json({ message: cloakValidation[1] });
    }
    if (spawnerValidation[0] === false) {
        return res.status(400).json({ message: spawnerValidation[1] });
    }
    

    try {
        const [existingEnemy] = await connection.query('SELECT name FROM enemies WHERE name = ?', [name]);
        if (existingEnemy.length) {
            return res.status(400).json({ message: 'An enemy with this name already exists' });
        }
        // Insert the enemy data into the database
        const query = `
            INSERT INTO enemies 
            (type, name, health, speed, damage, score, attack_speed, sprite, sound, 
            projectile_sprite, projectile_sound, projectile_speed, \`range\`, fire_rate, 
            heal_amount, heal_rate, heal_range, barrier_health, barrier_cooldown, 
            barrier_regen, barrier_regen_cooldown, barrier_radius, spawn_rate, cloak_duration, 
            cloak_radius, cloak_cooldown, timer_based, proximity_based, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;
        
        await connection.query(query, [
            type, name, health, speed, damage, score, attack_speed, sprite, sound, 
            projectile_sprite, projectile_sound, projectile_speed, range, fire_rate, 
            heal_amount, heal_rate, heal_range, barrier_health, barrier_cooldown, 
            barrier_regen, barrier_regen_cooldown, barrier_radius, spawn_rate, cloak_duration, 
            cloak_radius, cloak_cooldown, timer_based, proximity_based
        ]);

        res.status(201).json({ message: 'Enemy created successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creating enemy' });
    }
});

router.put('/:id', async (req, res) => {
    
})




export default router;