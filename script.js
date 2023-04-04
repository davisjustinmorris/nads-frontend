let server_address = '192.168.0.111:5000';

let link_main_class_names = {
    "menu-main": "main",
    "menu-franchisee": "franchisee-main",
    "menu-bus": "bus-main",
    "menu-settings": "settings-main",
    "menu-agency": "agency-main",
    "menu-add-client-main": "add-client-main",
    "menu-order": "order-main",
    "menu-organisation": "organisation-main",
    "menu-gst": "gst-main",
    "menu-companyRevenue": "company-revenue-main",
    "menu-serverCharge": "server-charge-main"
}

let server_data;
let select_option_map = {'franchisee': '', 'agency': '', 'client': ''};

$(document).ready(function () {
    $(`#add-client-form`).on('submit', handle_ajax_form);
    $(`#add-franchisee-form`).on('submit', handle_ajax_form);
    $(`#add-agency-form`).on('submit', handle_ajax_form);
    $(`#add-bus-form`).on('submit', handle_ajax_form);
    $(`#edit-settings-form`).on('submit', handle_ajax_form);
    $(`#create-order-form`).on('submit', handle_ajax_form);

    load_data();
    attach_listeners();
});

function handle_ajax_form(e) {
    e.preventDefault();
    console.log('invoked: ajax form for: ', e.currentTarget.id);
    if (e.currentTarget.id === 'create-order-form')
        if (!on_click__orders__final_calc_button()) return;

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
                if (server_data.orders) load_orders(server_data.orders);
                if (server_data.company) load_company(server_data.company);
                if (server_data.server) load_server_charges(server_data.server);
                if (server_data.gst) load_gst_table(server_data.gst);

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
                if (server_data.ad_client) {
                    server_data.ad_client.forEach(function (loop_data) {
                        select_option_map.client += `<option value="${loop_data.id}">${loop_data.name}</option>`;
                    });
                }

                $(`#add-bus-form select[name='bus-captured-by-id']`).empty().append(select_option_map.franchisee);
                $(`#create-order-form select[name='ad-captured-by-id']`).empty().append(select_option_map.franchisee);
                $(`#create-order-form select[name='client-id']`).empty().append(select_option_map.client);
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

    // add bus >> district selection filters
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

    // add order >> final calculation button
    $(`#create-order-form .final-calculation-container button.btn-calc`).on('click', on_click__orders__final_calc_button);
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
                    <td><a href="#" onclick="on_click__view_payments_franchisee(this, ${loop_data.id})">View Payments</a></td>
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
            <td><a href="#" onclick="on_click__view_payments_agency(this, ${loop_data.id})">View Payments</a></td>
        </tr>`;
    });
    $(`#list-agency-table tbody`).empty().append(new_data);
}

function create_order__calculate() {
    // check duration radio button status
    let duration = $(`#create-order-form input[name='ad-duration']:checked`).val();
    if (!duration) {
        alert('invalid duration value! something went wrong!');
        return false;
    }
    // force check of ad name

    // check start date and end date values
    let ad_days_count;
    let start_date = $(`#create-order-form input[name='ad-start-date']`).val();
    let end_date = $(`#create-order-form input[name='ad-end-date']`).val();
    if (!end_date || !start_date) {
        alert('start date and end date required!');
        return false;
    } else {
        ad_days_count = (new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24);
        if (ad_days_count < 1) {
            alert('difference in start day and end day should at least be one');
            return false;
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
        return false;
    }

    let duration_rate_map = {
        15: 166,
        30: 233,
        45: 300,
        60: 366
    };
    // since all selected values are proper, proceed with the calculations
    $(`#create-order-form .display-inputs-container span[name="no-of-bus"]`).text(selected_bus_ids.length);
    $(`#create-order-form .display-inputs-container span[name="no-of-days"]`).text(ad_days_count);
    $(`#create-order-form .display-inputs-container span[name="ad-duration"]`).text(duration);
    let ad_total_rate = duration_rate_map[duration] * selected_bus_ids.length * ad_days_count;
    $(`#create-order-form .display-inputs-container span[name="total-charge"]`).text(ad_total_rate);
    $(`#create-order-form .final-calculation-container input[name="gst-amount"]`).val(0);

    // proceed with formulas
    console.log('selected_bus_ids: ', selected_bus_ids);
    $(`#create-order-form .order-form-table > div`).hide();
    let ad_captured_by_user_type = $(`#create-order-form input[name="ad-captured-by-type"]:checked`).val();
    let ad_captured_by_user_id = $(`#create-order-form select[name="ad-captured-by-id"]`).val();
    if (ad_captured_by_user_type === 'franchisee') {
        console.log('is captured by fr detected');
        let count_normal = 0;
        let count_other = 0;

        server_data.bus.forEach(function (loop_bus_data) {
            if (selected_bus_ids.includes(String(loop_bus_data.id))) {
                console.log("capturer_id: ", loop_bus_data.capturer_id);
                console.log("ad_captured_by_user_id: ", ad_captured_by_user_id);
                if (String(loop_bus_data.capturer_id) === ad_captured_by_user_id)
                    count_normal = count_normal + 1;
                else count_other = count_other + 1;
            }
        });
        if (count_normal) $(`#create-order-form .order-form-table .normal`).show();
        if (count_other) $(`#create-order-form .order-form-table .other-Franchisee`).show();
    } else {
        console.log('is captured by ag detected');
        $(`#create-order-form .order-form-table .company-Agency`).show();
    }

    return ad_total_rate;
}

function on_click__orders__final_calc_button() {
    let existing_calc = create_order__calculate();
    if (existing_calc === false) return false;
    let discount = $(`#create-order-form .final-calculation-container input[name="discount"]`).val();
    if (discount) {
        existing_calc = existing_calc - discount;
    }
    $(`#create-order-form .final-calculation-container > div:nth-child(2) > :nth-child(2)`).text(existing_calc);
    return existing_calc;
}

function on_click__orders__gst_check_changed(context) {
    console.log('gst check changed');
    console.log(context);

    let gst;

    if (context.value === "inclusive" && context.checked)
        $(`#create-order-form .final-calculation-container input[name="gst-option"][value="exclusive"]`)
            .prop('checked', false);
    else if (context.value === "exclusive" && context.checked)
        $(`#create-order-form .final-calculation-container input[name="gst-option"][value="inclusive"]`)
            .prop('checked', false);
    else gst = 0;

    if (gst !== 0) {
        gst = 0;
        let payable_amount = on_click__orders__final_calc_button()
        if (payable_amount) gst = payable_amount * 0.18;
    }

    $(`#create-order-form .final-calculation-container .gst-div input`).val(gst);
    $(`#create-order-form .final-calculation-container .gst-div span`).text(gst);
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
            <td><a href="#" onclick="on_click__view_payments_bus(this, ${loop_data.id})">View Payments</a></td>
        </tr>`;
    });
    $(`#list-bus-table tbody`).empty().append(new_data);
    $(`#create-order-form .list-bus-container tbody`).empty().append(new_data);
    $(`#create-order-form .list-bus-container tbody td:last-child`).remove();
    return new_data;
}

function load_profit_ratio_details(data) {
    data.forEach(function (loop_data, i) {
        $(`#revenue-order-section span.${loop_data.formula_for}--${loop_data.for_user_type}`).text(loop_data.ratio);
    })
}

function load_orders(data) {
    let output_html = '';
    let mark_payment_complete_stub = `
        <div class="">
          <button type="button" class="mark-complete" onclick="on_click__orders_mark_paid(this)" style="width: 10rem; background-color: green;">Mark Payment Complete</button>
        </div>`;
    let record_payment_stub = `
        <div class="">
          <label for="">Record Payment</label>
          <input type="text" name="record-payment" placeholder="Amount">
        </div>
        <div class="">
          <label for="">Invoice Number :</label>
          <input type="text" name="invoice-number" placeholder="invoice number (optional)">
        </div>
        <div class="">
          <button onclick="on_click__orders_record_payment(this)" style="width: 10rem;">Record Payment</button>
        </div>`;

    for (const key in data) {
        const loop_data = data[key];
        output_html += `
        <details>
            <summary>
                <div class="summary-container">
                    <input type="hidden" name="order-id" value="${loop_data['id']}">
                    <div class="">
                      <label for="">Ad Name :</label>
                      <span name="ad-name">${loop_data['ad-name']}</span>
                    </div>
                    <div class="">
                      <label for="">Client Name :</label>
                      <span name="client-name">${loop_data['client-name']}</span>
                    </div>
                    <div class="">
                      <label for="">Payment Received :</label>
                      <span>${loop_data['payment-received']} / ${loop_data['payable-amount']}</span>
                    </div>
                    ${loop_data['is-payment-complete']?'':record_payment_stub}
                    <div class="">
                      <label>Current Status :</label>
                      <span class="pending">${loop_data['is-payment-complete']?'Payment Complete':'Pending'}</span>
                    </div>
                    ${loop_data['is-payment-complete']?'':mark_payment_complete_stub}
                  </div>  
            </summary>
        </details>`;
    };
    $('.order-main .order-detail-container').empty().append(output_html);
}

function load_company(data) {
    let html_data = '';
    data.forEach(function (loop_data, i) {
        html_data += `
        <tr>
            <td>${i}</td>
            <td>${loop_data['ad-name']}</td>
            <td>${loop_data['by-user-type']} - ${loop_data['username']}</td>
            <td>${loop_data['amount']}</td>
            <td>${loop_data['date-created']}</td>
            <td>${loop_data['date-updated']}</td>
        </tr>`;
    })
    $(`.company-revenue-table tbody`).empty().append(html_data);
}

function load_server_charges(data) {
    let html_data = '';
    data.forEach(function (loop_data, i) {
        html_data += `
        <tr>
            <td>${i}</td>
            <td>${loop_data['date']}</td>
            <td>${loop_data['amount']}</td>
            <td>${loop_data['ad-name']}</td>
        </tr>`;
    })
    $(`.payments-serverCharge-container tbody`).empty().append(html_data);
}

function load_gst_table(data) {
    let html_data = '';
    let counter = 1;

    for (const order_id in data) {
        html_data += `
        <tr>
            <td>${counter++}</td>
            <td>${server_data['map']['orders'][order_id]['client-name']}</td>
            <td>${server_data['map']['orders'][order_id]['ad-name']}</td>
            <td>${data[order_id]['payable_amount'] + data[order_id]['gst_amount']} (${data[order_id]['inclusive_or_exclusive']})</td>
            <td>${data[order_id]['gst_amount']}</td>
            <td>${data[order_id]['payable_amount']}</td>
            <td>${data[order_id]['client_paid']}</td>
            <td>${data[order_id]['inclusive_or_exclusive']==="exclusive" ? "Payable" : "Non-Payable"}</td>
        </tr>
        `;
    }

    $(`.gst-main .gst-container table tbody`).empty().append(html_data);
}

function on_click__orders_record_payment(context) {
    console.log('called: on_click__orders_mark_paid');
    let payment_value = $(context).parent().parent().find('input[name="record-payment"]').val();
    let order_id = $(context).parent().parent().find('input[name="order-id"]').val();
    $.ajax({
        url: 'http://' + server_address + '/api/order/recordPayment',
        type: 'post',
        contentType: 'application/json',
        data: JSON.stringify({payment_value, order_id}),
        success: function (data) {
            console.log(data);
            if (data.success) location.reload();
            else if (data.error) alert(data.error);
        }
    });
}

function on_click__orders_mark_paid(context) {
    console.log('called: on_click__orders_mark_paid');
    let order_id = $(context).parent().parent().find('input[name="order-id"]').val();
    $.ajax({
        url: 'http://' + server_address + '/api/order/markComplete',
        type: 'post',
        contentType: 'application/json',
        data: JSON.stringify({order_id}),
        success: function (data) {
            console.log(data);
            if (data.success) location.reload();
            else if (data.error) alert(data.error);
        }
    });
}

function on_click__view_payments_bus(context, bus_id) {
    $('.bus-container > span > h2').text('LIST OF BUS PAYMENTS');
    $('.bus-container > table#list-bus-table').hide();
    $('.bus-container > div.payments-bus-container').show();

}

function on_click__view_payments_franchisee(context, fr_id) {
    $('.franchisee-container span.heading > h2').text('LIST OF FRANCHISEE PAYMENTS');
    $('.franchisee-container #list-franchisee-table').hide();
    $('.franchisee-container .payments-franchisee-container').show();

    $.ajax({
        url: 'http://' + server_address + '/api/entity/franchisee/viewPayments/' + fr_id,
        type: 'post',
        success: function (data) {
            let sn_no = 1;
            let tbody_data = '';
            for (const key in data) {
                data[key]['payments'].forEach(function (pay_data) {
                    tbody_data += `
                    <tr>
                        <td>${sn_no++}</td>
                        <td>${data[key]['date']}</td>
                        <td>${data[key]['ad-name']}</td>
                        <td>${pay_data['formula-type']}</td>
                        <td>${pay_data['amount']}</td>
                        <td>${pay_data['is_paid']?'Paid':'Pending'}</td>
                    </tr>`;
                });
            }
            $('.franchisee-container .payments-franchisee-container table tbody').empty().append(tbody_data);
        }
    });
}

function on_click__view_payments_franchisee_back_btn(context, fr_id) {
    $('.franchisee-container span.heading > h2').text('LIST OF FRANCHISEE');
    $('.franchisee-container .payments-franchisee-container').hide();
    $('.franchisee-container #list-franchisee-table').show();
}

function on_click__view_payments_agency(context, ag_id) {
    $.ajax({
        url: 'http://' + server_address + '/api/entity/agency/viewPayments/' + ag_id,
        type: 'post',
        success: function (data) {
            let sn_no = 1;
            let tbody_data = '';
            for (const key in data) {
                tbody_data += `
                <tr>
                    <td>${sn_no++}</td>
                    <td>${data[key]['date']}</td>
                    <td>${data[key]['ad-name']}</td>
                    <td>${data[key]['amount']}</td>
                    <td>${data[key]['is_paid']}</td>
                </tr>`;
            }
            $('.agency-main .payments-agency-container table tbody').empty().append(tbody_data);
        }
    });
}
