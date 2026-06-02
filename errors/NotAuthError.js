class NotAuthError extends Error {
    constructor(message) {
        super(message);
        this.name = "NotAuthError"
    }
}

export { NotAuthError }