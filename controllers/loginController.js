import passport from "passport";

export const renderLoginPage = (req, res) => {
    if (req.user) {
        return res.redirect('/');
    } else {
        res.render("login");
    }
}

export const authenticateUser = (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
        if (err) return next(err);

        if (!user) {
            req.session.flash = {
                error: "Invalid credentials"
            };

            return res.redirect("/login");
        }

        req.logIn(user, (err) => {
            if (err) return next(err);

            return res.redirect("/");
        });
    })(req, res, next);
}