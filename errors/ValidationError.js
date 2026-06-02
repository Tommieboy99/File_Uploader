class ValidationError extends Error {
    constructor(errors) {
        super('Validation failed');
        this.status = 400;
        this.errors = errors;
    }
}

export { ValidationError };