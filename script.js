let server_address = '192.168.0.111:5000';

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
let select_option_map = {'franchisee': '', 'agency': ''};

$(document).ready(function () {
    $(`#add-client-form`).on('submit', handle_ajax_form);
    $(`#add-franchisee-form`).on('submit', handle_ajax_form);
    $(`#add-agency-form`).on('submit', handle_ajax_form);
    $(`#add-bus-form`).on('submit', handle_ajax_form);
    $(`#edit-settings-form`).on('submit', handle_ajax_form);

    load_data();
    attach_listeners();
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
                    server_data.franchisee.forEach(function (loop_data) {
                        select_option_map.franchisee += `<option value="${loop_data.id}">${loop_data.name}</option>`;
                    });
                }
                if (server_data.agency) {
                    server_data.agency.forEach(function (loop_data) {
                        select_option_map.agency += `<option value="${loop_data.id}">${loop_data.name}</option>`;
                    });
                }

                $(`#add-bus-form select[name='bus-captured-by-id']`).empty().append(select_option_map.franchisee);
                $(`#create-order-form select[name='ad-captured-by-id']`).empty().append(select_option_map.franchisee);
            }
        }
    });
}

function attach_listeners() {
    // side nav listeners
    $(`body > .container > .navigation > ul li:not(:first-child)`).on('click', function () {
        $(`body > div:not(:first-child)`).hide()
        let link_class = this.classList[0];
        let div_class = link_main_class_names[link_class];
        $(`body > div.` + div_class).show()
        console.log(link_class, div_class);
    });

    // add-bus-form >> listener on radio button for bus captured by
    $(`#add-bus-form input[name='bus-captured-by-type']`).on('change', function () {
        if (this.value === 'franchisee') $(`#add-bus-form select[name='bus-captured-by-id']`).show()
        else $(`#add-bus-form select[name='bus-captured-by-id']`).hide();
    });

    // home/order form >> listener on radio button for ad captured by
    $(`#create-order-form input[name='ad-captured-by-type']`).on('change', function () {
        $(`#create-order-form select[name='ad-captured-by-id']`).empty().append(select_option_map[this.value]);
    });

    $(`#create-order-form button[name="calculate-rate"]`).on('click', create_order__calculate);

    // add bus district selection filters
    $(`#create-order-form .order-input-item .district-filters input[type='checkbox']`).on('change', function () {
        console.log(this.name);
        console.log(this.checked);
        if (this.name === "all") {
            $(`#create-order-form .order-input-item .district-filters input[type='checkbox']`).prop('checked', this.checked);
            if (this.checked)
                $(`#create-order-form .list-bus-container tbody tr`).show();
            else
                $(`#create-order-form .list-bus-container tbody tr`).hide();
        } else {
            // set check box to partial status
            $(`#create-order-form .order-input-item .district-filters input[type='checkbox'][name='all']`)[0].indeterminate = true;
            // get list of all selected districts from filters
            let selected_names = [];
            $(`#create-order-form .order-input-item .district-filters input[type='checkbox']:not([name='all'])`).each(function () {
                if (this.checked) selected_names.push($(this).prop('name'));
            });
            console.log('selected filters: ', selected_names);
            $(`#create-order-form .list-bus-container tbody tr`).each(function () {
                // console.log(this);
                if (selected_names.includes($(this).find('td:nth-child(3)').text()))
                    $(this).show();
                else
                    $(this).hide();
            });
        }
    })
}

function load_franchisee_table(data) {
    let new_data = '';
    data.forEach(function (loop_data, i) {
        new_data += `
                <tr>
                    <td>${i + 1}</td>
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
            <td>${i + 1}</td>
            <td>${loop_data.name}</td>
        </tr>`;
    });
    $(`#list-agency-table tbody`).empty().append(new_data);
}

function create_order__calculate () {
    // check duration radio button status
    let duration = $(`#create-order-form input[name='ad-duration']`).val();
    if (!duration) { alert('invalid duration value! something went wrong!'); return; }

    // check start date and end date values
    let ad_days_count;
    let start_date = $(`#create-order-form input[name='ad-start-date']`).val();
    let end_date = $(`#create-order-form input[name='ad-end-date']`).val();
    if (!end_date || !start_date) {
        alert('start date and end date required!');
        return;
    } else {
        ad_days_count = (new Date(end_date) - new Date(start_date))/(1000*60*60*24);
        if (ad_days_count < 1) {
            alert('difference in start day and end day should at least be one');
            return;
        }
    }

    // check selected buses
    let selected_bus_ids = [];
    $(`#create-order-form .list-bus-container tbody tr:not([style*="display: none"])`).each(function (loop_index, loop_data) {
        let loop_checkbox = $(loop_data).find('td:first-child input[type="checkbox"]');
        if (loop_checkbox.prop('checked')) selected_bus_ids.push(loop_checkbox.val());
    });
    if (selected_bus_ids.length === 0) {
        alert('no buses selected!');
        return;
    }

    // since all selected values are proper, proceed with the calculations
    $(`#create-order-form .display-inputs-container span[name="no-of-bus"]`).text(selected_bus_ids.length);
    $(`#create-order-form .display-inputs-container span[name="no-of-days"]`).text(ad_days_count);
    $(`#create-order-form .display-inputs-container span[name="ad-duration"]`).text(duration);
    $(`#create-order-form .display-inputs-container span[name="total-charge"]`).text('1,00,000');

    // proceed with formulas
    let ad_captured_by_user_type = $(`#create-order-form input[name="ad-captured-by-type"]`).val();
    let ad_captured_by_user_id = $(`#create-order-form input[name="ad-captured-by-id"]`).val();
    let distinct_bus_franchisee = [];
    server_data.bus.forEach(function (loop_data) {
        if (selected_bus_ids.includes(loop_data.id)){

        }
    });
}

function load_ad_client_table(data) {
    let new_data = '';
    data.forEach(function (loop_data, i) {
        new_data += `
        <tr>
            <td><input type="checkbox" name="selected_rows" value="${loop_data.name}"></td>
            <td>${i + 1}</td>
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
            <td>${i + 1}</td>
            <td>${loop_data.district}</td>
            <td>${loop_data.capturer_type}${capturer_name}</td>
            <td>${loop_data.owner_name}</td>
            <td>${loop_data.bus_name}</td>
            <td>${loop_data.route_details}</td>
            <td>${loop_data.registration_number}</td>
        </tr>`;
    });
    $(`#list-bus-table tbody`).empty().append(new_data);
    $(`#create-order-form .list-bus-container tbody`).empty().append(new_data);
}

function load_profit_ratio_details(data) {
    data.forEach(function (loop_data, i) {
        $(`#revenue-order-section span.${loop_data.formula_for}--${loop_data.for_user_type}`).text(loop_data.ratio);
    })
}
