fetch('http://localhost:3000/app.js')
  .then(r => r.text())
  .then(t => {
    console.log('JS length:', t.length);
    console.log('Has kanban class:', t.includes('kanban'));
    console.log('Has task-card class:', t.includes('task-card'));
    console.log('Has kanban-col-body:', t.includes('kanban-col-body'));
    console.log('Has task-priority:', t.includes('task-priority'));

    const idx = t.indexOf('function taskCard');
    if (idx >= 0) {
      console.log('\n--- taskCard function ---');
      console.log(t.substring(idx, idx + 600));
    } else {
      console.log('taskCard function NOT FOUND');
    }
  });
