document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  /* =========================================
     1. CINEMATIC VIDEO INTRO
     ========================================= */
  (() => {
    const intro = document.getElementById("intro");
    const video = document.getElementById("introVideo");
    const skipButton = document.getElementById("skipIntro");
    const transition = document.getElementById("introTransition");

    if (!intro) {
      document.body.classList.add("intro-finished");
      return;
    }

    let finished = false;
    let fallbackTimer;
    let removeTimer;
    let transitionTimer;

    function hideIntro() {
      if (!intro.isConnected) return;

      intro.classList.add("is-leaving");

      // Reveal the homepage fish only after the intro is removed.
      removeTimer = window.setTimeout(() => {
        intro.remove();
        document.body.classList.add("intro-finished");
      }, 1200);
    }

    function finishIntro(withSplash = false) {
      if (finished) return;
      finished = true;

      clearTimeout(fallbackTimer);
      clearTimeout(removeTimer);
      clearTimeout(transitionTimer);

      if (skipButton) skipButton.disabled = true;

      if (video) {
        video.pause();
      }

      if (withSplash && transition) {
        transition.classList.add("splash-transition");
        transitionTimer = window.setTimeout(hideIntro, 450);
      } else {
        hideIntro();
      }
    }

    if (skipButton) {
      skipButton.addEventListener("click", () => finishIntro(false));
    }

    if (video) {
      video.muted = true;
      video.playsInline = true;

      video.addEventListener(
        "ended",
        () => finishIntro(true),
        { once: true }
      );

      video.addEventListener(
        "error",
        () => finishIntro(false),
        { once: true }
      );

      try {
        const playPromise = video.play();

        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(() => {
            // The skip button and fallback remain available.
          });
        }
      } catch (error) {
        // Fallback below prevents a permanently blocked intro.
      }

      // Safety fallback for long or stalled videos.
      fallbackTimer = window.setTimeout(() => {
        finishIntro(false);
      }, 15000);
    } else {
      finishIntro(false);
    }
  })();


  /* =========================================
     2. RESPONSIVE MOBILE NAVIGATION
     ========================================= */
  const menuButton = document.getElementById("menuToggle");
  const navigation = document.getElementById("navigation");

  if (menuButton && navigation) {
    menuButton.setAttribute("aria-expanded", "false");

    menuButton.addEventListener("click", () => {
      const isOpen = navigation.classList.toggle("active");
      menuButton.setAttribute("aria-expanded", String(isOpen));
    });

    navigation.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navigation.classList.remove("active");
        menuButton.setAttribute("aria-expanded", "false");
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        navigation.classList.remove("active");
        menuButton.setAttribute("aria-expanded", "false");
      }
    });

    document.addEventListener("click", (event) => {
      if (
        navigation.classList.contains("active") &&
        !navigation.contains(event.target) &&
        !menuButton.contains(event.target)
      ) {
        navigation.classList.remove("active");
        menuButton.setAttribute("aria-expanded", "false");
      }
    });
  }


  /* =========================================
     3. STICKY HEADER
     ========================================= */
  const header = document.getElementById("siteHeader");

  function updateHeader() {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 40);
  }

  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();

/* =========================================
   GLOBAL MOUSE-FOLLOW FISH
   ========================================= */
(() => {
  const fish = document.getElementById("cursorFish");

  if (!fish) return;

  // Respect reduced-motion preferences.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  // Use only for mouse/trackpad devices.
  if (window.matchMedia("(hover: none), (pointer: coarse)").matches) {
    return;
  }

  let mouseX = -100;
  let mouseY = -100;
  let fishX = -100;
  let fishY = -100;
  let lastX = -100;
  let lastY = -100;
  let pointerActive = false;
  let frameId = null;

  const offsetX = 18;
  const offsetY = 18;

  function onPointerMove(event) {
    if (event.pointerType !== "mouse" &&
        event.pointerType !== "pen") {
      return;
    }

    mouseX = event.clientX;
    mouseY = event.clientY;
    pointerActive = true;

    fish.classList.add("is-visible");

    if (frameId === null) {
      frameId = requestAnimationFrame(animateFish);
    }
  }

  function animateFish() {
    frameId = null;

    // Smoothly follow the pointer instead of snapping to it.
    fishX += (mouseX - fishX) * 0.16;
    fishY += (mouseY - fishY) * 0.16;

    const dx = mouseX - lastX;
    const dy = mouseY - lastY;

    // Turn toward the direction of travel.
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);

    if (!Number.isFinite(angle)) angle = 0;

    fish.style.transform =
      `translate3d(${fishX + offsetX}px, ${fishY + offsetY}px, 0) ` +
      `rotate(${angle}deg)`;

    lastX = mouseX;
    lastY = mouseY;

    const stillMoving =
      Math.abs(mouseX - fishX) > 0.5 ||
      Math.abs(mouseY - fishY) > 0.5;

    if (pointerActive && stillMoving) {
      frameId = requestAnimationFrame(animateFish);
    }
  }

  function onPointerLeave() {
    pointerActive = false;
    fish.classList.remove("is-visible");

    if (frameId !== null) {
      cancelAnimationFrame(frameId);
      frameId = null;
    }
  }

  document.addEventListener("pointermove", onPointerMove, {
    passive: true
  });

  document.addEventListener("pointerleave", onPointerLeave);
  window.addEventListener("blur", onPointerLeave);

  // Hide the fish while the browser tab is inactive.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) onPointerLeave();
  });
})();
  /* =========================================
     4. SCROLL REVEAL
     ========================================= */
  const revealElements = document.querySelectorAll(".reveal");
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if ("IntersectionObserver" in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    revealElements.forEach((element) => {
      revealObserver.observe(element);
    });
  } else {
    revealElements.forEach((element) => {
      element.classList.add("visible");
    });
  }


  /* =========================================
     5. PRODUCT ENQUIRY BUTTONS
     ========================================= */
  document.querySelectorAll("[data-product]").forEach((button) => {
    button.addEventListener("click", () => {
      const productSelect = document.getElementById("fishVariety");
      const enquirySection = document.getElementById("enquiry");

      if (!productSelect || !enquirySection) return;

      const product = button.dataset.product;

      const matchingOption = Array.from(productSelect.options).find(
        (option) => option.value === product
      );

      if (matchingOption) {
        productSelect.value = product;
        productSelect.dispatchEvent(
          new Event("change", { bubbles: true })
        );
      }

      enquirySection.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start"
      });
    });
  });


  /* =========================================
     6. WHOLESALE ENQUIRY → WHATSAPP
     ========================================= */
  const enquiryForm = document.getElementById("enquiryForm");

  if (enquiryForm) {
    enquiryForm.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!enquiryForm.reportValidity()) return;

      const formData = new FormData(enquiryForm);

      const name = String(formData.get("name") || "").trim();
      const phone = String(formData.get("phone") || "").trim();
      const product = String(formData.get("product") || "").trim();
      const quantity = String(formData.get("quantity") || "").trim();
      const location = String(formData.get("location") || "").trim();

      /*
       * IMPORTANT:
       * Replace the placeholder with your real WhatsApp number.
       * Use country code and digits only.
       * Example format for India: 91XXXXXXXXXX
       */
      const whatsappNumber = "91XXXXXXXXXX";

      if (
        whatsappNumber.includes("X") ||
        !/^\d{10,15}$/.test(whatsappNumber)
      ) {
        alert(
          "Please configure the Leena Traders WhatsApp number " +
          "in script.js before sending enquiries."
        );
        return;
      }

      const message = [
        "Hello Leena Traders!",
        "I would like to enquire about wholesale fish supply.",
        "",
        `Name: ${name}`,
        `Contact number: ${phone}`,
        `Fish variety: ${product}`,
        `Required quantity: ${quantity}`,
        `Delivery location: ${location}`
      ].join("\n");

      const whatsappURL =
        "https://wa.me/" +
        whatsappNumber +
        "?text=" +
        encodeURIComponent(message);

      // Open WhatsApp in a new tab after a valid submission.
      const whatsappWindow = window.open(
        whatsappURL,
        "_blank",
        "noopener,noreferrer"
      );

      // Fallback when the browser blocks the new tab.
      if (!whatsappWindow) {
        window.location.href = whatsappURL;
      }
    });
  }


  /* =========================================
     7. COPYRIGHT YEAR
     ========================================= */
  const yearElement = document.getElementById("currentYear");

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }


  /* =========================================
     8. INTERACTIVE 3D-STYLE FISH
     Homepage only; never modifies intro video.
     ========================================= */
  (() => {
    const hero = document.getElementById("home");
    const fish = document.getElementById("heroFish");
    const layer = document.getElementById("heroFishLayer");
    const light = layer?.querySelector(".fish-light");

    if (!hero || !fish || !layer) return;

    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let animationFrame = null;

    function render() {
      const fishX = currentX * 55;
      const fishY = currentY * 35;
      const tiltY = currentX * 17;
      const tiltX = -currentY * 10;
      const roll = currentX * 4;

      // Only the fish receives this transform.
      // The intro video and hero background are untouched.
      fish.style.transform =
        `translate3d(${fishX}px, ${fishY}px, 35px) ` +
        `rotateY(${tiltY - 12}deg) ` +
        `rotateX(${tiltX}deg) ` +
        `rotateZ(${roll - 4}deg)`;

      if (light) {
        light.style.transform =
          `translate(calc(-50% + ${fishX * 0.6}px), ` +
          `calc(-50% + ${fishY * 0.6}px))`;
      }
    }

    function animate() {
      animationFrame = null;

      currentX += (targetX - currentX) * 0.075;
      currentY += (targetY - currentY) * 0.075;

      render();

      const stillMoving =
        Math.abs(targetX - currentX) > 0.002 ||
        Math.abs(targetY - currentY) > 0.002;

      if (stillMoving) {
        animationFrame = requestAnimationFrame(animate);
      }
    }

    function updatePointer(event) {
      // Do not move the homepage fish during the intro.
      if (document.getElementById("intro")) return;

      const rect = hero.getBoundingClientRect();

      if (!rect.width || !rect.height) return;

      targetX = Math.max(
        -1,
        Math.min(
          1,
          ((event.clientX - rect.left) / rect.width - 0.5) * 2
        )
      );

      targetY = Math.max(
        -1,
        Math.min(
          1,
          ((event.clientY - rect.top) / rect.height - 0.5) * 2
        )
      );

      if (motionPreference.matches) {
        currentX = targetX;
        currentY = targetY;
        render();
        return;
      }

      if (animationFrame === null) {
        animationFrame = requestAnimationFrame(animate);
      }
    }

    function resetPointer() {
      targetX = 0;
      targetY = 0;

      if (motionPreference.matches) {
        currentX = 0;
        currentY = 0;
        render();
        return;
      }

      if (animationFrame === null) {
        animationFrame = requestAnimationFrame(animate);
      }
    }

    hero.addEventListener("pointermove", updatePointer, {
      passive: true
    });

    hero.addEventListener("pointerleave", resetPointer);

    // Support finger movement on touch devices.
    hero.addEventListener(
      "pointerdown",
      (event) => {
        if (event.pointerType === "touch") {
          updatePointer(event);
        }
      },
      { passive: true }
    );

    render();
  })();

});