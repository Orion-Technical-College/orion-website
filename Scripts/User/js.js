
/**
   * Mobile nav toggle
   */

const mobileNavShow = document.querySelector('.mobile-nav-show');
const mobileNavHide = document.querySelector('.mobile-nav-hide');

document.querySelectorAll('.mobile-nav-toggle').forEach(el => {
  el.addEventListener('click', function(event) {
    event.preventDefault();
    mobileNavToogle();
  })
});

function mobileNavToogle() {
  document.querySelector('body').classList.toggle('mobile-nav-active');
  mobileNavShow.classList.toggle('d-none');
  mobileNavHide.classList.toggle('d-none');
}

/**
 * Hide mobile nav on same-page/hash links
 */
document.querySelectorAll('#navbar a').forEach(navbarlink => {

  if (!navbarlink.hash) return;

  let section = document.querySelector(navbarlink.hash);
  if (!section) return;

  navbarlink.addEventListener('click', () => {
    if (document.querySelector('.mobile-nav-active')) {
      mobileNavToogle();
    }
  });

});

/**
 * Toggle mobile nav dropdowns
 */
const navDropdowns = document.querySelectorAll('.navbar .menu-item-has-children > a');

navDropdowns.forEach(el => {
  el.addEventListener('click', function(event) {
    if (document.querySelector('.mobile-nav-active')) {
      const indicator = this.querySelector('.dropdown-indicator');

      if (event.target !== indicator) {
        // Clicked on the anchor tag, navigate to its href
        return;
      }

      event.preventDefault();

      // Toggle the 'active' class on the indicator
      indicator.classList.toggle('bi-chevron-up');
      indicator.classList.toggle('bi-chevron-down');

      // Toggle the 'dropdown-active' class on the next 'ul' element (sub-menu)
      const subMenu = this.parentElement.querySelector('.sub-menu');
      if (subMenu) {
        subMenu.classList.toggle('dropdown-active');
      }
    }
  });
});

// Upcoming events

$('.ue-events').owlCarousel({  
    margin: 15,
    autoplay: true,
    loop:true,
    autoplayTimeout: 5000,
    smartSpeed: 1000,
    nav: false,
    dots: false,
    // navText:["<img src='content/images/left-arrow.png'>","<img src='content/images/right-arrow.png'>"],
    navText:['<span class="carousel-control-next-icon"></span>','<span class="carousel-control-next-icon"></span>'],
    responsive: {
        0: {
            items:1
        },
        640: {
            items:2,
			 margin: 10,
        },
        991: {
            items:2
        },
        1024: {
            items:2
        },

    }
});

// Gallery section
$('.gallery-owl').owlCarousel({  
    margin: 15,
    autoplay: true,
    loop:true,
    autoplayTimeout: 5000,
    smartSpeed: 1000,
    nav: true,
    dots: false,
    navText:['<span class="carousel-control-prev-icon"></span>','<span class="carousel-control-next-icon"></span>'],

    // navText:["<img src='content/images/left-arrow.png'>","<img src='content/images/right-arrow.png'>"],
    responsive: {
        0: {
            items: 2,
             margin: 7,
        },
        700: {
            items:3,
			 margin: 10,
        },
        991: {
            items: 3
        },
        1024: {
            items: 3
        },

    }
});





$(document).ready(function() {
    // Initialize Magnific Popup
    $('#video-gallery').magnificPopup({
      delegate: 'a',
      type: 'iframe',
      iframe: {
        patterns: {
          youtube: {
            index: 'youtu',
            id: function(url) {
              // Extract video ID from URL
              var match = url.match(/[^\w-]([-\w]{11})[^-\w]?/);
              if (match && match[1]) {
                return match[1];
              }
            },
            src: 'https://www.youtube.com/embed/%id%?autoplay=1'
          },
          vimeo: {
            index: 'vimeo.com/',
            id: '/',
            src: 'https://player.vimeo.com/video/%id%?autoplay=1'
          }
          // Add more patterns for other video platforms if needed
        }
      },
      gallery: {
        enabled: true
      }
    });
  });




// Sponser ticker

$('.aws-ticker1').easyTicker({
	direction: 'up',
	easing: 'swing',
	speed: 'slow',
	interval: 2000,
	height: 'auto',
	margin:5,
	visible:1,
	mousePause: 1,
	controls: {
		up: '',
		down: '',
		toggle: '',
		playText: 'Play',
		stopText: 'Stop'
	}
});
$('.aws-ticker2').easyTicker({
	direction: 'up',
	easing: 'swing',
	speed: 'slow',
	interval: 2000,
	height: 'auto',
	margin:5,
	visible:2,
	controls: {
		up: '',
		down: '',
		toggle: '',
		playText: 'Play',
		stopText: 'Stop'
	}
});
$('.aws-ticker3').easyTicker({
	direction: 'up',
	easing: 'swing',
	speed: 'slow',
	interval: 2000,
	height: 'auto',
	margin:5,
	visible:3,
	controls: {
		up: '',
		down: '',
		toggle: '',
		playText: 'Play',
		stopText: 'Stop'
	}
});
$('.aws-ticker4').easyTicker({
	direction: 'up',
	easing: 'swing',
	speed: 'slow',
	interval: 2000,
	height: 'auto',
	margin:5,
	visible:4,
	mousePause: 2,
	controls: {
		up: '',
		down: '',
		toggle: '',
		playText: 'Play',
		stopText: 'Stop'
	}
});

// NEWS SCROLL CODE
$(function () {
    $('.news').easyTicker({
        visible: 1,

        interval: 3000
    });
});