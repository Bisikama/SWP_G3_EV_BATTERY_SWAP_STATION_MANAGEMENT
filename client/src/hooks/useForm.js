//Form validation  hook


import { useState } from 'react';

export const useForm = (initialValues = {}, validationRules = {}) => {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    const validate = (fieldName, value) => {
        const rules = validationRules[fieldName];
        if (!rules) return '';

        for (const rule of rules) {
            const error = rule(value);
            if (error) return error;
        }
        return '';
    };

    const handleChange = (fieldName, value) => {
        setValues(prev => ({
            ...prev,
            [fieldName]: value
        }));

        // Clear error when user starts typing
        if (errors[fieldName]) {
            setErrors(prev => ({
                ...prev,
                [fieldName]: ''
            }));
        }
    };

    const handleBlur = (fieldName) => {
        setTouched(prev => ({
            ...prev,
            [fieldName]: true
        }));

        const error = validate(fieldName, values[fieldName]);
        setErrors(prev => ({
            ...prev,
            [fieldName]: error
        }));
    };

    const validateAll = () => {
        const newErrors = {};
        let isValid = true;

        Object.keys(validationRules).forEach(fieldName => {
            const error = validate(fieldName, values[fieldName]);
            if (error) {
                newErrors[fieldName] = error;
                isValid = false;
            }
        });

        setErrors(newErrors);
        setTouched(Object.keys(validationRules).reduce((acc, key) => {
            acc[key] = true;
            return acc;
        }, {}));

        return isValid;
    };

    const reset = () => {
        setValues(initialValues);
        setErrors({});
        setTouched({});
    };

    return {
        values,
        errors,
        touched,
        handleChange,
        handleBlur,
        validateAll,
        reset,
        isValid: Object.keys(errors).length === 0,
    };
};

// Common validation rules
export const validationRules = {
    required: (value) => {
        if (!value || (typeof value === 'string' && value.trim() === '')) {
            return 'This field is required';
        }
        return '';
    },

    email: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailRegex.test(value)) {
            return 'Please enter a valid email address';
        }
        return '';
    },

    minLength: (min) => (value) => {
        if (value && value.length < min) {
            return `Must be at least ${min} characters long`;
        }
        return '';
    },

    maxLength: (max) => (value) => {
        if (value && value.length > max) {
            return `Must be no more than ${max} characters long`;
        }
        return '';
    },
};