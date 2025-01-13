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
export { validateEmail, validatePassword,isBoolean,isDate,isString,filter,validateLimitOffset,validateImage,validate_sound };