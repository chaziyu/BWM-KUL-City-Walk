export function createLandingScreen({ onExploreDemo, onVisitor, onStaff, onBackHome, onCloseStaff }) {
  return {
    init() {
      const exploreDemoBtn = document.getElementById('btnExploreDemo');
      if (exploreDemoBtn && exploreDemoBtn.dataset.bound !== 'true') {
        exploreDemoBtn.dataset.bound = 'true';
        const originalContent = exploreDemoBtn.innerHTML;
        exploreDemoBtn.addEventListener('click', async () => {
          exploreDemoBtn.disabled = true;
          exploreDemoBtn.textContent = 'Starting demo…';
          try {
            await onExploreDemo?.();
          } finally {
            exploreDemoBtn.disabled = false;
            exploreDemoBtn.innerHTML = originalContent;
          }
        });
      }

      const visitorButton = document.getElementById('btnVisitor');
      if (visitorButton && visitorButton.dataset.bound !== 'true') {
        visitorButton.dataset.bound = 'true';
        visitorButton.addEventListener('click', () => onVisitor?.());
      }

      const staffButton = document.getElementById('btnStaff');
      if (staffButton && staffButton.dataset.bound !== 'true') {
        staffButton.dataset.bound = 'true';
        staffButton.addEventListener('click', () => onStaff?.());
      }

      const backButton = document.getElementById('backToHome');
      if (backButton && backButton.dataset.bound !== 'true') {
        backButton.dataset.bound = 'true';
        backButton.addEventListener('click', () => onBackHome?.());
      }

      const closeStaffButton = document.getElementById('closeStaffScreen');
      if (closeStaffButton && closeStaffButton.dataset.bound !== 'true') {
        closeStaffButton.dataset.bound = 'true';
        closeStaffButton.addEventListener('click', () => onCloseStaff?.());
      }
    },
  };
}
