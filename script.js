let server_address = '192.168.0.111:5000'

$(document).ready(function () {
    do_list_franchisee_table();
    do_list_agency();

    $('#formula').on('change', function (e) {
        console.log('selected revenue type: ', this.value);
        $('#selectFranchise').empty();

        $.ajax({
            type: "POST",
            url: 'http://' + server_address + '/ajax_sample/'+this.value,
            success: function (response_data) {
                console.log('response_data: ', response_data);
                let ops = '<option selected disabled>-- CLick to select --</option>'
                response_data.forEach(function (a, b) {
                    ops += `<option value="${a}">${a}</option>`
                });
                $('#selectFranchise').append(ops);
            },
            complete: () => console.log('complete')
        });
    });

    $(`body > .container > .navigation > ul li:not(:first-child)`).on('click', function() {
        $(`body > div:not(:first-child)`).hide()
        let link_class = this.classList[0];
        let div_class = link_main_class_names[link_class];
        $(`body > div.`+div_class).show()
        console.log(link_class, div_class);
    });

    $(`#add-franchisee-form`).on('submit', handle_form_add_franchisee);
    $(`#add-agency-form`).on('submit', handle_form_add_agency);
});

let link_main_class_names = {
    "menu-main": "main",
    "menu-franchisee": "franchisee-main",
    "menu-bus": "bus-main",
    "menu-settings": "settings-main",
    "menu-agency": "agency-main",
    "menu-add-client-main":"add-client-main",
}

function handle_form_add_franchisee(e) {
    e.preventDefault();
    console.log('invoked: check_form_add_franchisee');

    $.ajax({
        url: 'http://' + server_address + '/entity/franchisee/add',
        type: 'post',
        data: $(`#add-franchisee-form`).serialize(),
        success: function (data) {
            console.log(data);
            if (data.success) location.reload();
            else if (data.error) alert(data.error);
        }
    });
}

function do_list_franchisee_table() {
    console.log('invoked: do_list_franchisee_table');
    $(`#list-franchisee-table tbody`).empty();
    $.ajax({
        url: 'http://' + server_address + '/entity/franchisee',
        type: 'post',
        success: function (data) {
            console.log(data);
            if (!data.success) return;

            let new_data = '';
            data.payload.forEach(function (loop_data, i) {
                new_data += `
                <tr>
                    <td>${i+1}</td>
                    <td>${loop_data.code}</td>
                    <td>${loop_data.name}</td>
                    <td>${loop_data.phone}</td>
                    <td>${loop_data.address}</td>
                </tr>`;
            });
            $(`#list-franchisee-table tbody`).append(new_data);
        }
    });
}

function handle_form_add_agency(e) {
    e.preventDefault();
    console.log('invoked: handle_form_add_agency');

    $.ajax({
        url: 'http://' + server_address + '/entity/agency/add',
        type: 'post',
        data: $(`#add-agency-form`).serialize(),
        success: function (data) {
            console.log(data);
            if (data.success) location.reload();
            else if (data.error) alert(data.error);
        }
    });
}

function do_list_agency() {
    console.log('invoked: do_list_franchisee_table');
    $(`#list-agency-table tbody`).empty();
    $.ajax({
        url: 'http://' + server_address + '/entity/agency',
        type: 'post',
        success: function (data) {
            console.log(data);
            if (!data.success) return;

            let new_data = '';
            data.payload.forEach(function (loop_data, i) {
                new_data += `
                <tr>
                    <td>${i+1}</td>
                    <td>${loop_data.name}</td>
                </tr>`;
            });
            $(`#list-agency-table tbody`).append(new_data);
        }
    });
}