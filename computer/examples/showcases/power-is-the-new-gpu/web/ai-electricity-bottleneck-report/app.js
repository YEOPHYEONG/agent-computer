const tabButtons = Array.from(document.querySelectorAll("[data-tab]"));
const tabPanels = Array.from(document.querySelectorAll("[data-panel]"));

function activateTab(target) {
  tabButtons.forEach((button) => {
    const isActive = button.dataset.tab === target;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  tabPanels.forEach((panel) => {
    const isActive = panel.dataset.panel === target;
    panel.classList.toggle("active", isActive);
    panel.hidden = !isActive;
  });
}

tabButtons.forEach((button) => {
  button.addEventListener("click", () => activateTab(button.dataset.tab));
});

function setupCardFilter(buttonSelector, cardSelector, buttonDataName, cardDataName, countSelector) {
  const buttons = Array.from(document.querySelectorAll(buttonSelector));
  const cards = Array.from(document.querySelectorAll(cardSelector));
  const countNode = countSelector ? document.querySelector(countSelector) : null;

  function applyFilter(filter) {
    let shown = 0;
    cards.forEach((card) => {
      const categories = (card.dataset[cardDataName] || "").split(/\s+/);
      const isShown = filter === "all" || categories.includes(filter);
      card.hidden = !isShown;
      if (isShown) shown += 1;
    });
    buttons.forEach((button) => {
      const buttonFilter = button.dataset[`${buttonDataName}Filter`];
      button.classList.toggle("active", buttonFilter === filter);
    });
    if (countNode) countNode.textContent = String(shown);
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      applyFilter(button.dataset[`${buttonDataName}Filter`]);
    });
  });
}

setupCardFilter("[data-ecosystem-filter]", "#ecosystem-grid [data-category]", "ecosystem", "category", "#ecosystem-count");
setupCardFilter("[data-signal-filter]", "#signal-list [data-signal]", "signal", "signal");

const sourceSearch = document.querySelector("#source-search");
const sourceCards = Array.from(document.querySelectorAll("#source-grid .source-card"));
const noResults = document.querySelector("#source-no-results");

if (sourceSearch) {
  sourceSearch.addEventListener("input", () => {
    const query = sourceSearch.value.trim().toLowerCase();
    let shown = 0;

    sourceCards.forEach((card) => {
      const haystack = `${card.dataset.source || ""} ${card.textContent || ""}`.toLowerCase();
      const isShown = query.length === 0 || haystack.includes(query);
      card.hidden = !isShown;
      if (isShown) shown += 1;
    });

    if (noResults) {
      noResults.hidden = shown !== 0;
    }
  });
}

const navLinks = Array.from(document.querySelectorAll(".side-nav a"));
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

if ("IntersectionObserver" in window && sections.length > 0) {
  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;

      navLinks.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === `#${visible.target.id}`);
      });
    },
    {
      rootMargin: "-18% 0px -68% 0px",
      threshold: [0.12, 0.22, 0.38]
    }
  );

  sections.forEach((section) => observer.observe(section));
}
