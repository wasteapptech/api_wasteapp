const bcrypt = require('bcrypt');
const saltRounds = 10; 

module.exports = {
    /**
     * Hash a plain text password
     * @param {string} password - The plain text password
     * @returns {Promise<string>} - The hashed password
     */
    hashPassword: async (password) => {
        return await bcrypt.hash(password, saltRounds);
    },

    /**
     * Compare a plain text password with a hashed password
     * @param {string} password - The plain text password
     * @param {string} hashedPassword - The hashed password from database
     * @returns {Promise<boolean>} - True if passwords match
     */
    comparePassword: async (password, hashedPassword) => {
        return await bcrypt.compare(password, hashedPassword);
    },

    /**
     * Middleware to validate password strength
     * @param {string} password 
     * @returns {boolean} - True if password meets requirements
     */
    validatePasswordStrength: (password) => {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        return password.length >= minLength &&
            hasUpperCase &&
            hasLowerCase &&
            hasNumbers &&
            hasSpecialChars;
    }
};