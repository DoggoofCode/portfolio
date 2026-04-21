const skillsList = document.querySelector("#skills-list");
const projectGrid = document.querySelector("#project-grid");
const closeButton = document.querySelector("#close-other-projects");
const otherProjectsModal = document.querySelector("#other-projects-modal");
const modalTitle = document.querySelector("#other-projects-title");
const modalCopy = document.querySelector("#other-projects-modal .modal-copy");
const otherProjectsList = document.querySelector("#other-projects-list");
const featuredProjectModal = document.querySelector("#featured-project-modal");
const closeFeaturedButton = document.querySelector("#close-featured-project");
const featuredProjectTitle = document.querySelector("#featured-project-title");
const featuredProjectCopy = document.querySelector("#featured-project-copy");
const featuredProjectImages = document.querySelector("#featured-project-images");
const entryPreloader = document.querySelector("#entry-preloader");
const hero = document.querySelector("#hero");
const heroContent = document.querySelector(".hero-premium__content");
const heroOrbA = document.querySelector(".hero-premium__orb--a");
const heroOrbB = document.querySelector(".hero-premium__orb--b");
const heroActionButtons = Array.from(
  document.querySelectorAll("[data-scroll-target]")
);
const sidebar = document.querySelector(".sidebar");
const chapterLinks = Array.from(document.querySelectorAll(".chapter-link"));
const navNodes = Array.from(document.querySelectorAll("[data-nav-node]"));
let pendingTargetId = null;
let activeScrollRaf = null;
let featuredProjectsData = [];
let projectsCarouselIndex = 0;
let projectsCarouselCount = 0;
let projectsCarouselTrack = null;
let projectsCarouselViewport = null;
let projectsCarouselCounter = null;
let projectsCarouselDots = [];
let entrySequenceCompleted = false;
let entrySequenceTimeoutId = null;
const MODAL_ANIMATION_MS = 220;
const modalTimers = new WeakMap();

function normalizeImageSource(value) {
  if (typeof value !== "string") {
    return "";
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  if (/^data:/i.test(trimmed) || /^blob:/i.test(trimmed)) {
    return trimmed;
  }
  return encodeURI(trimmed.replace(/\\/g, "/"));
}

function openModal(modalElement) {
  const existingTimer = modalTimers.get(modalElement);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  modalElement.hidden = false;
  modalElement.classList.remove("is-closing");
  requestAnimationFrame(() => {
    modalElement.classList.add("is-open");
  });
  document.body.style.overflow = "hidden";
}

function closeModal(modalElement) {
  if (modalElement.hidden) {
    return;
  }

  modalElement.classList.remove("is-open");
  modalElement.classList.add("is-closing");

  const timer = setTimeout(() => {
    modalElement.classList.remove("is-closing");
    modalElement.hidden = true;

    const anyOpenModal = document.querySelector(
      ".modal-overlay.is-open:not([hidden]), .modal-overlay.is-closing:not([hidden])"
    );
    if (!anyOpenModal) {
      document.body.style.overflow = "";
    }
  }, MODAL_ANIMATION_MS);

  modalTimers.set(modalElement, timer);
}

function completeEntrySequence() {
  if (entrySequenceCompleted) {
    return;
  }
  entrySequenceCompleted = true;
  if (entrySequenceTimeoutId) {
    clearTimeout(entrySequenceTimeoutId);
  }

  if (hero) {
    hero.classList.add("is-ready");
  }

  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const delay = prefersReduced ? 80 : 380;
  setTimeout(() => {
    if (!entryPreloader) {
      return;
    }
    entryPreloader.classList.add("is-hidden");
    entryPreloader.setAttribute("aria-hidden", "true");
    setTimeout(() => {
      entryPreloader.hidden = true;
      entryPreloader.style.display = "none";
      entryPreloader.remove();
    }, 520);
  }, delay);
}

function fallbackSkillSummary(name, index) {
  const variants = [
    `${name} is used to design reliable features with clear boundaries and maintainable implementation patterns.`,
    `${name} helps ship production-ready work with measurable outcomes, careful iteration, and stable delivery.`,
    `${name} supports end-to-end execution from prototyping to deployment with practical engineering tradeoffs.`,
    `${name} is applied to build robust workflows with observability, repeatability, and straightforward maintenance.`,
  ];
  return variants[index % variants.length];
}

function fallbackProjectDescription(title, index) {
  const variants = [
    `${title} focuses on a full implementation path from scoped requirements to measurable production outcomes.`,
    `${title} demonstrates a practical build that balances modeling quality, system reliability, and delivery speed.`,
    `${title} packages experimentation, validation, and deployment into a single workflow with clear checkpoints.`,
    `${title} is structured around maintainable architecture, explicit metrics, and continuous improvement loops.`,
  ];
  return variants[index % variants.length];
}

function fallbackProjectDetail(title, summary, index) {
  const variants = [
    `${title}: this view highlights the core workflow and how the system is organized for dependable execution.`,
    `${title}: this step captures how model behavior is evaluated and tuned against practical success criteria.`,
    `${title}: this stage shows deployment-facing considerations, including stability, monitoring, and supportability.`,
    `${title}: this slice outlines iterative improvements informed by observed performance and usage feedback.`,
  ];
  const detail = variants[index % variants.length];
  return summary ? `${detail} ${summary}` : detail;
}

function renderSkills(skills) {
  const derivePreview = (summary = "") => {
    const sentence = summary.split(".")[0].trim();
    const base = sentence || summary.trim();
    if (base.length <= 72) {
      return base;
    }
    return `${base.slice(0, 69).trimEnd()}...`;
  };

  const rows = skills
    .map((skill, index) => {
      const name = typeof skill === "string"
        ? skill
        : skill.name || `Skill ${index + 1}`;
      const summary = typeof skill === "string"
        ? fallbackSkillSummary(name, index)
        : skill.summary?.trim() || fallbackSkillSummary(name, index);
      const item = {
        ...(typeof skill === "object" && skill ? skill : {}),
        name,
        summary,
      };
      const preview = item.preview || derivePreview(item.summary);

      return `
        <details class="skills-row">
          <summary>
            <span class="skills-row__name">${item.name}</span>
            <span class="skills-row__meta">
              <span class="skills-row__preview">${preview}</span>
              <span class="skills-row__icon" aria-hidden="true">
                <span class="skills-row__line skills-row__line--h"></span>
                <span class="skills-row__line skills-row__line--v"></span>
              </span>
            </span>
          </summary>
          <div class="skills-row__content">
            <p class="skills-row__desc">${item.summary}</p>
          </div>
        </details>
      `;
    })
    .join("");

  skillsList.innerHTML = `
    <div class="skills-table">
      <div class="skills-table__header">
        <span>Skill</span>
        <span>Notes</span>
      </div>
      ${rows}
    </div>
  `;
}

function renderFeaturedProjects(featuredProjects, otherCard) {
  featuredProjectsData = featuredProjects;
  const featuredMarkup = featuredProjects
    .map(
      (project, index) => {
        const title = project.title || `Featured Project ${index + 1}`;
        const description = project.description?.trim() ||
          fallbackProjectDescription(title, index);
        const linkLabel = project.linkLabel || "View details";
        const mainImage = normalizeImageSource(
          project.mainImage || project.images?.[0] || ""
        );
        return `
        <article class="project-card project-card--featured">
          <img
            class="project-card__main-image"
            src="${mainImage}"
            alt="${title} main image"
            loading="lazy"
          />
          <div class="project-card__content">
            <p class="project-card__eyebrow">Featured Project</p>
            <h3>${title}</h3>
            <p>${description}</p>
            <button
              type="button"
              class="open-featured-project project-card__action"
              data-featured-index="${index}"
              aria-label="Open ${title} project details"
            >
              ${linkLabel}
            </button>
          </div>
        </article>
      `;
      }
    )
    .join("");

  const slideCount = featuredProjects.length;
  const dotsMarkup = Array.from({ length: slideCount }, (_, index) => {
    const activeClass = index === 0 ? " is-active" : "";
    return `
      <button
        type="button"
        class="projects-carousel__dot${activeClass}"
        data-project-slide="${index}"
        aria-label="Go to project slide ${index + 1}"
      ></button>
    `;
  }).join("");

  projectGrid.innerHTML = `
    <div class="projects-carousel" id="projects-carousel">
      <div class="projects-carousel__stage">
        <button type="button" class="projects-carousel__button projects-carousel__button--side projects-carousel__button--prev" data-projects-carousel="prev" aria-label="Previous project">←</button>
        <button type="button" class="projects-carousel__button projects-carousel__button--side projects-carousel__button--next" data-projects-carousel="next" aria-label="Next project">→</button>
        <div class="projects-carousel__viewport">
          <div class="projects-carousel__track">
            ${featuredMarkup}
          </div>
        </div>
      </div>
      <div class="projects-carousel__footer">
        <div class="projects-carousel__dots">
          ${dotsMarkup}
        </div>
        <span class="projects-carousel__counter">1 / ${slideCount}</span>
      </div>
      <section class="projects-other-section" aria-label="Other projects">
        <p class="projects-other-section__eyebrow">Project Gallery</p>
        <h4>${otherCard?.title || "All Other Projects"}</h4>
        <p>${otherCard?.description || "Browse additional builds and experiments in a compact project gallery."}</p>
        <button type="button" id="open-other-projects" class="projects-other-section__button">
          ${otherCard?.buttonLabel || "Open project gallery"}
        </button>
      </section>
    </div>
  `;
}

function renderOtherProjects(otherProjects) {
  otherProjectsList.innerHTML = otherProjects
    .map(
      (project, index) => {
        const title = project.title || `Project ${index + 1}`;
        const description = project.description?.trim() ||
          fallbackProjectDescription(title, index + 2);
        const image = normalizeImageSource(project.image || "");
        return `
        <article class="other-card">
          <img src="${image}" alt="${title}" loading="lazy" />
          <div class="other-card-body">
            <h3>${title}</h3>
            <p>${description}</p>
            <a href="${project.link || "#"}">${project.linkLabel || "View project"}</a>
          </div>
        </article>
      `;
      }
    )
    .join("");
}

function attachModalOpenHandler() {
  const openButton = document.querySelector("#open-other-projects");
  if (!openButton) {
    return;
  }
  openButton.addEventListener("click", () => openModal(otherProjectsModal));
}

function openFeaturedProject(index) {
  const project = featuredProjectsData[index];
  if (!project) {
    return;
  }

  const projectTitle = project.title || `Featured Project ${index + 1}`;
  const projectDescription = project.description?.trim() ||
    fallbackProjectDescription(projectTitle, index);

  featuredProjectTitle.textContent = projectTitle;
  featuredProjectCopy.textContent = projectDescription;

  const images = Array.isArray(project.images) && project.images.length
    ? project.images
    : [project.mainImage || ""];
  const details = Array.isArray(project.details) ? project.details : [];

  const detailItemsMarkup = images
    .map((imageUrl, slideIndex) => {
      const detailText = details[slideIndex] ||
        fallbackProjectDetail(projectTitle, projectDescription, slideIndex);
      const reverseClass = slideIndex % 2 === 1 ? " is-reverse" : "";
      const normalizedImageUrl = normalizeImageSource(imageUrl);
      return `
        <article class="featured-detail-item${reverseClass}">
          <div class="featured-detail-item__copy">
            <p>${detailText}</p>
          </div>
          <div class="featured-detail-item__media">
            <img
              src="${normalizedImageUrl}"
              alt="${projectTitle} image ${slideIndex + 1}"
              loading="lazy"
            />
          </div>
        </article>
      `;
    })
    .join("");

  featuredProjectImages.innerHTML = `
    <div class="featured-details-list">${detailItemsMarkup}</div>
  `;

  openModal(featuredProjectModal);
}

function attachFeaturedProjectHandlers() {
  const buttons = document.querySelectorAll(".open-featured-project");
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.featuredIndex);
      openFeaturedProject(index);
    });
  });
}

function updateProjectsCarousel() {
  if (!projectsCarouselTrack || projectsCarouselCount < 1) {
    return;
  }

  const slideWidth =
    projectsCarouselViewport?.clientWidth ||
    projectsCarouselTrack.firstElementChild?.getBoundingClientRect().width ||
    0;
  projectsCarouselTrack.style.transform = `translateX(-${projectsCarouselIndex * slideWidth}px)`;
  if (projectsCarouselCounter) {
    projectsCarouselCounter.textContent = `${projectsCarouselIndex + 1} / ${projectsCarouselCount}`;
  }
  projectsCarouselDots.forEach((dot, index) => {
    dot.classList.toggle("is-active", index === projectsCarouselIndex);
  });
}

function moveProjectsCarousel(step) {
  if (projectsCarouselCount < 2) {
    return;
  }

  projectsCarouselIndex =
    (projectsCarouselIndex + step + projectsCarouselCount) % projectsCarouselCount;
  updateProjectsCarousel();
}

function goToProjectSlide(index) {
  if (index < 0 || index >= projectsCarouselCount) {
    return;
  }

  projectsCarouselIndex = index;
  updateProjectsCarousel();
}

function setupProjectsCarousel() {
  const projectsCarousel = document.querySelector("#projects-carousel");
  projectsCarouselViewport =
    projectsCarousel?.querySelector(".projects-carousel__viewport") || null;
  projectsCarouselTrack =
    projectsCarousel?.querySelector(".projects-carousel__track") || null;
  projectsCarouselCounter =
    projectsCarousel?.querySelector(".projects-carousel__counter") || null;
  projectsCarouselDots = Array.from(
    projectsCarousel?.querySelectorAll(".projects-carousel__dot") || []
  );
  projectsCarouselCount = projectsCarouselTrack?.children?.length || 0;
  projectsCarouselIndex = 0;

  if (
    !projectsCarousel ||
    !projectsCarouselViewport ||
    !projectsCarouselTrack ||
    projectsCarouselCount < 1
  ) {
    return;
  }

  projectsCarousel
    .querySelector('[data-projects-carousel="prev"]')
    ?.addEventListener("click", () => moveProjectsCarousel(-1));
  projectsCarousel
    .querySelector('[data-projects-carousel="next"]')
    ?.addEventListener("click", () => moveProjectsCarousel(1));
  projectsCarouselDots.forEach((dot) => {
    dot.addEventListener("click", () => {
      const slideIndex = Number(dot.dataset.projectSlide);
      goToProjectSlide(slideIndex);
    });
  });
  window.addEventListener("resize", updateProjectsCarousel, { passive: true });
  updateProjectsCarousel();
}

function attachHeroActionButtons() {
  heroActionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.dataset.scrollTarget;
      const target = document.getElementById(targetId);
      if (!target) {
        return;
      }

      setPendingChapter(targetId);
      const targetY = window.scrollY + target.getBoundingClientRect().top - 18;
      animatedScrollTo(targetY, targetId);
    });
  });
}

function setupScrollReactiveSidebar() {
  if (!sidebar) {
    return;
  }

  let ticking = false;

  function updateSidebarState() {
    ticking = false;
    if (window.matchMedia("(max-width: 900px)").matches) {
      sidebar.classList.remove("is-collapsed");
      return;
    }

    const hideOnlyAtTop = window.scrollY <= 8;
    sidebar.classList.toggle("is-collapsed", hideOnlyAtTop);
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        requestAnimationFrame(updateSidebarState);
        ticking = true;
      }
    },
    { passive: true }
  );

  window.addEventListener("resize", updateSidebarState, { passive: true });
  updateSidebarState();
}

function setupSectionReveals() {
  const motionTargets = Array.from(
    document.querySelectorAll(
      ".section-block, .experience-list article, .history-list article"
    )
  );
  if (!motionTargets.length) {
    return;
  }

  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  if (prefersReduced) {
    motionTargets.forEach((target) => target.classList.add("is-visible"));
    return;
  }

  motionTargets.forEach((target, index) => {
    target.classList.add("motion-reveal");
    target.style.setProperty("--reveal-delay", `${Math.min(index * 0.02, 0.12)}s`);
  });

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -4% 0px" }
  );

  motionTargets.forEach((target) => revealObserver.observe(target));
}

function setupHeroParallax() {
  if (!hero || !heroContent) {
    return;
  }

  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  if (prefersReduced) {
    return;
  }

  let ticking = false;
  function applyParallax() {
    ticking = false;
    const heroRect = hero.getBoundingClientRect();
    const viewport = window.innerHeight || 1;
    const progress = Math.min(
      1,
      Math.max(0, (viewport - heroRect.top) / (viewport + heroRect.height))
    );

    heroContent.style.transform = `translate3d(0, ${progress * -20}px, 0)`;
    if (heroOrbA) {
      heroOrbA.style.transform = `translate3d(${progress * 20}px, ${progress * 28}px, 0)`;
    }
    if (heroOrbB) {
      heroOrbB.style.transform = `translate3d(${progress * -16}px, ${progress * -18}px, 0)`;
    }
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        requestAnimationFrame(applyParallax);
        ticking = true;
      }
    },
    { passive: true }
  );
  applyParallax();
}

function setActiveChapter(targetId) {
  const activeElement = document.getElementById(targetId);
  const parentSectionId = activeElement?.closest("[data-section]")?.id;

  chapterLinks.forEach((link) => {
    const linkTarget = link.dataset.target;
    const isMainParent =
      link.dataset.level === "main" && parentSectionId === linkTarget;
    const isDirect = linkTarget === targetId;
    link.classList.toggle("is-active", isDirect || isMainParent);
  });
}

function setPendingChapter(targetId) {
  pendingTargetId = targetId;
  chapterLinks.forEach((link) => {
    link.classList.toggle("is-pending", link.dataset.target === targetId);
  });
}

function clearPendingChapter() {
  pendingTargetId = null;
  chapterLinks.forEach((link) => {
    link.classList.remove("is-pending");
  });
}

function easeInOutQuad(progress) {
  return progress < 0.5
    ? 2 * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 2) / 2;
}

function animatedScrollTo(targetY, targetId) {
  if (activeScrollRaf) {
    cancelAnimationFrame(activeScrollRaf);
    activeScrollRaf = null;
  }

  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  if (prefersReduced) {
    window.scrollTo(0, targetY);
    if (targetId && pendingTargetId === targetId) {
      clearPendingChapter();
      setActiveChapter(targetId);
    }
    return;
  }

  const startY = window.scrollY;
  const distance = targetY - startY;
  const duration = Math.min(950, Math.max(450, Math.abs(distance) * 0.6));
  const startTime = performance.now();

  function step(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeInOutQuad(progress);
    window.scrollTo(0, startY + distance * eased);
    if (progress < 1) {
      activeScrollRaf = requestAnimationFrame(step);
    } else {
      activeScrollRaf = null;
      if (targetId && pendingTargetId === targetId) {
        clearPendingChapter();
        setActiveChapter(targetId);
      }
    }
  }

  activeScrollRaf = requestAnimationFrame(step);
}

function setupChapterNavigation() {
  chapterLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();

      const targetId = link.dataset.target;
      const target = document.getElementById(targetId);
      if (!target) {
        return;
      }

      setPendingChapter(targetId);
      const targetY = window.scrollY + target.getBoundingClientRect().top - 18;
      animatedScrollTo(targetY, targetId);
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort(
          (a, b) =>
            Math.abs(a.boundingClientRect.top - 140) -
            Math.abs(b.boundingClientRect.top - 140)
        )[0];
      if (visible?.target?.id) {
        setActiveChapter(visible.target.id);
      }

      if (pendingTargetId) {
        const pendingNode = document.getElementById(pendingTargetId);
        if (!pendingNode) {
          clearPendingChapter();
          return;
        }

        const isReached =
          visible?.target?.id === pendingTargetId ||
          Math.abs(pendingNode.getBoundingClientRect().top - 18) < 22;
        if (isReached) {
          const reachedId = pendingTargetId;
          clearPendingChapter();
          setActiveChapter(reachedId);
        }
      }
    },
    {
      root: null,
      threshold: [0.2, 0.4, 0.6, 0.8],
      rootMargin: "-10% 0px -45% 0px",
    }
  );

  navNodes.forEach((node) => observer.observe(node));
}

async function loadPortfolioData() {
  const response = await fetch("projects.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Could not load projects.json (${response.status})`);
  }

  return response.json();
}

async function init() {
  entrySequenceTimeoutId = setTimeout(completeEntrySequence, 1600);
  window.addEventListener("load", completeEntrySequence, { once: true });

  try {
    const data = await loadPortfolioData();
    renderSkills(data.skills);
    renderFeaturedProjects(data.featuredProjects, data.otherProjectsCard);
    renderOtherProjects(data.otherProjects);
    modalTitle.textContent = data.otherProjectsCard.modalTitle;
    modalCopy.textContent = data.otherProjectsCard.modalDescription;
    attachModalOpenHandler();
    attachFeaturedProjectHandlers();
    setupProjectsCarousel();
    setupChapterNavigation();
    setupSectionReveals();
    window.SitewidePopups?.showSiteNotice(data.siteNotice);
  } catch (error) {
    skillsList.innerHTML = "<span>Unable to load skills</span>";
    projectGrid.innerHTML = "<p>Unable to load projects data.</p>";
    console.error(error);
  } finally {
    attachHeroActionButtons();
    setupScrollReactiveSidebar();
    setupHeroParallax();
    completeEntrySequence();
  }
}

closeButton.addEventListener("click", () => closeModal(otherProjectsModal));
closeFeaturedButton.addEventListener("click", () =>
  closeModal(featuredProjectModal)
);

[otherProjectsModal, featuredProjectModal].forEach((currentModal) => {
  if (!currentModal) {
    return;
  }
  currentModal.addEventListener("click", (event) => {
    if (event.target === currentModal) {
      closeModal(currentModal);
    }
  });
});

document.addEventListener("keydown", (event) => {
  if (!featuredProjectModal.hidden) {
    if (event.key === "Escape") {
      closeModal(featuredProjectModal);
      return;
    }
  }

  if (event.key === "Escape" && !otherProjectsModal.hidden) {
    closeModal(otherProjectsModal);
  }
});

window.SitewidePopups?.init({
  openModal,
  closeModal,
});

init();
