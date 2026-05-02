fetch('http://localhost:3000/styles.css')
  .then(r => r.text())
  .then(t => {
    console.log('CSS length:', t.length);
    console.log('Has .kanban-col:', t.includes('.kanban-col'));
    console.log('Has repeat(3:', t.includes('repeat(3'));
    console.log('Has .task-card:', t.includes('.task-card'));
    console.log('Has eef2f7:', t.includes('#eef2f7'));

    const kanbanSection = t.substring(t.indexOf('.kanban {'), t.indexOf('.kanban {') + 200);
    console.log('\n--- .kanban rule ---');
    console.log(kanbanSection);
  });
