import { Filter } from "bad-words";

const filter = new Filter();

const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    return passwordRegex.test(password);
};
const isBoolean = (value) => typeof value === 'boolean';
const isDate = (value) => !isNaN(Date.parse(value));
const isString = (value) => typeof value === 'string' && value.trim().length > 0;
const validateLimitOffset = (limit, offset) => {
    const parsedLimit = limit ? parseInt(limit, 10) : null;
    const parsedOffset = offset ? parseInt(offset, 10) : null;

    if ((limit && isNaN(parsedLimit)) || (offset && isNaN(parsedOffset))) {
        return [false,'Limit and offset must be valid integers'];
    }else{
        return [true,parsedLimit,parsedOffset];
    }
};
const validateImage = (image) => {
    if (!isString(image)) {
        return false;
    }
    const imageRegex = /^[\w,\s-]+\.(jpg|gif|png|webp)$/i;  // Case-insensitive match
    return imageRegex.test(image);
};
const validate_sound = (sound) => {
    if (!isString(sound)) {
        return false;
    }
    const soundRegex = /^[\w,\s-]+\.(mp3|wav)$/i;  // Case-insensitive match
    return soundRegex.test(sound);
};
const validateRangedFieldsUndefined = (fields) => {
    console.log(fields);
    return fields.some(field => field === null);
}
const validateHealerFieldsUndefined = (fields) => {
    return fields.some(field => field === null);
}
const validateBarrierFieldsUndefined = (fields) => {
    return fields.some(field => field === null);
}
const validateCloakFieldsUndefined = (fields) => {
    return fields.some(field => field === null);
}
const validateCloakMechanismValid = (current_timer_based, current_proximity_based, new_timer_based, new_proximity_based) => {
    if (new_timer_based === false && new_proximity_based === false) {
        return false;
    }
    if (current_timer_based && new_timer_based === false && new_proximity_based !== true && current_proximity_based !== true) {
        return false;
    }
    if (current_proximity_based && new_proximity_based === false && new_timer_based !== true && current_timer_based !== true) {
        return false;
    }
    if (current_timer_based === true || current_proximity_based === true || new_timer_based === true || new_proximity_based === true) {
        return true;
    }
    if (!current_timer_based && !current_proximity_based && !new_timer_based && !new_proximity_based) {
        return true;
    }
    
}
const validateSpawnerFieldsUndefined = (fields) => {
    return fields.some(field => field === null);
}







export { validateEmail, validatePassword,isBoolean,isDate,isString,filter,validateLimitOffset,
    validateImage,validate_sound,validateRangedFieldsUndefined,validateHealerFieldsUndefined,
    validateBarrierFieldsUndefined,validateCloakFieldsUndefined,validateSpawnerFieldsUndefined,
    validateCloakMechanismValid };