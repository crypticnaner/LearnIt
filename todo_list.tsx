import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

// Define a type for a single Todo item using TypeScript.
// This ensures that every todo object has a 'text' (string) and 'completed' (boolean) property.
type Todo = {
  id: number;
  text: string;
  completed: boolean;
};

// Define the main App component.
const App: React.FC = () => {
  // Use the useState hook to manage the list of todos.
  // We explicitly tell TypeScript that the state will be an array of Todo objects.
  const [todos, setTodos] = useState<Todo[]>([]);
  // State for the new todo input field.
  const [inputValue, setInputValue] = useState<string>('');

  // Function to add a new todo.
  const addTodo = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent the form from refreshing the page.
    if (inputValue.trim() === '') return; // Don't add empty todos.

    const newTodo: Todo = {
      id: Date.now(), // Unique ID for each todo.
      text: inputValue,
      completed: false,
    };

    // Update the state with the new todo.
    setTodos([...todos, newTodo]);
    setInputValue(''); // Clear the input field.
  };

  // Function to toggle the 'completed' status of a todo.
  const toggleTodo = (id: number) => {
    // Map over the todos and find the one to update.
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  // Function to remove a todo.
  const removeTodo = (id: number) => {
    // Filter out the todo with the matching ID.
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          My Todo List
        </h2>

        {/* Form to add new todos */}
        <form onSubmit={addTodo} className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                id="new-todo"
                name="new-todo"
                type="text"
                autoComplete="off"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Add a new todo"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Add Todo
            </button>
          </div>
        </form>

        {/* List of todos */}
        <ul className="divide-y divide-gray-200">
          {todos.map((todo) => (
            <li key={todo.id} className="py-4 flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id={`todo-${todo.id}`}
                  name={`todo-${todo.id}`}
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label
                  htmlFor={`todo-${todo.id}`}
                  className={`ml-3 block text-sm font-medium text-gray-700 ${todo.completed ? 'line-through text-gray-500' : ''}`}
                >
                  {todo.text}
                </label>
              </div>
              <button
                onClick={() => removeTodo(todo.id)}
                className="text-red-500 hover:text-red-700 transition duration-150 ease-in-out"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 012 0v6a1 1 0 11-2 0V8z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// This line is needed to render the component in a simple HTML file setup.
const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// For a typical React project, you would export the App component.
export default App;
