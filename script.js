let server_address = '192.168.0.111:5000'

let link_main_class_names = {
    "menu-main": "main",
    "menu-franchisee": "franchisee-main",
    "menu-bus": "bus-main",
    "menu-settings": "settings-main",
    "menu-agency": "agency-main",
    "menu-add-client-main":"add-client-main",
}

$(document).ready(function () {
    $(`body > .container > .navigation > ul li:not(:first-child)`).on('click', function() {
        $(`body > div:not(:first-child)`).hide()
        let link_class = this.classList[0];
        let div_class = link_main_class_names[link_class];
        $(`body > div.`+div_class).show()
        console.log(link_class, div_class);
    });

    $(`#add-franchisee-form`).on('submit', handle_ajax_form);
    $(`#add-agency-form`).on('submit', handle_ajax_form);

    load_data()
});

function handle_ajax_form(e) {
    e.preventDefault();
    console.log(e);
    console.log('invoked: ajax form for: ', e.currentTarget.id);

    if (e.currentTarget.action.split('/api').length !== 2) return;


    $.ajax({
        url: 'http://' + server_address + '/api' + e.currentTarget.action.split('/api')[1],
        type: 'post',
        data: $(e.currentTarget).serialize(),
        success: function (data) {
            console.log(data);
            if (data.success) location.reload();
            else if (data.error) alert(data.error);
        }
    });
}

function load_data() {
    $.ajax({
        url: 'http://' + server_address + '/api/view/all',
        type: 'post',
        success: function (data) {
            console.log('view all data: ', data);
            if (data.success) {
                if (data.payload.franchisee) load_franchisee_table(data.payload.franchisee);
                if (data.payload.agency) load_agency_table(data.payload.agency);
            }
        }
    });
}

function load_franchisee_table(data) {
    let new_data = '';
    data.forEach(function (loop_data, i) {
        new_data += `
                <tr>
                    <td>${i+1}</td>
                    <td>${loop_data.code}</td>
                    <td>${loop_data.name}</td>
                    <td>${loop_data.phone}</td>
                    <td>${loop_data.address}</td>
                </tr>`;
    });
    $(`#list-franchisee-table tbody`).empty().append(new_data);
}

function load_agency_table(data) {
    let new_data = '';
    data.forEach(function (loop_data, i) {
        new_data += `
        <tr>
            <td>${i+1}</td>
            <td>${loop_data.name}</td>
        </tr>`;
    });
    $(`#list-agency-table tbody`).empty().append(new_data);
}