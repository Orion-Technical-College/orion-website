

$(document).ready(function () {
  $("a.btn-gallery").on("click", function (event) {
    event.preventDefault();

    var gallery = $(this).attr("href");

    $(gallery)
      .magnificPopup({
        delegate: "a",
        type: "image",
        gallery: {
          enabled: true,
        },
      })
      .magnificPopup("open");
  });
});
$(function () {
  // Move the em tag with class "loading" after the fieldset element
  $("fieldset").after($(".error.help-block"));
});
$(document).ready(function () {
  // Initialize Magnific Popup
  $("#video-gallery").magnificPopup({
    delegate: "a",
    type: "iframe",
    iframe: {
      patterns: {
        youtube: {
          index: "youtu",
          id: function (url) {
            // Extract video ID from URL
            var match = url.match(/[^\w-]([-\w]{11})[^-\w]?/);
            if (match && match[1]) {
              return match[1];
            }
          },
          src: "https://www.youtube.com/embed/%id%?autoplay=1",
        },
        vimeo: {
          index: "vimeo.com/",
          id: "/",
          src: "https://player.vimeo.com/video/%id%?autoplay=1",
        },
        // Add more patterns for other video platforms if needed
      },
    },
    gallery: {
      enabled: true,
    },
  });
});

$(document).ready(function() {
  $(document).on("input", ".numberkey", function() {
    var inputVal = $(this).val();
    $(this).val(inputVal.replace(/\D/g, ""));
});
});





// -----------------------------------------------------------------------------

// additional validator common methods start
  // Format credit card number with spaces every 4 digits
  $("#CardNumber").on("input", function () {
    var value = $(this).val().replace(/\D/g, ''); // Remove non-numeric characters
    if (value.length > 0) {
        value = value.match(new RegExp('.{1,4}', 'g')).join(' ');
    }
    $(this).val(value);
});

// Restrict CVV input to numbers only
//$("#Cvv").on("input", function () {
//    var value = $(this).val().replace(/\D/g, ''); // Remove non-numeric characters
//    $(this).val(value);
//});

// Custom method for CVV format
$.validator.addMethod("cvvformat", function (value, element) {
    // Check if the value consists of exactly 3 digits
    return /^\d{3}$/.test(value);
}, "Please enter a valid 3-digit CVV.");




$.validator.addMethod("validate_email", function(value, element) {
    if (value === "") {
      return true;
  }
  if (/^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/.test(value)) {
      return true;
  } else {
      return false;
  }
}, "Please enter a valid Email.");
$.validator.addMethod("validImageExtension", function (value, element) {
  if (element.files && element.files.length > 0) {
      var allowedExtensions = ["jpg", "png", "gif", "jpeg"];
      var fileName = element.files[0].name;
      var extension = fileName.split('.').pop().toLowerCase();
      return $.inArray(extension, allowedExtensions) !== -1;
  }
  return true;
}, "Only allowed extensions are: jpg, png, gif, jpeg");
$.validator.addMethod("valueNotEquals", function (value, element, arg) {
   return arg !== value;
}, "Value must not equal arg.");
$.validator.addMethod("creditcard", function (value, element) {
   // Remove spaces and dashes from the card number
   value = value.replace(/ /g, "").replace(/-/g, "");

   // The Luhn algorithm for credit card number validation
   var sum = 0;
   var shouldDouble = false;
   for (var i = value.length - 1; i >= 0; i--) {
       var digit = parseInt(value.charAt(i));

       if (shouldDouble) {
           digit *= 2;
           if (digit > 9) {
               digit -= 9;
           }
       }

       sum += digit;
       shouldDouble = !shouldDouble;
   }

   return sum % 10 === 0;
}, "Please enter a valid credit card number");
$.validator.addMethod("phoneFormat", function(value, element) {
  if (value === "") {
    return true;
}
   var phoneNumber = value.replace(/\D/g, '');
   var phoneNumberLength = phoneNumber.length;
   if (phoneNumberLength >= 3 && phoneNumberLength <= 6) {
       phoneNumber = phoneNumber.replace(/^(\d{3})(\d+)/, '$1-$2');
   } else if (phoneNumberLength > 6) {
       phoneNumber = phoneNumber.replace(/^(\d{3})(\d{3})(\d+)/, '$1-$2-$3');
   }
   $(element).val(phoneNumber);
   var pattern = /^\d{3}-\d{3}-\d{4}$/;
   return pattern.test(phoneNumber);
}, "Please enter format xxx-xxx-xxxx.");
$.validator.addMethod("alpha", function(value, element) {
    if (value === "") {
      return true;
  }
   var formattedText = value.replace(/[^a-zA-Z ]+/g, '').replace(/\s{2,}/g, ' ');
   $(element).val(formattedText);
   var pattern = /^[a-zA-Z]+( [a-zA-Z]+)*$/;
   return pattern.test(formattedText);
}, "Please enter only letters with a single space between words.");
$.validator.addMethod("validpassword", function (t, e) {
  return this.optional(e) || /^(?=.*\d+)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>])[0-9a-zA-Z!@#$%^&*(),.?":{}|<>]{8,}$/i.test(t)
}, "Enter Strong Password.");

// this is for tabs input require hidden
$.validator.setDefaults({
  ignore: function(index, element) {
      // Check if the element's parent (or any ancestor) has display: none
      return $(element).closest('div:hidden').length > 0;
  }
});

// additional validator common methods  end
// -----------------------------------------------------------------------------
