// Get DOM elements
const taskInput = document.getElementById('taskInput');
const taskList = document.getElementById('taskList');
const totalTasks = document.getElementById('totalTasks');
const completedTasks = document.getElementById('completedTasks');
const filterButtons = document.querySelectorAll('.filter-btn');
const fileInput = document.getElementById('fileInput');
const previewArea = document.getElementById('previewArea');

// Load tasks from localStorage
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';
let currentFiles = [];

// Function to handle file input change
fileInput.addEventListener('change', handleFileSelect);

function handleFileSelect(event) {
    const files = event.target.files;
    currentFiles = Array.from(files);
    updatePreviewArea();
}

function updatePreviewArea() {
    previewArea.innerHTML = '';
    currentFiles.forEach((file, index) => {
        const preview = document.createElement('div');
        preview.className = 'preview-item';

        if (file.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            preview.appendChild(img);
        } else {
            const icon = document.createElement('div');
            icon.className = 'file-icon';
            icon.innerHTML = '<i class="fas fa-file"></i>';
            preview.appendChild(icon);
        }

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-preview';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.onclick = () => removeFile(index);
        preview.appendChild(removeBtn);

        previewArea.appendChild(preview);
    });
}

function removeFile(index) {
    currentFiles.splice(index, 1);
    updatePreviewArea();
}

// Function to convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Function to save tasks to localStorage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    updateTaskStats();
}

// Function to update task statistics
function updateTaskStats() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    totalTasks.textContent = `${total} task${total !== 1 ? 's' : ''}`;
    completedTasks.textContent = `${completed} completed`;
}

// Function to render tasks based on current filter
async function renderTasks() {
    taskList.innerHTML = '';
    let filteredTasks = tasks;
    
    if (currentFilter === 'active') {
        filteredTasks = tasks.filter(task => !task.completed);
    } else if (currentFilter === 'completed') {
        filteredTasks = tasks.filter(task => task.completed);
    }

    filteredTasks.forEach((task, index) => {
        const li = document.createElement('li');
        li.className = 'task-item' + (task.completed ? ' completed' : '');
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'task-checkbox';
        checkbox.checked = task.completed;
        checkbox.onchange = () => toggleTask(index);
        
        const taskContent = document.createElement('div');
        taskContent.className = 'task-content';
        
        const taskText = document.createElement('span');
        taskText.className = 'task-text';
        taskText.textContent = task.text;
        
        taskContent.appendChild(taskText);
        
        // Add attachments if present
        if (task.attachments && task.attachments.length > 0) {
            const attachmentsDiv = document.createElement('div');
            attachmentsDiv.className = 'task-attachments';
            
            task.attachments.forEach(attachment => {
                const attachmentDiv = document.createElement('div');
                if (attachment.type.startsWith('image/')) {
                    attachmentDiv.className = 'task-attachment';
                    const img = document.createElement('img');
                    img.src = attachment.data;
                    img.onclick = () => window.open(attachment.data, '_blank');
                    attachmentDiv.appendChild(img);
                } else {
                    attachmentDiv.className = 'task-attachment file';
                    attachmentDiv.innerHTML = '<i class="fas fa-file"></i>';
                    attachmentDiv.onclick = () => window.open(attachment.data, '_blank');
                }
                attachmentsDiv.appendChild(attachmentDiv);
            });
            
            taskContent.appendChild(attachmentsDiv);
        }
        
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.onclick = () => deleteTask(index);
        
        li.appendChild(checkbox);
        li.appendChild(taskContent);
        li.appendChild(deleteBtn);
        taskList.appendChild(li);
    });

    updateTaskStats();
}

// Function to add a new task
async function addTask() {
    const text = taskInput.value.trim();
    if (text || currentFiles.length > 0) {
        const attachments = [];
        
        // Process files if any
        for (const file of currentFiles) {
            try {
                const base64 = await fileToBase64(file);
                attachments.push({
                    name: file.name,
                    type: file.type,
                    data: base64
                });
            } catch (error) {
                console.error('Error processing file:', error);
            }
        }
        
        tasks.unshift({
            text,
            completed: false,
            attachments
        });
        
        taskInput.value = '';
        currentFiles = [];
        previewArea.innerHTML = '';
        saveTasks();
        renderTasks();
    }
}

// Function to toggle task completion
function toggleTask(index) {
    tasks[index].completed = !tasks[index].completed;
    saveTasks();
    renderTasks();
}

// Function to delete a task
function deleteTask(index) {
    tasks.splice(index, 1);
    saveTasks();
    renderTasks();
}

// Function to clear completed tasks
function clearCompletedTasks() {
    tasks = tasks.filter(task => !task.completed);
    saveTasks();
    renderTasks();
}

// Function to set active filter
function setFilter(filter) {
    currentFilter = filter;
    filterButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    renderTasks();
}

// Add event listeners
taskInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addTask();
    }
});

filterButtons.forEach(btn => {
    btn.addEventListener('click', () => setFilter(btn.dataset.filter));
});

// Initial render
renderTasks();
