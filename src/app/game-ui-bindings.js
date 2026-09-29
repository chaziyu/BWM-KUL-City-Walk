export function createGameUiBindings({
  badgeController,
  challengeController,
  chatController,
  directionsController,
  getSession,
  modalManager,
  onShowAdmin,
  passportController,
  resetDemoProgress,
  siteModalController,
  textSizeController,
}) {
  let bound = false;

  function sharePayload({ title, suffix }) {
    const payload = passportController.buildSharePayload();
    if (navigator.share) {
      navigator.share({
        title,
        text: payload.text,
        url: payload.url,
      }).catch(console.error);
      return;
    }

    const message = `${payload.text}\n\n${suffix}: ${payload.url}`;
    window.open(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer',
    );
  }

  function bind() {
    if (bound) return;
    bound = true;

    const siteModal = document.getElementById('siteModal');
    const passportModal = document.getElementById('passportModal');
    const congratsModal = document.getElementById('congratsModal');

    siteModalController.bind({
      modal: siteModal,
      image: document.getElementById('siteModalImage'),
      label: document.getElementById('siteModalLabel'),
      title: document.getElementById('siteModalTitle'),
      info: document.getElementById('siteModalInfo'),
      quizArea: document.getElementById('siteModalQuizArea'),
      quizQuestion: document.getElementById('siteModalQuizQ'),
      quizOptions: document.getElementById('siteModalQuizOptions'),
      quizResult: document.getElementById('siteModalQuizResult'),
      closeButton: document.getElementById('closeSiteModal'),
      askAI: document.getElementById('siteModalAskAI'),
      directions: document.getElementById('siteModalDirections'),
      checkIn: document.getElementById('siteModalCheckInBtn'),
      solveChallenge: document.getElementById('siteModalSolveChallengeBtn'),
      more: document.getElementById('siteModalMore'),
      moreButton: document.getElementById('siteModalMoreBtn'),
      moreContent: document.getElementById('siteModalMoreContent'),
      food: document.getElementById('siteModalFoodBtn'),
      hotel: document.getElementById('siteModalHotelBtn'),
      hintText: document.getElementById('siteModalHintText'),
    });

    passportController.bind({
      btnPassport: document.getElementById('btnPassport'),
      passportModal,
      closePassportModal: document.getElementById('closePassportModal'),
      passportInfo: document.getElementById('passportInfo'),
      passportGrid: document.getElementById('passportGrid'),
      progressBar: document.getElementById('progressBar'),
      progressText: document.getElementById('progressText'),
    });

    chatController.bind();
    challengeController.bind();
    badgeController.bind();
    directionsController.bind();

    const closeCongrats = document.getElementById('closeCongratsModal');
    if (closeCongrats && closeCongrats.dataset.bound !== 'true') {
      closeCongrats.dataset.bound = 'true';
      closeCongrats.addEventListener('click', () => modalManager.close(congratsModal));
    }

    const sharePassportBtn = document.getElementById('sharePassportBtn');
    if (sharePassportBtn && sharePassportBtn.dataset.bound !== 'true') {
      sharePassportBtn.dataset.bound = 'true';
      sharePassportBtn.addEventListener('click', () => {
        sharePayload({
          title: 'BWM KUL City Walk',
          suffix: 'Join the adventure',
        });
      });
    }

    const shareWhatsAppBtn = document.getElementById('shareWhatsAppBtn');
    if (shareWhatsAppBtn && shareWhatsAppBtn.dataset.bound !== 'true') {
      shareWhatsAppBtn.dataset.bound = 'true';
      shareWhatsAppBtn.addEventListener('click', () => {
        sharePayload({
          title: 'Mission Accomplished!',
          suffix: "Discover KL's history and start your own adventure here",
        });
      });
    }

    const btnAdminToggle = document.getElementById('btnAdminToggle');
    if (btnAdminToggle && btnAdminToggle.dataset.bound !== 'true') {
      btnAdminToggle.dataset.bound = 'true';
      btnAdminToggle.addEventListener('click', () => {
        if (getSession()?.role === 'admin') onShowAdmin();
      });
    }

    const resetDemoProgressBtn = document.getElementById('resetDemoProgressBtn');
    if (resetDemoProgressBtn && resetDemoProgressBtn.dataset.bound !== 'true') {
      resetDemoProgressBtn.dataset.bound = 'true';
      resetDemoProgressBtn.addEventListener('click', () => {
        if (getSession()?.role !== 'demo') return;
        const confirmed = window.confirm(
          'Reset your demo stamps, quiz progress, challenge progress, and local AI history on this device?',
        );
        if (!confirmed) return;
        resetDemoProgress();
        window.location.reload();
      });
    }

    window.addEventListener('popstate', () => {
      modalManager.closeTopmost();
    });

    textSizeController.bind();
    chatController.loadHistory();
  }

  return { bind };
}
