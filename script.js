$(document).ready(() => {
    // Just check the JQuery CDN is loading
    console.log('JQuery loaded'); 
    
    new TodoApp('https://jsonplaceholder.typicode.com/todos', 'todoList')
});

/**
 * A class to manage a Todo-App table
 * @class TodoApp
 */
class TodoApp {
    todos = [];

    constructor(apiEndpoint, tableId) {
        this.apiEndpoint = apiEndpoint;

        // Select once, and save
        this.table = $(`#${tableId}`);

        this.init();
    }

    /**
     * Fetch the todolist
     */
    init() {
        // This would benefit from being async so we can await the promise resolution
        this.fetchTodos();
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

                // Render the table
                this.renderTable();
            },
            error: () => {
                // Todo: Add an error handler
                console.warn('fetch failed');
            }
        })
    }

    /**
     * Render the table.
     */
    renderTable() {
        // Map the rows
        const rows = this.todos.map(todo => `
            <tr>
                <td>${todo.id}</td> 
                <td>${todo.title}</td>   
                <td>${todo.completed ? 'Yes' : 'No'}</td>    
            </tr>  
        `).join('');

        // Set the table html
        this.table.html(rows);
    }
}