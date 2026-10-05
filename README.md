# SortWhy

Paste a list and see it sorted four real ways, which items move between them, and the character that decided each step.

Rules: JavaScript default `sort()` (UTF-16 code units); code point order (Python `sorted`, SQLite BINARY, C-locale `sort`); ASCII case-insensitive folded to lower (SQLite NOCASE); folded to upper (`sort -f`, C locale). Also numeric sort and the JS default number-sort quirk when every line is a number.

- `app.html` tool, `index.html` landing, `engine.js` rules and explanations (no dependencies)
- `test-engine.js` + `oracle.py` compare against Python, SQLite and GNU sort: `node test-engine.js SEED N gnu`

Tests: 60,000 random lists (6 seeds), 6 comparisons each = 360,000, 0 mismatches. 15,000 numeric lists, 0 mismatches. NOCASE ties compared by folded key (SQLite leaves tie order undefined). The utf16 check against node's Array.sort is not an independent oracle.
Not covered: locale collation (ICU, en_US), natural/version sort, normalization.
