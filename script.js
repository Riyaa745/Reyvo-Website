const launchDate = new Date("2026-08-15T09:00:00+05:30").getTime();
const siteHeader = document.querySelector(".site-header");

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

function updateCountdown() {
  if (!daysEl || !hoursEl || !minutesEl) return;
  const now = Date.now();
  const distance = Math.max(0, launchDate - now);
  const day = 1000 * 60 * 60 * 24;
  const hour = 1000 * 60 * 60;
  const minute = 1000 * 60;

  daysEl.textContent = String(Math.floor(distance / day)).padStart(2, "0");
  hoursEl.textContent = String(Math.floor((distance % day) / hour)).padStart(2, "0");
  minutesEl.textContent = String(Math.floor((distance % hour) / minute)).padStart(2, "0");
}

updateCountdown();
setInterval(updateCountdown, 1000);

function updateHeaderStyle() {
  if (!siteHeader) return;
  siteHeader.classList.toggle("is-scrolled", window.scrollY > 40);
}

updateHeaderStyle();
window.addEventListener("scroll", updateHeaderStyle, { passive: true });

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
let memberCount = 340;
const signupEndpoint = "signup.php";

function renderCount() {
  countNodes.forEach((node) => {
    node.textContent = `${memberCount}+`;
  });
}

async function loadMemberCount() {
  try {
    const response = await fetch(signupEndpoint, { cache: "no-store" });
    const data = await response.json();
    if (data.ok && Number.isFinite(Number(data.count))) {
      memberCount = Number(data.count);
      renderCount();
    }
  } catch (error) {
    renderCount();
  }
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
      button.textContent = "You're in";
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
