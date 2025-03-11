$(document).ready(function() { 
    $('a.btn-gallery').on('click', function(event) {
    event.preventDefault();
    
    var gallery = $(this).attr('href');
    
    $(gallery).magnificPopup({
      delegate: 'a',
      type:'image',
      gallery: {
        enabled: true
      }
    }).magnificPopup('open');
  });
  
  });
  $(function() {
    // Move the em tag with class "loading" after the fieldset element
    $("fieldset").after($(".error.help-block"));
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
$(document).ready(function () {

    $.validator.addMethod("validpassword", function (t, e) {
        return this.optional(e) || /^(?=.*\d+)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>])[0-9a-zA-Z!@#$%^&*(),.?":{}|<>]{8,}$/i.test(t)
    }, "Please enter minimum 8 charecters (atleast one special charecter & one numeric charecter).");
});
$(document).ready(function ($) {
    $('.numberkey').on('input', function () {
        var inputVal = $(this).val();
        $(this).val(inputVal.replace(/\D/g, ''));
    });
});
