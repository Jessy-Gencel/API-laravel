import express from 'express';
import connection from '../DB/connection.js'; // Update path based on where your DB connection is
import { enemyCoreValidation,rangedEnemyValidation,healerEnemyValidation,barrierEnemyValidation,cloakEnemyValidation,spawnerEnemyValidation,enemyUndefinedValidation } from '../services/table_validation.js';
import { validateCloakMechanismValid} from '../utils/verification.js';

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

router.get('/category/:enemyCategory', async (req, res) => {
    const { enemyCategory } = req.params;
    let query = '';
    let params = [];

    switch (enemyCategory) {
        case 'ranged':
            query = `
                SELECT * FROM enemies 
                WHERE projectile_sprite IS NOT NULL
                AND projectile_sound IS NOT NULL
                AND projectile_speed IS NOT NULL
                AND range IS NOT NULL
                AND fire_rate IS NOT NULL
            `;
            break;
        case 'healer':
            query = `
                SELECT * FROM enemies 
                WHERE heal_amount IS NOT NULL
                AND heal_rate IS NOT NULL
                AND heal_range IS NOT NULL
            `;
            break;
        case 'barrier':
            query = `
                SELECT * FROM enemies 
                WHERE barrier_health IS NOT NULL
                AND barrier_cooldown IS NOT NULL
                AND barrier_regen IS NOT NULL
                AND barrier_regen_cooldown IS NOT NULL
                AND barrier_radius IS NOT NULL
            `;
            break;
        case 'cloak':
            query = `
                SELECT * FROM enemies 
                WHERE cloak_duration IS NOT NULL
                AND cloak_radius IS NOT NULL
                AND cloak_cooldown IS NOT NULL
                AND (timer_based IS NOT NULL OR proximity_based IS NOT NULL)
            `;
            break;
        case 'spawner':
            query = `
                SELECT * FROM enemies 
                WHERE spawn_rate IS NOT NULL
            `;
            break;
        default:
            return res.status(400).json({ message: 'Invalid enemy type' });
    }

    try {
        const [results] = await connection.query(query, params);
        if (results.length === 0) {
            return res.status(404).json({ message: 'No enemies found for the specified type' });
        }
        return res.status(200).json(results);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'An error occurred while fetching enemies' });
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
    const coreValidation = enemyCoreValidation(name, health, speed, damage, score, attack_speed, sprite,false);
    const rangedValidation = rangedEnemyValidation(projectile_sprite, projectile_sound, projectile_speed, range, fire_rate,false);
    const healerValidation = healerEnemyValidation(heal_amount, heal_rate, heal_range,false);
    const barrierValidation = barrierEnemyValidation(barrier_health, barrier_cooldown, barrier_regen, barrier_regen_cooldown, barrier_radius,false);
    const cloakValidation = cloakEnemyValidation(cloak_duration, cloak_radius, cloak_cooldown,timer_based, proximity_based,false);
    const spawnerValidation = spawnerEnemyValidation(spawn_rate,false);
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
    const { id } = req.params;
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

    const [[existingEnemy]] = await connection.query('SELECT * FROM enemies WHERE id = ?', [id]);
    if (existingEnemy.length === 0) {
        return res.status(404).json({ message: 'Enemy not found' });
    }
    const individualFieldUpdatePermission = enemyUndefinedValidation(existingEnemy);
    console.log(individualFieldUpdatePermission);
    //VALIDATION
    if (validateCloakMechanismValid(existingEnemy["timer_based"], existingEnemy["proximity_based"], timer_based, proximity_based) === false) {
        return res.status(400).json({ message: 'Invalid cloak mechanism, the intended update would result in the cloaked enemy to not function due to both proximity and timer based cloaking being turned off' });
    }
    const coreValidation = enemyCoreValidation(name, health, speed, damage, score, attack_speed, sprite,true);
    const rangedValidation = rangedEnemyValidation(projectile_sprite, projectile_sound, projectile_speed, range, fire_rate,true,individualFieldUpdatePermission[0]);
    const healerValidation = healerEnemyValidation(heal_amount, heal_rate, heal_range,true,individualFieldUpdatePermission[1]);
    const barrierValidation = barrierEnemyValidation(barrier_health, barrier_cooldown, barrier_regen, barrier_regen_cooldown, barrier_radius,true,individualFieldUpdatePermission[2]);
    const cloakValidation = cloakEnemyValidation(cloak_duration, cloak_radius, cloak_cooldown,timer_based, proximity_based,true,individualFieldUpdatePermission[3]);
    const spawnerValidation = spawnerEnemyValidation(spawn_rate,true,individualFieldUpdatePermission[4]);

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

    // Construct the update query
    try {
        const query = `
            UPDATE enemies
            SET
                type = COALESCE(?, type),
                name = COALESCE(?, name),
                health = COALESCE(?, health),
                speed = COALESCE(?, speed),
                damage = COALESCE(?, damage),
                score = COALESCE(?, score),
                attack_speed = COALESCE(?, attack_speed),
                sprite = COALESCE(?, sprite),
                sound = COALESCE(?, sound),
                projectile_sprite = COALESCE(?, projectile_sprite),
                projectile_sound = COALESCE(?, projectile_sound),
                projectile_speed = COALESCE(?, projectile_speed),
                \`range\` = COALESCE(?, \`range\`),
                fire_rate = COALESCE(?, fire_rate),
                heal_amount = COALESCE(?, heal_amount),
                heal_rate = COALESCE(?, heal_rate),
                heal_range = COALESCE(?, heal_range),
                barrier_health = COALESCE(?, barrier_health),
                barrier_cooldown = COALESCE(?, barrier_cooldown),
                barrier_regen = COALESCE(?, barrier_regen),
                barrier_regen_cooldown = COALESCE(?, barrier_regen_cooldown),
                barrier_radius = COALESCE(?, barrier_radius),
                spawn_rate = COALESCE(?, spawn_rate),
                cloak_duration = COALESCE(?, cloak_duration),
                cloak_radius = COALESCE(?, cloak_radius),
                cloak_cooldown = COALESCE(?, cloak_cooldown),
                timer_based = COALESCE(?, timer_based),
                proximity_based = COALESCE(?, proximity_based),
                updated_at = NOW()
            WHERE id = ?
        `;

        const values = [
            type, name, health, speed, damage, score, attack_speed, sprite, sound,
            projectile_sprite, projectile_sound, projectile_speed, range, fire_rate,
            heal_amount, heal_rate, heal_range, barrier_health, barrier_cooldown,
            barrier_regen, barrier_regen_cooldown, barrier_radius, spawn_rate, cloak_duration,
            cloak_radius, cloak_cooldown, timer_based, proximity_based, id
        ];

        await connection.query(query, values);
        res.status(200).json({ message: 'Enemy updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating enemy' });
    }


})




export default router;