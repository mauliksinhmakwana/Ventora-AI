// goal/goal.js
let tasks = JSON.parse(localStorage.getItem('ventora_tasks')) || [];

function toggleGoalModal() {
    const modal = document.getElementById('goalModal');
    modal.classList.toggle('active');
    renderTasks();
}

function renderTasks() {
    const list = document.getElementById('taskList');
    list.innerHTML = tasks.map((task, index) => `
        <div class="task-item">
            <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask(${index})">
            <span style="${task.completed ? 'text-decoration: line-through; opacity: 0.5;' : ''}">${task.text}</span>
            <i class="fas fa-trash" style="font-size: 0.8rem; opacity: 0.5;" onclick="deleteTask(${index})"></i>
        </div>
    `).join('');
}

function addTask() {
    const input = document.getElementById('newTaskInput');
    if (!input.value.trim()) return;
    tasks.push({ text: input.value, completed: false });
    input.value = '';
    saveAndRender();
}

function toggleTask(index) {
    tasks[index].completed = !tasks[index].completed;
    saveAndRender();
}

function deleteTask(index) {
    tasks.splice(index, 1);
    saveAndRender();
}

function saveAndRender() {
    localStorage.setItem('ventora_tasks', JSON.stringify(tasks));
    renderTasks();
}

// Auto-save Notes (1 second delay)
function initNotes() {
    const area = document.getElementById('study-notes-area');
    area.value = localStorage.getItem('ventora_study_notes') || '';
    
    let timer;
    area.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            localStorage.setItem('ventora_study_notes', area.value);
            console.log('Notes auto-saved');
        }, 1000);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initNotes();
    renderTasks();
});
