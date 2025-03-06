

$(function() {
	"use strict";

  // Tooltops

    $(function () {
        $('[data-bs-toggle="tooltip"]').tooltip();
    })



    $(".nav-toggle-icon").on("click", function() {
		$(".wrapper").toggleClass("toggled")
	})

    $(".mobile-toggle-icon").on("click", function() {
		$(".wrapper").addClass("toggled")
	})

	$(function() {
		for (var e = window.location, o = $(".metismenu li a").filter(function() {
				return this.href == e
			}).addClass("").parent().addClass("mm-active"); o.is("li");) o = o.parent("").addClass("mm-show").parent("").addClass("mm-active")
	})


	$(".toggle-icon").click(function() {
		$(".wrapper").hasClass("toggled") ? ($(".wrapper").removeClass("toggled"), $(".sidebar-wrapper").unbind("hover")) : ($(".wrapper").addClass("toggled"), $(".sidebar-wrapper").hover(function() {
			$(".wrapper").addClass("sidebar-hovered")
		}, function() {
			$(".wrapper").removeClass("sidebar-hovered")
		}))
	})



	$(function() {
		$("#menu").metisMenu()
	})


	$(".search-toggle-icon").on("click", function() {
		$(".top-header .navbar form").addClass("full-searchbar")
	})
	$(".search-close-icon").on("click", function() {
		$(".top-header .navbar form").removeClass("full-searchbar")
	})


	$(".chat-toggle-btn").on("click", function() {
		$(".chat-wrapper").toggleClass("chat-toggled")
	}), $(".chat-toggle-btn-mobile").on("click", function() {
		$(".chat-wrapper").removeClass("chat-toggled")
	}), $(".email-toggle-btn").on("click", function() {
		$(".email-wrapper").toggleClass("email-toggled")
	}), $(".email-toggle-btn-mobile").on("click", function() {
		$(".email-wrapper").removeClass("email-toggled")
	}), $(".compose-mail-btn").on("click", function() {
		$(".compose-mail-popup").show()
	}), $(".compose-mail-close").on("click", function() {
		$(".compose-mail-popup").hide()
	})


	$(document).ready(function() {
		$(window).on("scroll", function() {
			$(this).scrollTop() > 300 ? $(".back-to-top").fadeIn() : $(".back-to-top").fadeOut()
		}), $(".back-to-top").on("click", function() {
			return $("html, body").animate({
				scrollTop: 0
			}, 600), !1
		})
	})


	// switcher 

	$("#LightTheme").on("click", function() {
		$("html").attr("class", "light-theme")
	}),

	$("#DarkTheme").on("click", function() {
		$("html").attr("class", "dark-theme")
	}),

	$("#SemiDarkTheme").on("click", function() {
		$("html").attr("class", "semi-dark")
	}),

	$("#MinimalTheme").on("click", function() {
		$("html").attr("class", "minimal-theme")
	})


	$("#headercolor1").on("click", function() {
		$("html").addClass("color-header headercolor1"), $("html").removeClass("headercolor2 headercolor3 headercolor4 headercolor5 headercolor6 headercolor7 headercolor8")
	}), $("#headercolor2").on("click", function() {
		$("html").addClass("color-header headercolor2"), $("html").removeClass("headercolor1 headercolor3 headercolor4 headercolor5 headercolor6 headercolor7 headercolor8")
	}), $("#headercolor3").on("click", function() {
		$("html").addClass("color-header headercolor3"), $("html").removeClass("headercolor1 headercolor2 headercolor4 headercolor5 headercolor6 headercolor7 headercolor8")
	}), $("#headercolor4").on("click", function() {
		$("html").addClass("color-header headercolor4"), $("html").removeClass("headercolor1 headercolor2 headercolor3 headercolor5 headercolor6 headercolor7 headercolor8")
	}), $("#headercolor5").on("click", function() {
		$("html").addClass("color-header headercolor5"), $("html").removeClass("headercolor1 headercolor2 headercolor4 headercolor3 headercolor6 headercolor7 headercolor8")
	}), $("#headercolor6").on("click", function() {
		$("html").addClass("color-header headercolor6"), $("html").removeClass("headercolor1 headercolor2 headercolor4 headercolor5 headercolor3 headercolor7 headercolor8")
	}), $("#headercolor7").on("click", function() {
		$("html").addClass("color-header headercolor7"), $("html").removeClass("headercolor1 headercolor2 headercolor4 headercolor5 headercolor6 headercolor3 headercolor8")
	}), $("#headercolor8").on("click", function() {
		$("html").addClass("color-header headercolor8"), $("html").removeClass("headercolor1 headercolor2 headercolor4 headercolor5 headercolor6 headercolor7 headercolor3")
	})


	new PerfectScrollbar(".header-message-list")
    new PerfectScrollbar(".header-notifications-list")



	
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
$("#Cvv").on("input", function () {
    var value = $(this).val().replace(/\D/g, ''); // Remove non-numeric characters
    $(this).val(value);
});

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

$.validator.addMethod("validate_email_MAHI", function (value, element) {
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

// this is for tabs input require hidden
$.validator.setDefaults({
  ignore: function(index, element) {
      // Check if the element's parent (or any ancestor) has display: none
      return $(element).closest('div:hidden').length > 0;
  }
});

// additional validator common methods  end
// -----------------------------------------------------------------------------

$(document).on("input", ".numberkey", function() {
    var inputVal = $(this).val();
    $(this).val(inputVal.replace(/\D/g, ""));
});

$(document).ready(function() {
    var slider = $("#range"),
      output = $("#output");

    output.text(slider.val());
    slider.on("input", function() {
      output.text(slider.val());
    });
  });

});