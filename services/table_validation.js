import express from 'express';
import connection from '../DB/connection.js'; // Update path based on where your DB connection is
import { validateEmail, validatePassword,isBoolean,isString,isDate,filter,validateImage,validate_sound,
validateBarrierFieldsUndefined,validateCloakFieldsUndefined,validateHealerFieldsUndefined,validateRangedFieldsUndefined,
validateSpawnerFieldsUndefined} from '../utils/verification.js';
import bcrypt from 'bcrypt';

const userValidation = (email,password,is_admin,blacklisted,is_update) => {
    if (!is_update){
        if (!email || !password) {
            return [false,'Email and password are required'];
        }
    }

    if (!is_update || email) {
        if (!validateEmail(email)) {
            return [false,'Invalid email format'];
        }
    }
    if (!is_update || password) {
        if (!validatePassword(password)) {
            return [false,'Password must be at least 8 characters long and include an uppercase letter, a number, and a special character'];
        }
    }
    if (!is_update || is_admin) {
        if (!isBoolean(is_admin)) {
            return [false,'is_admin must be a boolean'];
        }
    }
    if (!is_update || blacklisted) {
        if (!isBoolean(blacklisted)) {
            return [false,'blacklisted must be a boolean'];
        }
    }
    return [true];
}

const profileValidation = (username,birthday,pfp,about_me,is_update) => {
    if (!is_update){
        if (!username || !birthday || !pfp || !about_me) {
            return [false,'username,birthday,pfp and about me are required'];
        }
    }
    if(!is_update || username){
        if (!isString(username)) {
            return [false,'username must be a valid string'];
        }
    }
    if (!is_update || birthday) {
        if (!isDate(birthday)) {
            return [false,'birthday must be a valid date'];
        }
    }
    if (!is_update || pfp) {
        if (!validateImage(pfp)){
            return [false,'pfp must be a valid image reference'];
        }
    }
    if (!is_update || about_me) {
        if (!isString(about_me)) {
            return [false,'about_me must be a valid string'];
        }
        if (filter.isProfane(about_me)) {
            return [false,'about_me contains inappropriate language'];
        }
    }
    return [true];
}
const enemyCoreValidation = (name, health, speed, damage, score, attack_speed,sprite,is_update)=> {
    if (!is_update){
        if (!name || !health || !speed || !damage || !score || !attack_speed || !sprite) {
            return [false,'Missing required fields'] ;
        }
    }
    if (!is_update) {
        if (typeof health !== 'number' || typeof speed !== 'number' || typeof damage !== 'number' || typeof score !== 'number' || typeof attack_speed !== 'number') {
            return [false,'Health, speed, and damage must be numbers'];
        }
    }
    if (is_update){
        if (health && typeof health !== 'number'){
            return [false,'health must be a number'];
        }
        if (speed && typeof speed !== 'number'){
            return [false,'speed must be a number'];
        }
        if (damage && typeof damage !== 'number'){
            return [false,'damage must be a number'];
        }
        if (score && typeof score !== 'number'){
            return [false,'score must be a number'];
        }
        if (attack_speed && typeof attack_speed !== 'number'){
            return [false,'attack_speed must be a number'];
        }
    }
    if (!is_update || name) {
        if (!isString(name)) {
            return [false,'name must be a valid string'];
        }
    }
    if (!is_update || attack_speed) {
        if (attack_speed < 0 || attack_speed > 10){
            return [false,'attack_speed must be between 0 and 10'];
        }
    }
    if (!is_update || speed) {
        if (speed < 0 || speed > 10){
            return [false,'speed must be between 0 and 10'];
        }
    }
    if (!is_update || score) {
        if (score < 0){
            return [false,'score must be a positive number'];
        }
    }
    if (!is_update || health) {
        if (health < 0){
            return [false,'health must be a positive number'];
        }
    }
    if (!is_update || damage) {
        if (damage < 0){
            return [false,'damage must be a positive number'];
        }	
    }
    if (!is_update || sprite) {
        if (!validateImage(sprite)){
            return [false,'sprite must be a valid image reference'];
        }
    }
    return [true];
}
const rangedEnemyValidation = (projectile_sprite,projectile_sound,projectile_speed,range,fire_rate,is_update,allow_individual_updates = false) => {
    if (!projectile_sprite && !projectile_sound && !projectile_speed && !range && !fire_rate){ 
        return [true];
    }else{
        if (!is_update || !allow_individual_updates){
            if (!projectile_sprite || !projectile_sound || !projectile_speed || !range || !fire_rate) {
                return [false,'For ranged enemies the following fields must have a value after creation or update operations: projectile_sprite,projectile_sound,projectile_speed,range and fire_rate'];
            }
        }
    }
    if (!is_update) {
        if (typeof projectile_speed !== 'number' || typeof range !== 'number' || typeof fire_rate !== 'number') {
            return [false,'projectile_speed, range, and fire_rate must be numbers'];
        }
    }
    if (is_update){
        if (projectile_speed && typeof projectile_speed !== 'number'){
            return [false,'projectile_speed must be a number'];
        }
        if (range && typeof range !== 'number'){
            return [false,'range must be a number'];
        }
        if (fire_rate && typeof fire_rate !== 'number'){
            return [false,'fire_rate must be a number'];
        }
    }
    if (!is_update || projectile_sprite) {
        if (!validateImage(projectile_sprite)){
            return [false,'projectile_sprite must be a valid image reference'];
        }
    }
    if (!is_update || projectile_sound) {
        if (!validate_sound(projectile_sound)){
            return [false,'projectile_sound must be a valid sound reference'];
        }
    }
    if (!is_update || projectile_speed) {
        if (projectile_speed < 0 || projectile_speed > 10){
            return [false,'projectile_speed must be between 0 and 10'];
        }
    }
    if (!is_update || range) {
        if (range < 0 || range > 1920){
            return [false,'range must be a positive number and smaller then 1920'];
        }
    }
    if (!is_update || fire_rate) {
        if (fire_rate < 0 || fire_rate > 10){
            return [false,'fire_rate must be between 0 and 10'];
        }
    }
    return [true];
}
const healerEnemyValidation = (heal_amount, heal_rate, heal_range, is_update,allow_individual_updates = false) => {
    if (!heal_amount && !heal_rate && !heal_range) {
        return [true];
    } else {
        if (!is_update || !allow_individual_updates) {
            if (!heal_amount || !heal_rate || !heal_range) {
                return [false, 'For healer enemies the following fields must have a value after creation or update operations: heal_amount, heal_rate, and heal_range must all be provided'];
            }
        }
    }
    if (!is_update) {
        if (typeof heal_amount !== 'number' || typeof heal_rate !== 'number' || typeof heal_range !== 'number') {
            return [false, 'heal_amount, heal_rate, and heal_range must be numbers'];
        }
    }
    if (is_update){
        if (heal_amount && typeof heal_amount !== 'number'){
            return [false,'heal_amount must be a number'];
        }
        if (heal_rate && typeof heal_rate !== 'number'){
            return [false,'heal_rate must be a number'];
        }
        if (heal_range && typeof heal_range !== 'number'){
            return [false,'heal_range must be a number'];
        }
    }
    if (!is_update || heal_amount) {
        if (heal_amount <= 0 || heal_amount > 100) {
            return [false, 'heal_amount must be a positive number and less than or equal to 100'];
        }
    }
    if (!is_update || heal_rate) {
        if (heal_rate <= 0 || heal_rate > 10000) {
            return [false, 'heal_rate must be a positive number and less than or equal to 10000'];
        }
    }
    if (!is_update || heal_range) {
        if (heal_range <= 0 || heal_range > 1000) {
            return [false, 'heal_range must be a positive number and less than or equal to 1000'];
        }
    }
    return [true];
};
const spawnerEnemyValidation = (spawn_rate,is_update) => {
    if (!spawn_rate) {
        return [true];
    }
    if (typeof spawn_rate !== 'number') {
        return [false, 'spawn_rate must be a number'];
    }
    if (spawn_rate <= 0 || spawn_rate > 10) {
        return [false, 'spawn_rate must be a positive number and less than or equal to 10'];
    }
    return [true];
};
const barrierEnemyValidation = (barrier_health, barrier_cooldown, barrier_regen, barrier_regen_cooldown, barrier_radius,is_update,allow_individual_updates = false) => {
    if (!barrier_health && !barrier_cooldown && !barrier_regen && !barrier_regen_cooldown && !barrier_radius) {
        return [true];
    } else {
        if (!is_update || !allow_individual_updates) {
            if (!barrier_health || !barrier_cooldown || !barrier_regen || !barrier_regen_cooldown || !barrier_radius) {
                return [false, 'For barrier enemies the following fields must have a value after creation or update operations: barrier_health, barrier_cooldown, barrier_regen, barrier_regen_cooldown, and barrier_radius must all be provided'];
            }
        }
    }
    if (!is_update) {
        if (
            typeof barrier_health !== 'number' ||
            typeof barrier_cooldown !== 'number' ||
            typeof barrier_regen !== 'number' ||
            typeof barrier_regen_cooldown !== 'number' ||
            typeof barrier_radius !== 'number'
        ) {
            return [false, 'barrier_health, barrier_cooldown, barrier_regen, barrier_regen_cooldown, and barrier_radius must be numbers'];
        }
    }
    if (is_update){
        if (barrier_health && typeof barrier_health !== 'number'){
            return [false,'barrier_health must be a number'];
        }
        if (barrier_cooldown && typeof barrier_cooldown !== 'number'){
            return [false,'barrier_cooldown must be a number'];
        }
        if (barrier_regen && typeof barrier_regen !== 'number'){
            return [false,'barrier_regen must be a number'];
        }
        if (barrier_regen_cooldown && typeof barrier_regen_cooldown !== 'number'){
            return [false,'barrier_regen_cooldown must be a number'];
        }
        if (barrier_radius && typeof barrier_radius !== 'number'){
            return [false,'barrier_radius must be a number'];
        }
    }
    if (barrier_health <= 0 || barrier_health > 10000) {
        return [false, 'barrier_health must be a positive number and less than or equal to 10000 hitpoints'];
    }
    if (barrier_cooldown <= 0 || barrier_cooldown > 60) {
        return [false, 'barrier_cooldown must be a positive number and less than or equal to 60 seconds'];
    }
    if (barrier_regen <= 0 || barrier_regen > 2500) {
        return [false, 'barrier_regen must be a positive number and less than or equal to 2500 hitpoints per regen cycle'];
    }
    if (barrier_regen_cooldown <= 0 || barrier_regen_cooldown > 300) {
        return [false, 'barrier_regen_cooldown must be a positive number and less than or equal to 300 seconds'];
    }
    if (barrier_radius <= 0 || barrier_radius > 1920) {
        return [false, 'barrier_radius must be a positive number and less than or equal to 1920 pixels'];
    }
    return [true];
};
const cloakEnemyValidation = (cloak_duration, cloak_radius, cloak_cooldown, timer_based, proximity_based,is_update,allow_individual_updates = false) => {
    if (!cloak_duration && !cloak_radius && !cloak_cooldown && !timer_based && !proximity_based) {
        return [true];
    } else {
        if (!is_update || !allow_individual_updates) {
            if (!cloak_duration || !cloak_radius || !cloak_cooldown || (timer_based === undefined && proximity_based === undefined)) {
                return [false, 'For cloak enemies the following fields must have a value after creation or update operations: cloak_duration, cloak_radius, cloak_cooldown must all be provided, and either timer_based or proximity_based must be set to true'];
            }
        }
    }
    if (!is_update) {
        if (typeof cloak_duration !== 'number' || typeof cloak_radius !== 'number' || typeof cloak_cooldown !== 'number') {
            return [false, 'cloak_duration, cloak_radius, and cloak_cooldown must be numbers'];
        }
    }
    if (is_update){
        if (cloak_duration && typeof cloak_duration !== 'number'){
            return [false,'cloak_duration must be a number'];
        }
        if (cloak_radius && typeof cloak_radius !== 'number'){
            return [false,'cloak_radius must be a number'];
        }
        if (cloak_cooldown && typeof cloak_cooldown !== 'number'){
            return [false,'cloak_cooldown must be a number'];
        }
    }
    if(!is_update || cloak_duration){
        if (cloak_duration <= 0 || cloak_duration > 30) {
            return [false, 'cloak_duration must be a positive number and less than or equal to 30'];
        }
    }
    if(!is_update || cloak_radius){
        if (cloak_radius <= 0 || cloak_radius > 1920) {
            return [false, 'cloak_radius must be a positive number and less than or equal to 1920'];
        }
    }
    if(!is_update || cloak_cooldown){
        if (cloak_cooldown <= 0 || cloak_cooldown > 60) {
            return [false, 'cloak_cooldown must be a positive number and less than or equal to 60'];
        }
    }
    if (!is_update || timer_based || proximity_based) {
        if (typeof timer_based !== 'boolean' && typeof proximity_based !== 'boolean') {
            return [false, 'timer_based and proximity_based must be boolean values when provided'];
        }
        if (!timer_based && !proximity_based) {
            return [false, 'At least one of timer_based or proximity_based must be true'];
        }
    }

    return [true];
};
const enemyUndefinedValidation = (existingEnemy) => {
    let allowedUpdates = [];
    if (validateRangedFieldsUndefined([existingEnemy["projectile_sprite"], existingEnemy["projectile_sound"], existingEnemy["projectile_speed"], existingEnemy["range"], existingEnemy["fire_rate"]])) {
        allowedUpdates.push(false);
    }else {
        allowedUpdates.push(true);
    }
    if (validateHealerFieldsUndefined([existingEnemy["heal_amount"], existingEnemy["heal_rate"], existingEnemy["heal_range"]])) {
        allowedUpdates.push(false);
    }else {
        allowedUpdates.push(true);
    }
    if (validateBarrierFieldsUndefined([existingEnemy["barrier_health"], existingEnemy["barrier_cooldown"], existingEnemy["barrier_regen"], existingEnemy["barrier_regen_cooldown"], existingEnemy["barrier_radius"]])) {
        allowedUpdates.push(false);
    } else {
        allowedUpdates.push(true);
    }
    if (validateCloakFieldsUndefined([existingEnemy["cloak_duration"], existingEnemy["cloak_radius"], existingEnemy["cloak_cooldown"]])) {
        allowedUpdates.push(false);
    }else {
        allowedUpdates.push(true);
    }
    if (validateSpawnerFieldsUndefined([existingEnemy["spawn_rate"]])) {
        allowedUpdates.push(false);
    }else {
        allowedUpdates.push(true);
    }
    return allowedUpdates;
}




export {userValidation,profileValidation,enemyCoreValidation,rangedEnemyValidation,healerEnemyValidation,
    spawnerEnemyValidation,barrierEnemyValidation,cloakEnemyValidation,enemyUndefinedValidation};