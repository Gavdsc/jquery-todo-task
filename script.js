$(document).ready(() => {
    // Just check the JQuery CDN is loading
    console.log('JQuery loaded'); 
    
    new TodoApp('https://jsonplaceholder.typicode.com/todos', 'todoList', 'search', 'todoPagination', 'warningBox')
});

/**
 * A class to manage a Todo-App table
 * @class TodoApp
 */
class TodoApp {
    todos = [];
    filteredTodos = [];
    
    // Simple states
    warningState = false;
    searchState = "";
    sortState = {
        column: 'id',
        ascending: true
    }

    /**
     * Constructor
     * @param {string} apiEndpoint
     * @param {string} tableId
     * @param {string} paginationId
     * @param {string} searchId
     * @param {string} warningId
     */
    constructor(apiEndpoint, tableId, searchId, paginationId, warningId) {
        this.apiEndpoint = apiEndpoint;

        // Select once, and save
        this.table = $(`#${tableId}`);
        this.search = $(`#${searchId}`);
        this.pagination = new Pagination($(`#${paginationId}`), this.onPageChange);
        this.warning = $(`#${warningId}`);
        
        // Clear the search on page reload
        this.search.val('');

        this.init();
    }

    /**
     * Fetch the todolist
     */
    init() {
        // This would benefit from being async so we can await the promise resolution
        this.fetchTodos();
        
        // Set bindings for search
        this.bindSearch();
        this.bindSorts();
    }

    /**
     * JQuery Ajax fetch for public api
     */
    fetchTodos() {
        // Using ajax (callback based) for brief, but would favour fetch (async/promises) here
        $.ajax({
            url: this.apiEndpoint,
            method: 'GET',
            success: (data) => {
                // On success, set the initial data
                // Note: could do runtime validation here using Zod (import via build tools), but don't want to over-engineer
                this.todos = data;
                
                // Remember to filter and sort on success (before render)
                // This will allow url params to be collected for scalability
                this.filterAndSort();
                
                // Update the pagination after we have data
                this.pagination.update(this.filteredTodos.length, 1);

                // Render the table
                this.renderTable();
            },
            error: () => {
                this.onError('Failed to fetch todos.');
            }
        })
    }

    /**
     * Render the table.
     */
    renderTable() {
        // Find the start of the list and end of the list based on the current page (adjusted -1)
        const start = (this.pagination.current - 1) * this.pagination.perPage;
        const end = start + this.pagination.perPage;
        
        // Slice the list for looping
        const paginatedTodos = this.filteredTodos.slice(start, end);
        
        // Map the rows
        const rows = paginatedTodos.map(todo => `
            <tr>
                <td>${todo.id}</td> 
                <td>${todo.title}</td>   
                <td>${todo.completed ? 'Yes' : 'No'}</td>    
            </tr>  
        `).join('');

        // Set the table html
        this.table.html(rows);
    }

    /**
     * Bind events to the search input.
     */
    bindSearch() {
        this.search.on('input', Utilities.simpleDebounce(() => {            
            // Update the search state and lowercase at point of collection for better performance
            this.searchState = this.search.val().toLowerCase();
            
            // Filter
            this.filterAndSort();

            // Reset the pagination to 1 (or we risk rendering an empty table)
            this.pagination.update(this.filteredTodos.length, 1);
            
            // Update the render
            this.renderTable();
            
            // Show a warning if no results
            if (this.filteredTodos.length === 0) {
                this.onError("No search results found.");
                return;
            }
            
            // Otherwise, remove existing warnings
            // Note: might need to re-think this if I have more errors to throw later
            if (this.warningState)
                this.onError("");

        }, 500));
    }

    /**
     * Bind events to the sort buttons.
     */
    bindSorts() {
        // Todo: create a global container to extract table stuff from... (dataTable)
        $('.todo-sort').on('click', (event) => {
            // Grab the dataset for the sort
            const column = event.currentTarget.dataset.sort;

            // Guard against no sort
            if (!column) {
                console.warn('Sort column not specified');
                return;
            }

            // Update the sort state (flip the ascending if the column matches, otherwise default to true - accessibility and mobile friendly)
            this.sortState.ascending = column === this.sortState.column ? !this.sortState.ascending : true;
            this.sortState.column = column;

            // Update the icons
            this.updateSortIcons(event.currentTarget);

            // Sort and re-render
            this.filterAndSort();
            this.renderTable();
        });
    }

    /**
     * Run filters and sort on the list.
     */
    filterAndSort() {
        // Always start fresh as we can add/remove in future (scalability)
        let todoList = [...this.todos];

        todoList = TodoFilter.filter(todoList, this.searchState);
        
        // Sort second so the list is smaller
        todoList = TodoSort.sort(todoList, this.sortState);
        
        // Update the filtered todos
        this.filteredTodos = todoList;
    }

    /**
     * Update sort icons by showing and hiding filled/unfilled carets.
     * @param {HTMLElement} target
     */
    updateSortIcons(target) {
        $('.active-asc, .active-dsc').removeClass(['active-asc', 'active-dsc']);
        target.classList.add(this.sortState.ascending ? 'active-asc' : 'active-dsc');
    }

    /**
     * Page change callback for pagination clicks.
     * Arrow function so scope is 'this' object, not the pagination.
     * @param {number} page - The page number selected by the user
     */
    onPageChange = (page) => {
        this.pagination.update(this.filteredTodos.length, page);
        this.renderTable();
    }

    /**
     * A simple visual error handler.
     * @param {string} message
     */
    onError(message) {
        if (message === '') {
            this.warningState = false;
            this.warning.empty();
            return;
        }

        // Optionally could .show().hide() here, but setting in css
        this.warningState = true;
        this.warning.text(message);
    }
}

/**
 * Unit testable static helper to run filters.
 * @class TodoFilter
 */
class TodoFilter {

    /**
     * Sort the passed list based on simple value sort.
     * @param {Array} todos
     * @param {string} term
     * @returns {Array}
     */
    static filter(todos, term) {
        if (!term)
            return todos;
        
        return todos.filter(todo => todo.title.toLowerCase().includes(term));
    }
}

/**
 * Unit testable static sort to run sorts.
 * @class TodoFilter
 */
class TodoSort {

    /**
     * Sort the passed list based on simple value sort.
     * Simple sort to save time
     * Todo: Coerce strings to numbers to safely use .localeCompare (edge cases like accents)
     * @param {Array} todos
     * @param {string} column
     * @param {boolean} ascending
     * @returns {Array}
     */
    static sort(todos, { column, ascending }) {
        return [...todos].sort((a, b) => {
            if (a[column] < b[column])
                return ascending ? -1 : 1;

            if (a[column] > b[column])
                return ascending ? 1 : -1;

            return 0;
        });
    }
}

/**
 * Class to generate pagination and hold pagination state.
 * @class Pagination
 */
class Pagination {
    
    // Simple state
    // Todo: pass these in constructor to make reusable
    current = 1;
    perPage = 10;
    todoCount = 0;
    visible = 5;
    
    /**
     * Constructor
     * @param {JQuery<HTMLElement>} container
     * @param {function} onPageChange
     * @param {number} visible
     */
    constructor(container, onPageChange, visible = 5) {
        this.container = container;
        this.onPageChange = onPageChange;
        this.visible = visible;

        this.bind();
    }

    /**
     * Set up event delegation using jQuery
     */
    bind() {
        // Use event delegation
        this.container.on('click', '.page-link', (event) => {
            event.preventDefault();

            // Coerce here too, just to be safe
            const page = +(event.currentTarget.dataset.page)

            // Prefer defensive coding
            if (isNaN(page))
                return;

            // Fire callback
            this.onPageChange(page)
        });
    }

    /**
     * Render pagination.
     * Note: Ideally break up this render function into something smaller.
     */
    render() {
        // First get the number of pages (filteredTodos, not todos)
        const pages = Math.ceil(this.todoCount / this.perPage);

        // First empty the pagination
        this.container.empty();

        // Don't draw pagination if only 1 page
        if (pages === 1)
            return;

        // Set previous and next pages 
        const previous = this.current > 1 ? this.current - 1 : 1;
        const next = this.current < pages ? this.current + 1 : pages;

        // First button
        this.addButton(1, "First", this.current === 1);

        // Previous button
        this.addButton(previous, "Previous", this.current === 1);

        // Design only renders 5
        // Render previous 2, current and next 2
        const { start, end } = this.getVisiblePagination(pages)

        // Page buttons (only 5)
        for (let i = start; i <= end; i++) {
            this.addButton(i, i);
        }

        // Next button
        this.addButton(next, "Next", this.current === pages);

        // Last button
        this.addButton(pages, "Last", this.current === pages);
    }

    /**
     * Filter for start and end based on current page.
     * @param {number} pages
     * @returns {{start: number, end: number}}
     */
    getVisiblePagination(pages) {
        // Guard against less pages than total
        if (pages <= this.visible)
            return { start: 1, end: pages }

        // First, we need half the max visible from the state
        const halfVisible = Math.floor(this.visible / 2);

        // The start is whatever is greater, 1 or the current - half the max visible (render half before the current, unless less than half visible)
        let start = Math.max(1, this.current - halfVisible);

        // Can just set the end to be the start + the max visible -1
        let end = start + this.visible - 1;

        // Adjust if end goes beyond total
        if (end > pages) {
            end = pages;
            start = Math.max(1, end - this.visible + 1);
        }

        return { start, end }
    }

    /**
     * Utility to add buttons to the pagination.
     * @param {number} page
     * @param {string} title
     * @param {boolean} disabled
     */
    addButton(page, title, disabled = false) {
        this.container.append(`
            <li class="page-item ${title == this.current ? "active" : ""} ${disabled ? "disabled" : ""}">
                <a class="page-link" href="#" aria-label="Go to page ${page}" data-page="${page}">${title}</a>
            </li>
        `);
    }

    /**
     * Update pagination and re-render.
     * @param {number} todoCount
     * @param {number} current
     */
    update(todoCount, current) {
        // Don't re-render if unnecessary 
        if (this.todoCount === todoCount && this.current === current)
            return;

        this.todoCount = todoCount;
        // Bug: No TypeScript, so don't forget to coerce to number first
        this.current = +current;
        this.render();
    }
}

/**
 * Static class for any utilities.
 * @class Utilities
 */
class Utilities {

    /**
     * Simple debouncing function.
     * @param {function} callback - The callback to debounce.
     * @param {number} wait - The debounce delay.
     * @returns {function}
     */
    static simpleDebounce(callback, wait) {
        let timeout;

        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => callback.apply(this, args), wait);
        };
    }
}