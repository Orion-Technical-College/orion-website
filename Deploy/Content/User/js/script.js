

(function ($) {
    "use strict";

    if ($(".ds2").length && $(".mobile-nav__container").length) {
        let navContent = document.querySelector(".ds2").innerHTML;
        let mobileNavContainer = document.querySelector(".mobile-nav__container");
        mobileNavContainer.innerHTML = navContent;
      }
      if ($(".mobile-nav__container .main-menu__list").length) {
        let dropdownAnchor = $(
          ".mobile-nav__container .main-menu__list .menu-item-has-children > a"
        );
        dropdownAnchor.each(function () {
          let self = $(this);
          let toggleBtn = document.createElement("BUTTON");
          toggleBtn.setAttribute("aria-label", "dropdown toggler");
          toggleBtn.innerHTML = "<i class='bi bi-chevron-down'></i>";
          self.append(function () {
            return toggleBtn;
          });
          self.find("button").on("click", function (e) {
            e.preventDefault();
            let self = $(this);
            self.toggleClass("expanded");
            self.parent().toggleClass("expanded");
            self.parent().parent().children("ul").slideToggle();
          });
        });
      }
    
      //Show Popup menu
      $(document).on("click", ".megamenu-clickable--toggler > a", function (e) {
        $("body").toggleClass("megamenu-popup-active");
        $(this).parent().find("ul").toggleClass("megamenu-clickable--active");
        e.preventDefault();
      });
      $(document).on("click", ".megamenu-clickable--close", function (e) {
        $("body").removeClass("megamenu-popup-active");
        $(".megamenu-clickable--active").removeClass("megamenu-clickable--active");
        e.preventDefault();
      });
    
      if ($(".mobile-nav__toggler").length) {
        $(".mobile-nav__toggler").on("click", function (e) {
          e.preventDefault();
          $(".mobile-nav__wrapper").toggleClass("expanded");
          $("body").toggleClass("locked");
        });
      }
      if ($(".wow").length) {
        var wow = new WOW({
          boxClass: "wow", // animated element css class (default is wow)
          animateClass: "animated", // animation css class (default is animated)
          mobile: true, // trigger animations on mobile devices (default is true)
          live: true // act on asynchronously loaded content (default is true)
        });
        wow.init();
      }
      // Select all service cards
const serviceCards = document.querySelectorAll('.service_card');

// Add event listeners to each card
serviceCards.forEach(card => {
  // Mouse enter - reset rotation and scale
  card.addEventListener('mouseenter', () => {
    gsap.to(card, {
      scale: 1.05,
      duration: 0.3,
      ease: 'power3.out',
    });
  });

  // Mouse move - rotate the card based on mouse position
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left; // Mouse X relative to the card
    const y = e.clientY - rect.top; // Mouse Y relative to the card

    const rotateX = ((y / rect.height) - 0.5) * 20; // Calculate rotation for X-axis
    const rotateY = ((x / rect.width) - 0.5) * -20; // Calculate rotation for Y-axis

    gsap.to(card, {
      rotationX: rotateX,
      rotationY: rotateY,
      transformPerspective: 1000,
      duration: 0.3,
      ease: 'power3.out',
    });
  });

  // Mouse leave - reset transform
  card.addEventListener('mouseleave', () => {
    gsap.to(card, {
      scale: 1,
      rotationX: 0,
      rotationY: 0,
      duration: 0.3,
      ease: 'power3.out',
    });
  });
});

})(jQuery);

// //////////////////////
$(window).scroll(function(){
  if ($(this).scrollTop() > 100) {
     $('header').addClass('newClass');
  } else {
     $('header').removeClass('newClass');
  }
});


