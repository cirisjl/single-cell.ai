import React from 'react';

function LeftNav({ activeTask, setActiveTask, taskStatus, taskData, setTaskData, flow }) {

  const uploadTasks = [
    { id: 1, name: 'Upload', completed: taskStatus[1] },
    // { id: 2, name: 'Validation', completed: taskStatus[2] },
    { id: 2, name: 'QC', completed: taskStatus[2] },
    { id: 3, name: 'Metadata', completed: taskStatus[3] },
    // Add other upload tasks here
  ];

  const tbTasks = [
    { id: 4, name: 'Task Builder', completed: taskStatus[4] },
    { id: 5, name: 'Benchmarks', completed: taskStatus[5] },
    { id: 6, name: 'Review', completed: taskStatus[6] },
    // Add other task builder tasks here
  ];

  // New tasks for the uploadMydata flow
  const uploadMydataTasks = [
    { id: 1, name: 'Data Upload', completed: taskStatus[1] },
    { id: 2, name: 'Metadata', completed: taskStatus[2] },
    // Add other uploadMydata tasks here
  ];

  // Determine which set of tasks to use based on the current flow
  let tasks;
  switch (flow) {
    case 'taskBuilder':
      tasks = tbTasks;
      break;
    case 'uploadMyData':
      tasks = uploadMydataTasks;
      break;
    default:
      tasks = uploadTasks;
  }
  // const tasks = flow === 'taskBuilder' ? tbTasks : uploadTasks;

  const handleTaskClick = (task) => {
    const currentIndex = tasks.findIndex((t) => t.id === task.id);

    if (currentIndex === 0 || tasks[currentIndex - 1].completed) {
      setActiveTask(task.id);
    } else {
      alert("Complete the previous task first.");
    }
  };

  return (
    <nav className='benchmarks-left-nav'>
      <ul>
        {tasks.map((task) => (
          <li key={task.id}
            className={`${task.id === activeTask ? 'active' : ''
              } ${task.completed ? 'completed' : 'disable-click'}`}
          >
            <button
              onClick={(e) => { e.preventDefault(); handleTaskClick(task); }}
              className={task.completed ? 'completed' : ''}
              style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer', color: 'inherit' }}
            >
              {task.name}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default LeftNav;
