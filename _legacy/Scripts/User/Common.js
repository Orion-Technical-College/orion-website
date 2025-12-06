var Common = {

    ConvertDate: function (date) {
        var acutaldate = eval(date.replace(/\/Date\((.*?)\)\//gi, "new Date($1)"));
        var mmddyyyydate = acutaldate.getMonth() + 1 + "/" + acutaldate.getDate() + "/" + acutaldate.getFullYear();
        return mmddyyyydate;
    },

    ConvertDatetime: function (date) {
        var acutaldate = new Date(parseInt(date.substr(6)));
        var mmddyyyydate = acutaldate.getMonth() + 1 + "/" + acutaldate.getDate() + "/" + acutaldate.getFullYear() + " " + acutaldate.getHours() + ":" + acutaldate.getMinutes();
        return mmddyyyydate;
    },

    isExcel: function (url) {
        var extention = Common.getFileExtension(url);
        // available image extensions
        var available_ext = new Array('xlsx', 'xls');
        for (var i = 0; i < available_ext.length; i++) {
            if (extention == available_ext[i])
                return true;
        }
        return false;
    },

    isImage: function (url) {
        var extention = Common.getFileExtension(url);
        // available image extensions
        var available_ext = new Array('jpg', 'png', 'PNG', 'gif', 'jpeg', 'JPEG');
        for (var i = 0; i < available_ext.length; i++) {
            if (extention == available_ext[i])
                return true;
        }
        return false;
    },
    isDocument: function (url) {
        var extention = Common.getFileExtension(url);
        // available image extensions
        var available_ext = new Array('doc', 'docx', 'txt', 'xls', 'xlsx', 'pdf');
        for (var i = 0; i < available_ext.length; i++) {
            if (extention == available_ext[i])
                return true;
        }
        return false;
    },

    isCSV: function (url) {
        var extention = Common.getFileExtension(url);
        // available image extensions
        var available_ext = new Array('csv', 'CSV');
        for (var i = 0; i < available_ext.length; i++) {
            if (extention == available_ext[i])
                return true;
        }
        return false;
    },

    getFileExtension: function (filename) {
        var ext = /^.+\.([^.]+)$/.exec(filename);
        return ext == null ? "" : ext[1].toLowerCase();
    },

    ValidatePassword: function (value) {
        var aChar = /[A-Za-z]/;
        var aNumber = /[0-9]/;
        var Exsym = /[@#$%!^&*?]/
        if (value.length < 8 || value.length > 16 || value.search(aChar) == -1 || value.search(aNumber) == -1 || value.search(Exsym) == -1) {
            return false;
        }
        else {
            return true;
        }
    },

    Closebtn: function () {
        $('.closable').append('<span class="closelink" title="Close"></span>');
        $('.closelink').click(function () {
            $(this).parent().fadeOut('600', function () { $(this).remove(); });
        });
    },

    BtnDisable: function () {
        $('input[type=submit]').click(function (evt) {
            evt.preventDefault();
            var self = $(this);
            var frm = self.closest('form');
            frm.validate();
            if (frm.valid()) {
                frm.submit();
                self.attr('disabled', 'disabled');
                self.hide();
                //self.attr('value', 'Please wait....');
            }
        });
        $('input[type=button]').click(function (evt) {
            evt.preventDefault();
            var self = $(this);
            var frm = self.closest('form');
            frm.validate();
            if (frm.valid()) {
                frm.button();
                self.attr('disabled', 'disabled');
                self.hide();
                //self.attr('value', 'Please wait....');
            }
        });
    },

    Disable: function () {

        //$("#divload").show();

    },

    Pageno: function (page) {

        var pageno = '0';

        switch (page) {
            case "«":
                pageno = parseInt($("#hdnPageNo").val()) - 1;
                break;
            case "First":
                pageno = 1;
                break;
            case "»":
                pageno = parseInt($("#hdnPageNo").val()) + 1;
                break;
            case "Last":
                pageno = parseInt($("#TotalPages").val());
                break;
            default:
                pageno = page;
                break;
        }
        $('#hdnPageNo').val(pageno);
        return pageno;
    },
    Pageno1: function (page) {

        var pageno1 = '0';

        switch (page) {
            case "Previous":
                pageno1 = parseInt($("#hdnPageNo1").val()) - 1;
                break;
            case "Next":
                pageno1 = parseInt($("#hdnPageNo1").val()) + 1;
                break;
            default:
                pageno1 = page;
                break;
        }
        $('#hdnPageNo1').val(pageno1);
        return pageno1;
    },

    Pageno2: function (page, pageval) {

        var pageno = '0';

        switch (page) {
            case "Prev":
                pageno = parseInt($("#" + pageval).val()) - 1;
                break;
            case "Next":
                pageno = parseInt($("#" + pageval).val()) + 1;
                break;
            default:
                pageno = page;
                break;
        }
        $("#" + pageval).val(pageno);
        return pageno;
    },

    getCheckedRadio: function (Radio) {
        var rvalue = 0;
        var radioButtons = document.getElementsByName(Radio);
        for (var x = 0; x < radioButtons.length; x++) {
            if (radioButtons[x].checked) {
                rvalue = radioButtons[x].value;
            }
        }
        return rvalue;
    },

    CheckEmail: function (address) {
        if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(address)) {
            return (true)
        }
        return (false)
    },
    UploadDocument: function () {

        if ($('#ufile').val() != '') {

            $.ajaxFileUpload({
                url: 'Handlers/FileUpload.ashx?key=insert&subFolder=News',
                secureuri: false,
                fileElementId: 'ufile',
                dataType: 'json',
                success: function (data, status) {
                    $('#divDocmessage').html('<div class="success">Uploaded Document Successfully.</div>');
                    $('#ufile').val('');
                },
                error: function (data, status, e) {
                    $('#divDocmessage').html('<div class="success">Uploaded Document Successfully.</div>');
                    $('#ufile').val('');
                }
            }
	            )
        }
    },

    ValidateUpload: function () {

        if ($('#ctl00_CPH1_txtPhotoTitle').val() == "") { alert('Please Enter Title'); $('#ctl00_CPH1_txtPhotoTitle').focus(); return false; }
        if ($('#ctl00_CPH1_fuPhotoUpload').val() == "") { alert('Please Select File'); $('#ctl00_CPH1_fuPhotoUpload').focus(); return false; }
        return true;

    },

    AddPhoto: function (PageId) {
        $('#divBlog').hide();
        $('#divInteviews').hide();
        $('#divsearch').hide();
        $('#ctl00_CPH1_hdnPhotoId').val(PageId);
        $('#divPhoto').show();


    },
    selectAll: function (check, check1) {
        //var aa = document.getElementById('from2');
        var aa = document.getElementsByName(check);
        var aa1 = document.getElementsByName(check1);
        aa1[0].checked = true;
        for (var i = 0; i < aa.length; i++) {
            if (!aa[i].disabled) {
                aa[i].checked = true;
            }
        }
    },
    clearAll: function (check, check1) {
        var aa = document.getElementsByName(check);
        var aa1 = document.getElementsByName(check1);
        aa1[0].checked = false;
        for (var i = 0; i < aa.length; i++) {
            aa[i].checked = false;
        }
    },

    Close: function () {
        $('.closable').append('<span id="lblclose" class="closelink" title="Close"></span>');
        $('.closelink').click(function () {
            $(this).parent().fadeOut('600', function () { $(this).remove(); });
        });
    },

    isNumberKey: function (evt) {
        var charCode = (evt.which) ? evt.which : event.keyCode
        if (charCode > 31 && (charCode < 48 || charCode > 57))
            return false;

        return true;
    },

    GetCheckBoxValue: function (CbName) {
        var returnval = "";
        for (var i = 0; i < $("input[name='" + CbName + "']").length; i++) {
            if ($("input[id='" + CbName + "-" + (i + 1) + "']").is(":checked")) {
                returnval = returnval + $("input[id='" + CbName + "-" + (i + 1) + "']").val() + ",";
            }
        }
        var strLen = returnval.length;
        returnval = returnval.slice(0, strLen - 1);
        return returnval;
    },

    // Closable function

    //Charecter Count

    TxtCounters: function (id, max_length, myelement) {
        counter = document.getElementById(id);
        field = document.getElementById(myelement).value;
        field_length = field.length;
        if (field_length <= max_length) {
            //Calculate remaining characters
            remaining_characters = max_length - field_length;
            //Update the counter on the page
            counter.innerHTML = remaining_characters;
        }
    },
    mfadeout: function () {
        setTimeout(function () { $('.success').fadeOut(3000); }, 4000);
        setTimeout(function () { $('.error').fadeOut(3000); }, 4000);
    },

    btnshowhide: function () {
        $(".toggle_container").hide();
        $("h2.expand_heading").toggle(function () {
            $(this).addClass("active");
        }, function () {
            $(this).removeClass("active");
        });
        $("h2.expand_heading").click(function () {
            $(this).next(".toggle_container").slideToggle("slow");
        });
        $(".expand_all").toggle(function () {
            $(this).addClass("expanded");
        }, function () {
            $(this).removeClass("expanded");
        });
        $(".expand_all").click(function () {
            $(".toggle_container").slideToggle("slow");
        });

    },

    opendialog: function (heading, div) {
        $('#' + div).dialog('option', 'title', heading);
        $("#" + div).dialog("open");
    },

    closedialog: function (div) {
        $("#" + div).dialog("close");
    },

    GetCaptcha: function () {
        var returnval = null;
        $.ajax({
            url: 'User/Members/GetCaptcha',
            type: 'POST',
            datatype: "JSON",
            async: false,
            success: function (result) {
                if (result.ok) {
                    returnval = result.data;
                }
            }
        });
        return returnval;
    }

}

function IsDecimal(strString)
    //  check for valid numeric strings	
{
    var strValidChars = "0123456789.-";
    var strChar;
    var blnResult = true;

    if (strString.length == 0) return false;

    //  test strString consists of valid characters listed above
    for (i = 0; i < strString.length && blnResult == true; i++) {
        strChar = strString.charAt(i);
        if (strValidChars.indexOf(strChar) == -1) {
            blnResult = false;
        }
    }
    return blnResult;
}


function IsNumeric(strString)
    //  check for valid numeric strings	
{
    var strValidChars = "0123456789.-,";
    var strChar;
    var blnResult = true;

    if (strString.length == 0) return false;

    //  test strString consists of valid characters listed above
    for (i = 0; i < strString.length && blnResult == true; i++) {
        strChar = strString.charAt(i);
        if (strValidChars.indexOf(strChar) == -1) {
            blnResult = false;
        }
    }
    return blnResult;
}

function sumosselector() {
    window.asd = $('.SlectBox').SumoSelect({ csvDispCount: 3 });
    window.test = $('.testsel').SumoSelect({ okCancelInMulti: true });
}


function IsPhoneNo(strString)
    //  check for valid numeric strings	
{
    var strValidChars = "0123456789.- ()";
    var strNumbers = "0123456789";
    var strChar;
    var blnResult = true;
    j = 0;
    if (strString.length == 0) return false;

    //  test strString consists of valid characters listed above
    for (i = 0; i < strString.length && blnResult == true; i++) {
        strChar = strString.charAt(i);
        if (strValidChars.indexOf(strChar) == -1) {
            blnResult = false;
        }
        if (strNumbers.indexOf(strChar) != -1) {
            j++;
        }
    }
    if (j != 10) {
        blnResult = false;
    }
    return blnResult;
}


function Encode(data) {
    var SAFECHARS = "0123456789" + "ABCDEFGHIJKLMNOPQRSTUVWXYZ" + "abcdefghijklmnopqrstuvwxyz" + "-_.!~*()";
    var HEX = "0123456789ABCDEF";
    var plaintext = data;
    var encoded = "";
    for (var i = 0; i < plaintext.length; i++) {
        var ch = plaintext.charAt(i);
        if (ch == " ") {
            encoded += "+";
        } else if (SAFECHARS.indexOf(ch) != -1) {
            encoded += ch;
        } else {
            var charCode = ch.charCodeAt(0);
            if (charCode > 255) {
                alert("Unicode Character '" + ch + "' cannot be encoded using standard URL encoding.\n" + "(URL encoding only supports 8-bit characters.)\n" + "A space (+) will be substituted.");
                encoded += "+";
            } else {
                encoded += "%";
                encoded += HEX.charAt((charCode >> 4) & 0xF);
                encoded += HEX.charAt(charCode & 0xF);
            }
        }

        function Decode(data) {
            var HEXCHARS = "0123456789ABCDEFabcdef";
            var encoded = data;
            var plaintext = "";
            var i = 0;
            while (i < encoded.length) {
                var ch = encoded.charAt(i);
                if (ch == "+") {
                    plaintext += " ";
                    i++;
                } else if (ch == "%") {
                    if (i < (encoded.length - 2) && HEXCHARS.indexOf(encoded.charAt(i + 1)) != -1 && HEXCHARS.indexOf(encoded.charAt(i + 2)) != -1) {
                        plaintext += unescape(encoded.substr(i, 3));
                        i += 3;
                    } else {
                        if (ch == "%" && encoded.charAt(i + 1) != " ") {
                            alert('Bad escape combination near ...' + encoded.substr(i));
                            plaintext += "%[ERROR]";
                        }
                        i++;
                    }
                } else {
                    plaintext += ch;
                    i++;
                }
            }
            return plaintext;
        }


    }
    return encoded;
}