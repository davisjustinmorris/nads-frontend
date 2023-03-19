$(document).ready(function () {
    $('#formula').on('change', function (e) {
        console.log('selected revenue type: ', this.value);
        $('#selectFranchise').empty();

        $.ajax({
            type: "POST",
            url: 'http://192.168.0.134:5000/ajax_sample/'+this.value,
            // dataType: 'application/json',
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
});

let link_main_class_names = {
    "menu-main": "main",
    "menu-franchisee": "franchisee-main",
    "menu-bus": "bus-main",
    "menu-settings": "settings-main",
    "menu-agency": "agency-main"
}