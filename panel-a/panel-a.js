layoutSelect.value  = settings.layout || 'a';


 
 // Sidebar resizer
  const sidebarResizer = document.getElementById('sidebarResizer');
  const sidebar = document.querySelector('.sidebar');
  if (sidebarResizer && sidebar) {
    let isResizing = false;
    let startX = 0;
    let startWidth = 0;

    sidebarResizer.addEventListener('mousedown', (e) => {
      isResizing = true;
      startX = e.clientX;
      startWidth = sidebar.offsetWidth;
      sidebarResizer.classList.add('dragging');
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      const dx = e.clientX - startX;
      const newWidth = startWidth + dx;
      const minWidth = 200;
      const maxWidth = 450;
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        sidebar.style.width = `${newWidth}px`;
      }
    });

    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        sidebarResizer.classList.remove('dragging');
      }
    });
  }