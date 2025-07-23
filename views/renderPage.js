const fs = require('fs');
const path = require('path');

const layoutTemplate = fs.readFileSync(path.join(__dirname, 'layout.html'), 'utf8');

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

module.exports = function renderPage(content, user) {
    const isLoggedIn = !!user;
    const authLinks = isLoggedIn
        ? `Welcome, ${escapeHtml(user.displayName)} | <a href="/vitals/logout">Log out</a>`
        : `<a href="/vitals/auth/google">Log in with Google</a>`;

    return layoutTemplate
        .replace('{{authLinks}}', authLinks)
        .replace('{{content}}', content);
};

