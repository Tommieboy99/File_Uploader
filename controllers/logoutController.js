export const logoutUser = (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        return res.redirect("/");
    })
}
