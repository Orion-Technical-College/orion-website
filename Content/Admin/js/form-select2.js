$(function() {
	"use strict";

    $('.single-select').select2({
        theme: 'bootstrap4',
        width: $(this).data('width') ? $(this).data('width') : $(this).hasClass('w-100') ? '100%' : 'style',
        placeholder: $(this).data('placeholder'),
        allowClear: Boolean($(this).data('allow-clear')),
    });
    //$('.m-single-select').select2({
    //    dropdownParent: $('.modal'),
    //    theme: 'bootstrap4',
    //    width: $(this).data('width') ? $(this).data('width') : $(this).hasClass('w-100') ? '100%' : 'style',
    //    placeholder: $(this).data('placeholder'),
    //    allowClear: Boolean($(this).data('allow-clear')),
    //});









    $('.multiple-select').select2({
        theme: 'bootstrap4',
        width: $(this).data('width') ? $(this).data('width') : $(this).hasClass('w-100') ? '100%' : 'style',
        placeholder: $(this).data('placeholder'),
        allowClear: Boolean($(this).data('allow-clear')),
    });




    $(document).on('shown.bs.modal', function (event) {
        var modal = $(event.target);
        modal.find('.m-single-select').each(function () {
            $(this).select2({
                dropdownParent: modal,
                theme: 'bootstrap4',
                width: $(this).data('width') ? $(this).data('width') : $(this).hasClass('w-100') ? '100%' : 'style',
                placeholder: $(this).data('placeholder'),
                allowClear: Boolean($(this).data('allow-clear')),
            });
        });
    });


});