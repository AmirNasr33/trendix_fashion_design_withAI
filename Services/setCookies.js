export function setCookie(res, name, value, options = {}) {
    const defaults = {
        maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
        httpOnly: true, // Prevent client-side JS access
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        sameSite: 'strict', // CSRF protection
        path: '/', // Accessible across all routes
    };

    // Merge user options with defaults
    const cookieOptions = { ...defaults, ...options };

    // Set the cookie
    res.cookie(name, value, cookieOptions);
}