// Example function to fetch notes from backend
async function fetchNotes() {
    try {
        const response = await fetch('/notes', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
        });
        if (!response.ok) {
            throw new Error('Failed to fetch notes.');
        }
        const notes = await response.json();
        // Display notes on UI
        displayNotes(notes);
    } catch (error) {
        console.error('Error fetching notes:', error);
    }
}

// Example function to create a new note
async function createNote() {
    const title = document.getElementById('noteTitle').value;
    const content = document.getElementById('noteContent').value;
    const color = document.querySelector('input[name="color"]:checked').value;
    const tags = document.getElementById('noteTags').value.split(',');

    try {
        const response = await fetch('/notes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            },
            body: JSON.stringify({ title, content, color, tags })
        });
        if (!response.ok) {
            throw new Error('Failed to create note.');
        }
        const { id } = await response.json();
        // Clear form fields or update UI as needed
        console.log('Note created with ID:', id);
    } catch (error) {
        console.error('Error creating note:', error);
    }
}

// Other functions for handling note deletion, updating, searching, etc.

// Example event listener for form submission
document.getElementById('createNoteForm').addEventListener('submit', function(event) {
    event.preventDefault();
    createNote();
});
