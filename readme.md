## Todo App (No Build Tools)

This small Todo app uses modular ES5-style classes, jQuery, and Bootstrap.

I chose to avoid build tools and use ES5-style classes to keep the project simple, modular, scalable, and runnable directly from the file system. The brief provided a static HTML skeleton and emphasised CDNs, so this approach ensures ease of testing and readability without requiring a local server or build step.
If desired, I’m happy to provide a version using ES6 modules and modern build tools (or React, if preferred).

The app’s structure includes:

- TodoApp – main controller

- Pagination – pagination UI and state

- TodoSort – sorting logic

- TodoFilter – search logic

- Utilities – debounce helper

Future improvements:

- Migrating to ES6 modules with a lightweight dev server (Vite/Webpack)
- Code-splitting
- Adding query parameter syncing (e.g., ?search=foo&page=2)
- Runtime validation using Zod
- More advanced search filter using .localeCompare to catch edge cases
- Memoization of pre-fetched todos so can pre-cache converting titles to lowercase (premature optimisation for this list)