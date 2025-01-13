import express from 'express';
import connection from '../DB/connection.js'; // Update path based on where your DB connection is
import { validateEmail, validatePassword,isBoolean,isString,isDate,filter,validateImage,validate_sound} from '../utils/verification.js';
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

const profileValidation = (user_id,username,birthday,pfp,about_me,is_update) => {
    if (!is_update){
        if (!user_id || !username || !birthday || !pfp || !about_me) {
            return [false,'user_id, username, and birthday are required'];
        }
    }
    if (!is_update || user_id) {
        if (!Number.isInteger(user_id)) {
            return [false,'user_id must be a valid integer'];
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
const enemyCoreValidation = (name, health, speed, damage, score, attack_speed,sprite)=> {
    if (!name || !health || !speed || !damage || !score || !attack_speed || !sprite) {
        return [false,'Missing required fields'] ;
    }
    if (typeof health !== 'number' || typeof speed !== 'number' || typeof damage !== 'number') {
        return [false,'Health, speed, and damage must be numbers'];
    }
    if (!isString(name)) {
        return [false,'name must be a valid string'];
    }
    if (attack_speed < 0 || attack_speed > 10){
        return [false,'attack_speed must be between 0 and 10'];
    }
    if (speed < 0 || speed > 10){
        return [false,'speed must be between 0 and 10'];
    }
    if (score < 0){
        return [false,'score must be a positive number'];
    }
    if (health < 0){
        return [false,'health must be a positive number'];
    }
    if (damage < 0){
        return [false,'damage must be a positive number'];
    }	
    if (!validateImage(sprite)){
        return [false,'sprite must be a valid image reference'];
    }
    return [true];
}
const rangedEnemyValidation = (projectile_sprite,projectile_sound,projectile_speed,range,fire_rate) => {
    if (!projectile_sprite && !projectile_sound && !projectile_speed && !range && !fire_rate){ 
        return [true];
    }else{
        if (!projectile_sprite || !projectile_sound || !projectile_speed || !range || !fire_rate) {
            return [false,'For ranged enemies, projectile_sprite,projectile_sound,projectile_speed,range and fire_rate must all be provided'];
        }
    }
    if (!validateImage(projectile_sprite)){
        return [false,'projectile_sprite must be a valid image reference'];
    }
    if (!validate_sound(projectile_sound)){
        return [false,'projectile_sound must be a valid sound reference'];
    }
    if (typeof projectile_speed !== 'number' || typeof range !== 'number' || typeof fire_rate !== 'number') {
        return [false,'projectile_speed, range, and fire_rate must be numbers'];
    }
    if (projectile_speed < 0 || projectile_speed > 10){
        return [false,'projectile_speed must be between 0 and 10'];
    }
    if (range < 0 || range > 1920){
        return [false,'range must be a positive number and smaller then 1920'];
    }
    if (fire_rate < 0 || fire_rate > 10){
        return [false,'fire_rate must be between 0 and 10'];
    }
    return [true];
}
const healerEnemyValidation = (heal_amount, heal_rate, heal_range) => {
    if (!heal_amount && !heal_rate && !heal_range) {
        return [true];
    } else {
        if (!heal_amount || !heal_rate || !heal_range) {
            return [false, 'For healer enemies, heal_amount, heal_rate, and heal_range must all be provided'];
        }
    }
    if (typeof heal_amount !== 'number' || typeof heal_rate !== 'number' || typeof heal_range !== 'number') {
        return [false, 'heal_amount, heal_rate, and heal_range must be numbers'];
    }
    if (heal_amount <= 0 || heal_amount > 100) {
        return [false, 'heal_amount must be a positive number and less than or equal to 100'];
    }
    if (heal_rate <= 0 || heal_rate > 10000) {
        return [false, 'heal_rate must be a positive number and less than or equal to 10000'];
    }
    if (heal_range <= 0 || heal_range > 1000) {
        return [false, 'heal_range must be a positive number and less than or equal to 1000'];
    }
    return [true];
};
const spawnerEnemyValidation = (spawn_rate) => {
    if (!spawn_rate) {
        return [true];
    } else {
        if (typeof spawn_rate !== 'number') {
            return [false, 'spawn_rate must be a number'];
        }
        if (spawn_rate <= 0 || spawn_rate > 10) {
            return [false, 'spawn_rate must be a positive number and less than or equal to 10'];
        }
    }
    return [true];
};
const barrierEnemyValidation = (barrier_health, barrier_cooldown, barrier_regen, barrier_regen_cooldown, barrier_radius) => {
    if (!barrier_health && !barrier_cooldown && !barrier_regen && !barrier_regen_cooldown && !barrier_radius) {
        return [true];
    } else {
        if (!barrier_health || !barrier_cooldown || !barrier_regen || !barrier_regen_cooldown || !barrier_radius) {
            return [false, 'For barrier enemies, all barrier-related fields must be provided'];
        }
    }
    if (
        typeof barrier_health !== 'number' ||
        typeof barrier_cooldown !== 'number' ||
        typeof barrier_regen !== 'number' ||
        typeof barrier_regen_cooldown !== 'number' ||
        typeof barrier_radius !== 'number'
    ) {
        return [false, 'barrier_health, barrier_cooldown, barrier_regen, barrier_regen_cooldown, and barrier_radius must be numbers'];
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
const cloakEnemyValidation = (cloak_duration, cloak_radius, cloak_cooldown, timer_based, proximity_based) => {
    if (!cloak_duration && !cloak_radius && !cloak_cooldown && timer_based === undefined && proximity_based === undefined) {
        console.log("This runs for some reason");
        return [true];
    } else {
        console.log(cloak_duration, cloak_radius, cloak_cooldown, timer_based, proximity_based);
        if (!cloak_duration || !cloak_radius || !cloak_cooldown || (timer_based === undefined && proximity_based === undefined)) {
            return [false, 'For cloak enemies, cloak_duration, cloak_radius, cloak_cooldown must all be provided, and either timer_based or proximity_based must be true'];
        }
    }
    if (typeof cloak_duration !== 'number' || typeof cloak_radius !== 'number' || typeof cloak_cooldown !== 'number') {
        return [false, 'cloak_duration, cloak_radius, and cloak_cooldown must be numbers'];
    }
    if (cloak_duration <= 0 || cloak_duration > 30) {
        return [false, 'cloak_duration must be a positive number and less than or equal to 30'];
    }
    if (cloak_radius <= 0 || cloak_radius > 1920) {
        return [false, 'cloak_radius must be a positive number and less than or equal to 1920'];
    }
    if (cloak_cooldown <= 0 || cloak_cooldown > 60) {
        return [false, 'cloak_cooldown must be a positive number and less than or equal to 60'];
    }

    if (typeof timer_based !== 'boolean' && typeof proximity_based !== 'boolean') {
        return [false, 'timer_based and proximity_based must be boolean values when provided'];
    }

    if (!timer_based && !proximity_based) {
        return [false, 'At least one of timer_based or proximity_based must be true'];
    }

    return [true];
};




export {userValidation,profileValidation,enemyCoreValidation,rangedEnemyValidation,healerEnemyValidation,spawnerEnemyValidation,barrierEnemyValidation,cloakEnemyValidation};