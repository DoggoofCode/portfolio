(function bootstrapSitewidePopups() {
  const NOTICE_PRESETS = {
    "incomplete-untrusted-sidebar": {
      title: "Portfolio in progress",
      message:
        "This site is still incomplete. Please do not trust the information shown here, including any content in the side navigation.",
    },
  };

  let openModal = null;
  let closeModal = null;

  let integrityNoticeModal = null;
  let integrityNoticeTitle = null;
  let integrityNoticeCopy = null;
  let closeIntegrityNoticeButton = null;
  let acknowledgeIntegrityNoticeButton = null;

  let feedbackTopBanner = null;
  let feedbackBannerButton = null;
  let feedbackBannerCloseButton = null;
  let feedbackModal = null;
  let feedbackForm = null;
  let feedbackInput = null;
  let closeFeedbackButton = null;
  let feedbackCard = null;
  let isFeedbackSending = false;

  let initialized = false;

  function closeNotice() {
    if (!integrityNoticeModal || !closeModal) {
      return;
    }
    closeModal(integrityNoticeModal);
  }

  function ensureFeedbackUi() {
    if (document.querySelector("#feedback-top-banner")) {
      feedbackTopBanner = document.querySelector("#feedback-top-banner");
      feedbackBannerButton = document.querySelector("#feedback-banner-button");
      feedbackBannerCloseButton = document.querySelector(
        "#feedback-banner-close"
      );
      feedbackModal = document.querySelector("#feedback-modal");
      feedbackForm = document.querySelector("#feedback-form");
      feedbackInput = document.querySelector("#feedback-message");
      closeFeedbackButton = document.querySelector("#close-feedback-modal");
      feedbackCard = document.querySelector("#feedback-modal-card");
      return;
    }

    const banner = document.createElement("div");
    banner.id = "feedback-top-banner";
    banner.className = "feedback-top-banner";
    banner.setAttribute("role", "region");
    banner.setAttribute("aria-label", "Feedback banner");
    banner.innerHTML = `
      <p class="feedback-top-banner__copy">
        Help improve this page — your feedback is welcome.
      </p>
      <div class="feedback-top-banner__actions">
        <button
          type="button"
          id="feedback-banner-button"
          class="feedback-top-banner__cta"
          aria-label="Open feedback form"
        >
          Give feedback
        </button>
        <button
          type="button"
          id="feedback-banner-close"
          class="feedback-top-banner__close"
          aria-label="Close feedback banner"
        >
          ✕
        </button>
      </div>
    `;
    document.body.append(banner);

    const modalHost = document.createElement("div");
    modalHost.className = "modal-overlay";
    modalHost.id = "feedback-modal";
    modalHost.hidden = true;
    modalHost.setAttribute("role", "dialog");
    modalHost.setAttribute("aria-modal", "true");
    modalHost.setAttribute("aria-labelledby", "feedback-modal-title");
    modalHost.innerHTML = `
      <div class="modal-card feedback-modal-card" id="feedback-modal-card">
        <div class="modal-header">
          <h2 id="feedback-modal-title">Feedback</h2>
          <button
            type="button"
            class="icon-button"
            id="close-feedback-modal"
            aria-label="Close feedback form"
          >
            ✕
          </button>
        </div>
        <p class="modal-copy">Tell me what could be improved on this page.</p>
        <form id="feedback-form" class="feedback-form">
          <label for="feedback-message" class="feedback-form__label">Message</label>
          <textarea
            id="feedback-message"
            class="feedback-form__input"
            rows="5"
            placeholder="Type your feedback here..."
            required
          ></textarea>
          <button type="submit" class="feedback-form__submit">Submit feedback</button>
        </form>
      </div>
    `;
    document.body.append(modalHost);

    feedbackTopBanner = banner;
    feedbackBannerButton = banner.querySelector("#feedback-banner-button");
    feedbackBannerCloseButton = banner.querySelector("#feedback-banner-close");
    feedbackModal = modalHost;
    feedbackForm = modalHost.querySelector("#feedback-form");
    feedbackInput = modalHost.querySelector("#feedback-message");
    closeFeedbackButton = modalHost.querySelector("#close-feedback-modal");
    feedbackCard = modalHost.querySelector("#feedback-modal-card");
  }

  function closeFeedbackModal() {
    if (!feedbackModal || !closeModal || isFeedbackSending) {
      return;
    }
    closeModal(feedbackModal);
  }

  function hideFeedbackBanner() {
    if (!feedbackTopBanner) {
      return;
    }
    feedbackTopBanner.classList.add("is-hidden");
    window.setTimeout(() => {
      if (feedbackTopBanner) {
        feedbackTopBanner.hidden = true;
      }
    }, 220);
  }

  function submitFeedback(event) {
    event.preventDefault();
    if (!feedbackModal || !feedbackInput || !feedbackCard || isFeedbackSending) {
      return;
    }

    const message = feedbackInput.value.trim();
    if (!message) {
      feedbackInput.focus();
      return;
    }

    isFeedbackSending = true;
    const payload = {
      message,
      submittedAt: new Date().toISOString(),
    };

    console.log("[feedback][dummy-send]", payload);

    feedbackCard.classList.add("is-sending");
    window.setTimeout(() => {
      feedbackCard.classList.remove("is-sending");
      feedbackInput.value = "";
      closeModal(feedbackModal);
      isFeedbackSending = false;
    }, 1080);
  }

  function bindHandlers() {
    closeIntegrityNoticeButton?.addEventListener("click", closeNotice);
    acknowledgeIntegrityNoticeButton?.addEventListener("click", closeNotice);
    integrityNoticeModal?.addEventListener("click", (event) => {
      if (event.target === integrityNoticeModal) {
        closeNotice();
      }
    });

    feedbackTopBanner?.addEventListener("click", (event) => {
      const targetButton = event.target.closest("button");
      if (!targetButton) {
        return;
      }
      if (targetButton.id === "feedback-banner-close") {
        event.preventDefault();
        hideFeedbackBanner();
        return;
      }
      if (targetButton.id === "feedback-banner-button") {
        event.preventDefault();
        if (feedbackModal && openModal) {
          openModal(feedbackModal);
          feedbackInput?.focus();
        }
      }
    });
    closeFeedbackButton?.addEventListener("click", closeFeedbackModal);
    feedbackModal?.addEventListener("click", (event) => {
      if (event.target === feedbackModal) {
        closeFeedbackModal();
      }
    });
    feedbackForm?.addEventListener("submit", submitFeedback);

    document.addEventListener("keydown", (event) => {
      if (
        event.key === "Escape" &&
        integrityNoticeModal &&
        !integrityNoticeModal.hidden
      ) {
        closeNotice();
        return;
      }

      if (event.key === "Escape" && feedbackModal && !feedbackModal.hidden) {
        closeFeedbackModal();
      }
    });
  }

  function init(config) {
    if (initialized) {
      return;
    }

    openModal = config?.openModal || null;
    closeModal = config?.closeModal || null;

    integrityNoticeModal = document.querySelector("#integrity-notice-modal");
    integrityNoticeTitle = document.querySelector("#integrity-notice-title");
    integrityNoticeCopy = document.querySelector("#integrity-notice-copy");
    closeIntegrityNoticeButton = document.querySelector(
      "#close-integrity-notice"
    );
    acknowledgeIntegrityNoticeButton = document.querySelector(
      "#acknowledge-integrity-notice"
    );

    ensureFeedbackUi();

    if (openModal && closeModal) {
      bindHandlers();
      initialized = true;
    }
  }

  function showSiteNotice(siteNoticeConfig) {
    if (!initialized || !integrityNoticeModal || !siteNoticeConfig?.enabled) {
      return;
    }

    const hasPreset = Object.prototype.hasOwnProperty.call(
      NOTICE_PRESETS,
      siteNoticeConfig.preset
    );
    const preset = NOTICE_PRESETS[
      hasPreset ? siteNoticeConfig.preset : "incomplete-untrusted-sidebar"
    ];

    integrityNoticeTitle.textContent = siteNoticeConfig.title?.trim() || preset.title;
    integrityNoticeCopy.textContent =
      siteNoticeConfig.message?.trim() || preset.message;
    openModal(integrityNoticeModal);
  }

  window.SitewidePopups = {
    init,
    showSiteNotice,
  };
})();
