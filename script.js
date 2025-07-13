$(document).ready(() => {
    // Just check the JQuery CDN is loading
    console.log('JQuery loaded'); 
    
    new TodoApp('https://jsonplaceholder.typicode.com/todos', 'todoList', 'search', 'warningBox')
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
    
    constructor(apiEndpoint, tableId, searchId, warningId) {
        this.apiEndpoint = apiEndpoint;

        // Select once, and save
        this.table = $(`#${tableId}`);
        this.search = $(`#${searchId}`);
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
        // Map the rows
        const rows = this.filteredTodos.map(todo => `
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
            
            // Update the render
            this.renderTable();
            
            // Show a warning if no results
            if (this.filteredTodos.length === 0) {
                this.onError("No search results found.");
                return;
            }
            
            // Otherwise remove existing warnings
            // Note: might need to re-think this if I have more errors to throw later
            if (this.warningState)
                this.onError("");

        }, 500));
    }

    /**
     * Run filters and sort on the list.
     */
    filterAndSort() {
        // Always start fresh as we can add/remove in future (scalability)
        let todoList = [...this.todos];

        todoList = TodoFilter.filter(todoList, this.searchState);
        
        // Update the filtered todos
        this.filteredTodos = todoList;
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