let timeRange = null;
let teamLeaders = [];
let teams = [];
let selectedRow = null;
let selectedTeam = null;
let resultData = null;

$(document).ready(function () {
    var pw_dialog, pw_form, email_dialog, email_form,
        emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    pw_dialog = $('#change-password').dialog({
        autoOpen: false,
        buttons: {
            "Update Password": updatePassword,
            Cancel: function () {
                pw_dialog.dialog("close");
            }
        },
        close: function () {
            pw_form[0].reset();            
        }
    })

    pw_form = pw_dialog.find("form").on("submit", function (event) {
        event.preventDefault();
        updatePassword();
    });

    function updatePassword() {
        const current = $(this).find('#current').val(),
            password = $(this).find('#password').val(),
            confirm = $(this).find('#confirm').val();
        if (current == '' || current.length <= 0) {
            errorMsg('Please type current password')
            return false;
        }

        if (password == '') {
            errorMsg('Please type new password')
            return false;
        }

        if (password != confirm) {
            errorMsg('Confirm password isn\'t matched')
            return false;
        }

        // update module
        const request = makeRequestWithToken('/api/reset', 'POST', {
            password: current,
            newPassword: password
        })

        if (request) {
            request.done(() => {
                logout()
            })
            .fail(xhr => {
                errorHandler(xhr)
            })
        }
    }

    $('#pw-btn').click(() => {
        pw_dialog.dialog('open')
    })

    email_dialog = $('#change-email').dialog({
        autoOpen: false,
        buttons: {
            "Update Email": updateEmail,
            Cancel: function () {
                email_dialog.dialog("close");
            }
        },
        close: function () {
            email_form[0].reset();            
        }
    })

    email_form = email_dialog.find("form").on("submit", function (event) {
        event.preventDefault();
        updateEmail();
    });

    function updateEmail() {
        const current = $(this).find('#email').val(),
            confirm = $(this).find('#confirm').val();
        if (current == '' || current.length <= 0) {
            errorMsg('Please type your email')
            return false;
        } else if (!emailRegex.test(current)) {
            errorMsg('Please type correct email format')
            return false;
        }

        if (current != confirm) {
            errorMsg('Confirm email isn\'t matched')
            return false;
        }

        // update module
        const request = makeRequestWithToken('/api/reset/email', 'POST', {
            email: current
        })

        if (request) {
            request.done(() => {
                logout()
            })
            .fail(xhr => {
                errorHandler(xhr)
            })
        }
    }

    $('#email-btn').click(() => {
        email_dialog.dialog('open')
    })
})