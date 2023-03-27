let server_address = 'localhost:5000';

let link_main_class_names = {
    "menu-main": "main",
    "menu-franchisee": "franchisee-main",
    "menu-bus": "bus-main",
    "menu-settings": "settings-main",
    "menu-agency": "agency-main",
    "menu-add-client-main":"add-client-main",
    "menu-order":"order-main",
    "menu-organisation":"organisation-main",
    "menu-gst":"gst-main",
    "menu-companyRevenue":"company-revenue-main",
    "menu-serverCharge":"server-charge-main"
}

let server_data;

$(document).ready(function () {
    $(`body > .container > .navigation > ul li:not(:first-child)`).on('click', function() {
        $(`body > div:not(:first-child)`).hide()
        let link_class = this.classList[0];
        let div_class = link_main_class_names[link_class];
        $(`body > div.`+div_class).show()
        console.log(link_class, div_class);
    });

    $(`#add-bus-form input[name='bus-captured-by-type']`).on('change', function () {
        if (this.value === 'franchisee') $(`#add-bus-form select[name='bus-captured-by-id']`).show()
        else $(`#add-bus-form select[name='bus-captured-by-id']`).hide();
    });

    $(`#add-client-form`).on('submit', handle_ajax_form);
    $(`#add-franchisee-form`).on('submit', handle_ajax_form);
    $(`#add-agency-form`).on('submit', handle_ajax_form);
    $(`#add-bus-form`).on('submit', handle_ajax_form);
    $(`#edit-settings-form`).on('submit', handle_ajax_form);

    load_data();
});

function handle_ajax_form(e) {
    e.preventDefault();
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
                server_data = data.payload;
                if (server_data.franchisee) load_franchisee_table(server_data.franchisee);
                if (server_data.agency) load_agency_table(server_data.agency);
                if (server_data.ad_client) load_ad_client_table(server_data.ad_client);
                if (server_data.bus) load_bus_table(server_data.bus);
                if (server_data.profit_ratio) load_profit_ratio_details(server_data.profit_ratio);

                if (server_data.franchisee) {
                    let drop_down_data = '';
                    server_data.franchisee.forEach(function (loop_data) {
                        drop_down_data += `<option value="${loop_data.id}">${loop_data.name}</option>`;
                    });
                    $(`#add-bus-form select[name='bus-captured-by-id']`).empty().append(drop_down_data);
                }
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

function load_ad_client_table(data) {
    let new_data = '';
    data.forEach(function (loop_data, i) {
        new_data += `
        <tr>
            <td><input type="checkbox" name="selected_rows" value="${loop_data.name}"></td>
            <td>${i+1}</td>
            <td>${loop_data.name}</td>
            <td>${loop_data.phone}</td>
            <td>${loop_data.email}</td>
            <td>${loop_data.address}</td>
        </tr>`;
    });
    $(`#list-ad-client-table tbody`).empty().append(new_data);
}

function load_bus_table(data) {
    let new_data = '';
    data.forEach(function (loop_data, i) {
        let capturer_name = '';
        if (loop_data.capturer_type === "franchisee")
            capturer_name = " - " + server_data['map'][loop_data.capturer_type][loop_data.capturer_id];

        new_data += `
        <tr>
            <td><input type="checkbox" name="selected_rows" value="${loop_data.id}"></td>
            <td>${i+1}</td>
            <td>${loop_data.district}</td>
            <td>${loop_data.capturer_type}${capturer_name}</td>
            <td>${loop_data.owner_name}</td>
            <td>${loop_data.bus_name}</td>
            <td>${loop_data.route_details}</td>
            <td>${loop_data.registration_number}</td>
        </tr>`;
    });
    $(`#list-bus-table tbody`).empty().append(new_data);
}

function load_profit_ratio_details(data) {
    data.forEach(function (loop_data, i) {
        $(`#revenue-order-section span.${loop_data.formula_for}--${loop_data.for_user_type}`).text(loop_data.ratio);
    })
}
