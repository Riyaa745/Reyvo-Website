const launchDate = new Date("2026-08-15T09:00:00+05:30").getTime();
const siteHeader = document.querySelector(".site-header");
const isLandingPage = document.body.classList.contains("landing-page");

function applyBrandFont(root = document.body) {
  const brandPattern = /(?<![@\w.])reyvo(?![\w.-])/gi;
  const skipTags = new Set(["SCRIPT", "STYLE", "TEXTAREA", "INPUT", "SELECT", "OPTION"]);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || skipTags.has(parent.tagName) || parent.closest(".brand-word")) {
        return NodeFilter.FILTER_REJECT;
      }

      brandPattern.lastIndex = 0;
      return brandPattern.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });

  const brandNodes = [];
  while (walker.nextNode()) {
    brandNodes.push(walker.currentNode);
  }

  brandNodes.forEach((node) => {
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;

    node.nodeValue.replace(brandPattern, (match, offset) => {
      fragment.append(document.createTextNode(node.nodeValue.slice(lastIndex, offset)));

      const brandWord = document.createElement("span");
      brandWord.className = "brand-word";
      brandWord.textContent = match;
      fragment.append(brandWord);

      lastIndex = offset + match.length;
      return match;
    });

    fragment.append(document.createTextNode(node.nodeValue.slice(lastIndex)));
    node.replaceWith(fragment);
  });
}

applyBrandFont();

const daysEl = document.getElementById("days");
const hoursEl = document.getElementById("hours");
const minutesEl = document.getElementById("minutes");
const secondsEl = document.getElementById("seconds");
const countdownEchoNodes = {
  days: document.querySelectorAll('[data-countdown="days"]'),
  hours: document.querySelectorAll('[data-countdown="hours"]'),
  minutes: document.querySelectorAll('[data-countdown="minutes"]'),
  seconds: document.querySelectorAll('[data-countdown="seconds"]'),
};

function writeCountdownValue(nodes, value) {
  nodes.forEach((node) => {
    node.textContent = value;
  });
}

function updateCountdown() {
  const now = Date.now();
  const distance = Math.max(0, launchDate - now);
  const day = 1000 * 60 * 60 * 24;
  const hour = 1000 * 60 * 60;
  const minute = 1000 * 60;

  const days = String(Math.floor(distance / day)).padStart(2, "0");
  const hours = String(Math.floor((distance % day) / hour)).padStart(2, "0");
  const minutes = String(Math.floor((distance % hour) / minute)).padStart(2, "0");
  const seconds = String(Math.floor((distance % minute) / 1000)).padStart(2, "0");

  if (daysEl) daysEl.textContent = days;
  if (hoursEl) hoursEl.textContent = hours;
  if (minutesEl) minutesEl.textContent = minutes;
  if (secondsEl) secondsEl.textContent = seconds;
  writeCountdownValue(countdownEchoNodes.days, days);
  writeCountdownValue(countdownEchoNodes.hours, hours);
  writeCountdownValue(countdownEchoNodes.minutes, minutes);
  writeCountdownValue(countdownEchoNodes.seconds, seconds);
}

updateCountdown();
setInterval(updateCountdown, 1000);

function updateHeaderStyle() {
  if (!siteHeader) return;
  siteHeader.classList.toggle("is-scrolled", window.scrollY > 40);
}

updateHeaderStyle();
window.addEventListener("scroll", updateHeaderStyle, { passive: true });

if (isLandingPage && window.matchMedia("(pointer: fine)").matches) {
  const cursor = document.createElement("span");
  const cursorDot = document.createElement("span");
  cursor.className = "custom-cursor";
  cursorDot.className = "custom-cursor-dot";
  cursor.setAttribute("aria-hidden", "true");
  cursorDot.setAttribute("aria-hidden", "true");
  document.body.append(cursor, cursorDot);

  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let ringX = targetX;
  let ringY = targetY;
  let cursorStarted = false;

  function moveCursor() {
    ringX += (targetX - ringX) * 0.18;
    ringY += (targetY - ringY) * 0.18;
    cursor.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate3d(-50%, -50%, 0)`;
    cursorDot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate3d(-50%, -50%, 0)`;
    requestAnimationFrame(moveCursor);
  }

  requestAnimationFrame(moveCursor);

  window.addEventListener("mousemove", (event) => {
    targetX = event.clientX;
    targetY = event.clientY;
    if (!cursorStarted) {
      ringX = targetX;
      ringY = targetY;
      cursorStarted = true;
    }
    cursor.classList.add("is-visible");
    cursorDot.classList.add("is-visible");
  }, { passive: true });

  document.addEventListener("mouseover", (event) => {
    cursor.classList.toggle("is-hovering", Boolean(event.target.closest("a, button, input, select, textarea")));
  });

  document.addEventListener("mouseleave", () => {
    cursor.classList.remove("is-visible", "is-hovering");
    cursorDot.classList.remove("is-visible");
  });
}

const reveals = document.querySelectorAll(".reveal");
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.16 });

reveals.forEach((section) => observer.observe(section));

const signupForm = document.getElementById("signupForm");
const contactForm = document.getElementById("contactForm");
const countNodes = document.querySelectorAll("[data-count]");
const navCountCta = document.querySelector(".nav-count-cta");
let memberCount = 340;
const signupEndpoint = "signup.php";

function renderCount(count = memberCount) {
  countNodes.forEach((node) => {
    node.textContent = `${count}+`;
  });
  if (navCountCta && count >= 340) {
    navCountCta.textContent = `Join ${count}+ founders ->`;
  }
}

function animateMemberCount(target) {
  const start = 0;
  const duration = 1500;
  const startedAt = performance.now();

  function tick(now) {
    const progress = Math.min((now - startedAt) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    renderCount(Math.round(start + (target - start) * eased));
    if (progress < 1) {
      requestAnimationFrame(tick);
      return;
    }
    renderCount(target);
  }

  requestAnimationFrame(tick);
}

async function loadMemberCount() {
  try {
    const response = await fetch(signupEndpoint, { cache: "no-store" });
    const data = await response.json();
    if (data.ok && Number.isFinite(Number(data.count))) {
      memberCount = Number(data.count);
      animateMemberCount(memberCount);
      return;
    }
  } catch (error) {
    // Fall back to the base social proof count when the local endpoint is unavailable.
  }
  animateMemberCount(memberCount);
}

if (signupForm) {
  loadMemberCount();

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = signupForm.querySelector("button");
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = "Joining...";

    try {
      const response = await fetch(signupEndpoint, {
        method: "POST",
        body: new FormData(signupForm),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Something went wrong.");
      }

      memberCount = Number(data.count);
      renderCount();
      signupForm.reset();
      signupForm.classList.add("is-complete");
    } catch (error) {
      button.textContent = "Try again";
    } finally {
      setTimeout(() => {
        button.disabled = false;
        button.textContent = originalText;
      }, 2200);
    }
  });
} else {
  renderCount();
}

if (contactForm) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = contactForm.querySelector("button");
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = "Sending...";

    try {
      const response = await fetch(signupEndpoint, {
        method: "POST",
        body: new FormData(contactForm),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Something went wrong.");
      }

      contactForm.reset();
      button.textContent = "Message sent";
    } catch (error) {
      button.textContent = "Try again";
    } finally {
      setTimeout(() => {
        button.disabled = false;
        button.textContent = originalText;
      }, 2200);
    }
  });
}
