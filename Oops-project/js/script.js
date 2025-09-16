
    class Task {
      constructor(title, description, category, dueDate, status) {
        this.id = Task.incrementId();
        this.title = title;
        this.description = description;
        this.category = category;
        this.dueDate = dueDate ? new Date(dueDate) : null;
        this.status = status; 
      }

      static incrementId() {
        if (!this.latestId) this.latestId = 1;
        else this.latestId++;
        return this.latestId;
      }

      markComplete() {
        this.status = "Completed";
      }

      edit({ title, description, category, dueDate, status }) {
        if (title !== undefined) this.title = title;
        if (description !== undefined) this.description = description;
        if (category !== undefined) this.category = category;
        if (dueDate !== undefined) this.dueDate = dueDate ? new Date(dueDate) : null;
        if (status !== undefined) this.status = status;
      }

      isOverdue() {
        if (this.status === "Completed") return false;
        if (!this.dueDate) return false;
        const today = new Date();
   
        return this.dueDate.setHours(0,0,0,0) < today.setHours(0,0,0,0);
      }
    }

    class SpecialHabit extends Task {
      constructor(title, description, category, dueDate, status, habitFrequency) {
        super(title, description, category, dueDate, status);
        this.habitFrequency = habitFrequency; 
      }

    
      markComplete() {
        super.markComplete();
        console.log(`Habit "${this.title}" marked complete! Frequency: ${this.habitFrequency}`);
      }
    }

   
    const tasks = [];


    const taskForm = document.getElementById('taskForm');
    const taskList = document.getElementById('taskList');
    const dashboardSummary = document.getElementById('dashboardSummary');
    const searchInput = document.getElementById('searchInput');
    const filterStatus = document.getElementById('filterStatus');


    taskForm.addEventListener('submit', e => {
      e.preventDefault();
      const title = taskForm.title.value.trim();
      const description = taskForm.description.value.trim();
      const category = taskForm.category.value.trim();
      const dueDate = taskForm.dueDate.value;
      const status = taskForm.status.value;

      if (!title) {
        alert('Title is required');
        return;
      }


      const newTask = new Task(title, description, category, dueDate, status);
      tasks.push(newTask);

      taskForm.reset();
      renderTasks();
      updateDashboard();
    });

   
    function renderTasks() {
      taskList.innerHTML = '';

      const searchTerm = searchInput.value.toLowerCase();
      const filter = filterStatus.value;

     
      let filteredTasks = tasks.filter(task => {
      
        const matchesSearch = task.title.toLowerCase().includes(searchTerm) || task.category.toLowerCase().includes(searchTerm);

       
        let matchesFilter = true;
        if (filter === 'Completed') matchesFilter = task.status === 'Completed';
        else if (filter === 'Pending') matchesFilter = task.status === 'Pending' && !task.isOverdue();
        else if (filter === 'Overdue') matchesFilter = task.isOverdue();

        return matchesSearch && matchesFilter;
      });

      if (filteredTasks.length === 0) {
        const noTaskItem = document.createElement('li');
        noTaskItem.textContent = 'No tasks found.';
        noTaskItem.className = 'text-gray-500 italic';
        taskList.appendChild(noTaskItem);
        return;
      }

     
      filteredTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = 'bg-white p-4 rounded shadow flex flex-col sm:flex-row sm:items-center sm:justify-between';

 
        const infoDiv = document.createElement('div');
        infoDiv.className = 'mb-2 sm:mb-0';


        const titleSpan = document.createElement('span');
        titleSpan.className = 'font-semibold text-lg';
        titleSpan.textContent = task.title;

        const statusSpan = document.createElement('span');
        statusSpan.className = `ml-2 px-2 py-0.5 rounded text-xs font-medium ${
          task.status === 'Completed' ? 'bg-green-200 text-green-800' :
          task.isOverdue() ? 'bg-red-200 text-red-800' :
          'bg-yellow-200 text-yellow-800'
        }`;
        statusSpan.textContent = task.isOverdue() ? 'Overdue' : task.status;

        infoDiv.appendChild(titleSpan);
        infoDiv.appendChild(statusSpan);

     
        if (task.description) {
          const descP = document.createElement('p');
          descP.className = 'text-gray-600';
          descP.textContent = task.description;
          infoDiv.appendChild(descP);
        }
        if (task.category) {
          const catP = document.createElement('p');
          catP.className = 'text-gray-500 italic text-sm';
          catP.textContent = `Category: ${task.category}`;
          infoDiv.appendChild(catP);
        }
        if (task.dueDate) {
          const dueP = document.createElement('p');
          dueP.className = 'text-gray-500 italic text-sm';
          dueP.textContent = `Due: ${task.dueDate.toLocaleDateString()}`;
          infoDiv.appendChild(dueP);
        }

      
        const btnDiv = document.createElement('div');
        btnDiv.className = 'flex gap-2';

      
        if (task.status !== 'Completed') {
          const completeBtn = document.createElement('button');
          completeBtn.textContent = 'Complete';
          completeBtn.className = 'bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition';
          completeBtn.addEventListener('click', () => {
            task.markComplete();
            renderTasks();
            updateDashboard();
          });
          btnDiv.appendChild(completeBtn);
        }

    
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.className = 'bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition';
        deleteBtn.addEventListener('click', () => {
          const index = tasks.findIndex(t => t.id === task.id);
          if (index !== -1) {
            tasks.splice(index, 1);
            renderTasks();
            updateDashboard();
          }
        });
        btnDiv.appendChild(deleteBtn);

        li.appendChild(infoDiv);
        li.appendChild(btnDiv);

        taskList.appendChild(li);
      });
    }

  
    function updateDashboard() {
      const total = tasks.length;
      const completed = tasks.filter(t => t.status === 'Completed').length;
      const pending = tasks.filter(t => t.status === 'Pending' && !t.isOverdue()).length;
      const overdue = tasks.filter(t => t.isOverdue()).length;
      const progressPercent = total === 0 ? 0 : Math.round((completed / total) * 100);

      dashboardSummary.innerHTML = `
        <p>Total Tasks: <span class="font-bold">${total}</span></p>
        <p>Completed: <span class="font-bold text-green-600">${completed}</span></p>
        <p>Pending: <span class="font-bold text-yellow-600">${pending}</span></p>
        <p>Overdue: <span class="font-bold text-red-600">${overdue}</span></p>
        <p>Progress: <span class="font-bold">${progressPercent}%</span></p>
      `;
    }


    searchInput.addEventListener('input', () => {
      renderTasks();
    });

    filterStatus.addEventListener('change', () => {
      renderTasks();
    });

    renderTasks();
    updateDashboard();
  