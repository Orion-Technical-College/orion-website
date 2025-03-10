function googleTranslateElementInit() {
    new google.translate.TranslateElement({
      pageLanguage: 'en',
      includedLanguages: 'en,es',
      autoDisplay: false
    }, 'google_translate_element');
  }
  
  // Function to trigger Google Translate based on language code
  function changeLanguage(language) {
    var translateSelect = document.querySelector('.goog-te-combo');
    if (translateSelect) {
      translateSelect.value = language;
      translateSelect.dispatchEvent(new Event('change')); // Trigger the change event
    }
  }
  
  // Listen for clicks in the custom dropdown
  document.querySelectorAll('#languageSwitcher .set_lan').forEach(function(item) {
      item.addEventListener('click', function() {
          var selectedLanguage = this.getAttribute('data-lang');
          if (selectedLanguage) {
              changeLanguage(selectedLanguage);
          }
      });
  });
