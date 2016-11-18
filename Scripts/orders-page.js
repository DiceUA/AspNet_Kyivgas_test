$(document).ready(function () {
    var apiBaseUrl = document.location.origin;
    var currentPage = 1;
    //Load data for page 1 first time
    fetchData(1);
    // Paging 
    $('#footer').on('click', '.pagination a', function (e) {
        e.preventDefault();
        var pageNo = parseInt($(this).html());
        currentPage = pageNo;
        fetchData(currentPage);
    });

    //Fetch Data
    function fetchData(pageNo) {                
        //Ajax call for fetch data from WEB Api            
        $.ajax({
            url: apiBaseUrl + "/api/Orders/GetPaged",
            type: "Get",
            data: { pageNo: pageNo },
            dataType: "json",
            success: function (data) {
                // generate html and Load data
                //table  body 
                var $table = $("#myTableBody");
                //Clear table
                $('#myTableBody').html($table);
                var obj = JSON.parse(data);
                //var sortedOrders = applySort(obj.Orders);
                var orders = obj.Orders;
                for (var i = 0; i < orders.length; i++) {

                    var date = new Date(parseInt(orders[i].Created_date.substr(6)));
                    var formattedCreateDate = formatDate(date); // Get correct date from UTC to LocalTime
                    date = new Date(parseInt(orders[i].Delivery_date ? orders[i].Delivery_date.substr(6) : null));
                    var formattedDeliveryDate = formatDate(date);
                    var $row = $("<tr class='clickable-row'></tr>");
                    $row.append($('<td/>').html(orders[i].OrderId));
                    $row.append($('<td/>').html(orders[i].Number));
                    $row.append($('<td/>').html(orders[i].Manager));
                    $row.append($('<td/>').html(formattedCreateDate));
                    $row.append($('<td/>').attr("date", orders[i].Created_date).html(formattedDeliveryDate));
                    $row.append($('<td/>').html(orders[i].Description));
                    $table.append($row);
                    //$("<tr class='clickable-row'><td>" + orders[i].OrderId + "</td><td>" + orders[i].Number + "</td><td>" + orders[i].Manager + "</td><td>" + orders[i].Created_date + "</td><td>" + orders[i].Delivery_date + "</td><td></td></tr>").appendTo("#myTableBody");
                }
                //footer (for paging content)
                var totalPage = parseInt(obj.TotalPage);
                var $footer = $('#footer');
                var $pagingList = $('<ul/>').addClass('pagination');
                // Clear footer
                $footer.html($pagingList);
                if (totalPage > 0) {
                    for (var i = 1; i <= totalPage; i++) {
                        var $page = $('<li/>').addClass(i === currentPage ? "active" : "");
                        $page.html("<a href='#'>" + i + "</a>");
                        $pagingList.append($page);
                    }
                    $footer.append($pagingList);
                }
            },
            error: function (msg) {
                console.log(msg);
                $('#error').html('Error! Cannot load data.').show();
            }
        });
    }

    // Click on table row to EDIT it
    $('#myTable').on('click', '.clickable-row', function (event) {
        cleanErrors();
        getManagers();
        $(this).addClass('active').siblings().removeClass('active');
        $("#editModal #orderGuid").val($(this).closest('tr').children()[0].textContent).prop('disabled', true);
        $("#editModal #orderNumber").val($(this).closest('tr').children()[1].textContent);
        //$("#editModal #orderManager").val($(this).closest('tr').children()[2].textContent).prop('disabled', true); // Disabled
        $("#editModal #orderDelivery").attr("date","asdads").val($(this).closest('tr').children()[4].textContent);
        $("#editModal #orderDescription").val($(this).closest('tr').children()[5].textContent);
        $("#editModal").modal("show");
    });
    // Click on Create Button
    $('#createModal').click(function (e) {
        cleanErrors();
        getManagers();
        $('#frm1').find("input[type=textarea], input[type=text], textarea").each(function (ev) {
            $(this).val("").prop('disabled', false);
        });
        $("#editModal #orderGuid").prop('disabled', true).attr("placeholder", "This will be generated automatically");
        $("#editModal #orderManager").prop('disabled', true);
        $("#editModal #orderDelivery").attr("placeholder", "dd/mm/yyyy");
        $("#editModal").modal("show");
    });

    // Get managers to select
    function getManagers() {
        $.ajax({
            url: apiBaseUrl + "/api/Orders/GetManagers",
            type: "Get",
            //data: "",
            dataType: "json",
            success: function (data) {
                var obj = JSON.parse(data);
                // Populate select
                var select = $("#managerSelect");
                select.empty(); // clears select
                for (var i = 0; i < obj.length; i++) {
                    var opt = $('<option />').attr("guid", obj[i].ManagerId).html(obj[i].Name);
                    if ($("#myTable .active").children()[2].textContent == obj[i].Name)
                    {
                        opt.prop('selected', true);
                    }
                    select.append(opt);
                }
            },
            error: function (msg) {
                console.log(msg);
                //$('#error').html('Error! Cannot load data.').show();
            }
        });
    }

    // Create and Update order    
    $('#frm1').submit(function (e) {
        e.preventDefault();
        var cl = clientValidations();
        if (!clientValidations()) {
            return;
        }
        var create = false;
        if ($('#orderGuid').val() == "") {
            create = true;
        }
        var order;
        if (create) {
            order = {
                OrderId: "",
                Number: $('#orderNumber').val().trim(),
                ManagerId: $("#managerSelect option:selected").attr("guid"),
                Delivery_date: formatDateToDB($('#orderDelivery').val().trim()),
                Description: $('#orderDescription').val().trim(),
                Status: "create"
            };
        }
        else {
            order = {
                OrderId: $('#orderGuid').val().trim(),
                Number: $('#orderNumber').val().trim(),
                ManagerId: $("#managerSelect option:selected").attr("guid"),
                Delivery_date: formatDateToDB($('#orderDelivery').val().trim()),
                Description: $('#orderDescription').val().trim(),
                Status: "update"
            };
        }
        //Save
        $.ajax({
            type: 'POST',
            url: apiBaseUrl + '/api/Orders/UpdateOrder',
            data: JSON.stringify(order),
            contentType: 'application/json; charset=utf-8',
            dataType: 'json',
            success: function (d) {
                alert('Successfully Saved!');
                var frm = document.getElementById('frm1');
                frm.reset();
                $('#editModal').modal('hide');
                var currentPage = parseInt($(".pagination .active > a").textContent);
                fetchData(currentPage);
            },
            error: function () {
                $('#error').html('Error! please try with valid data.').show();
            }
        });
    });

    // Filter
    // Фильтрация по одной странице by Number  td:nth-child(2)
    // Чтобы фильтровать по всем страницам для этого надо переписывать пагинацию и подгружать сразу все записи из базы(займет много времени)
    var filter = $("#filter1 input");
    filter.keyup(function (e) {
        $('#myTableBody td:nth-child(2)').each(function () {
            if (filter.val() != $(this).text().substr(0, filter.val().length)) {
                $(this).parent().hide();
            } else {
                $(this).parent().show();
            }
        });
    });

    // Validations
    function clientValidations() {
        cleanErrors();
        var dateDelivery = $('#orderDelivery').val().trim();
        var orderNumber = $('#orderNumber').val().trim();
        var isValid = true;
        if (!isValidDate(dateDelivery)) {
            if (!dateDelivery == "")
            {
                // validation error here
                $("#orderDelivery").parent().append("<div class='help-block with-errors'>Incorrect date</div>");
                isValid = false;
            }
        }
        if (orderNumber == "") {
            // validation error here
            $("#orderNumber").parent().append("<div class='help-block with-errors'>Number cant be null</div>");
            isValid = false;
        }
        if (orderNumber.length > 50)
        {
            // validation error here
            $("#orderNumber").parent().append("<div class='help-block with-errors'>Number can't be more than 50 characters</div>");
            isValid = false;
        }
        return isValid;
    }
    // Clear all validation error messages on form
    function cleanErrors() {
        var errors = document.getElementsByClassName("with-errors");
        var length = errors.length;
        for (var i = 0; i < length; i++) {
            errors[0].remove();
        }
    }
    // Validate date
    function isValidDate(date) {
        var matches = /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/.exec(date);
        if (matches == null) return false;
        var d = matches[1];
        var m = matches[2] - 1;
        var y = matches[3];
        var composedDate = new Date(y, m, d);
        return composedDate.getDate() == d &&
                composedDate.getMonth() == m &&
                composedDate.getFullYear() == y;
    }

    // Validate creation and delivery
    // if need to check  
    function isValidDates(date1, date2) {
        return date1 < date2;
    }

    // Helper formats dates from database
    function formatDate(date) {
        if (date == 'Invalid Date' || date == null || date == "") {
            return "";
        }
        var converted = convertUTCDateToLocalDate(date);
        //var converted = date;
        var year = converted.getFullYear();
        var month = converted.getMonth() + 1;
        var day = converted.getDate();
        return day + "/" + month + "/" + year;
    }
    // Helper format date to db
    function formatDateToDB(date)
    {
        if (date == "")
        {
            return null;
        }
        var from = date.split("/");
        var converted = new Date(from[2], from[1] - 1, from[0]);
        var result = Date.UTC(from[2], from[1] - 1, from[0])
        return "/Date(" + result + ")/";
    }

    // Helper converter
    function convertUTCDateToLocalDate(date) {
        var newDate = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);

        var offset = date.getTimezoneOffset() / 60;
        var hours = date.getHours();

        newDate.setHours(hours - offset);

        return newDate;
    }
    // Datepicker
    var nowTemp = new Date();
    var now = new Date(nowTemp.getFullYear(), nowTemp.getMonth(), nowTemp.getDate(), 0, 0, 0, 0);
    var options = {
        format: 'dd/mm/yyyy',
        weekStart: 1,
        viewMode: 0,
        onRender: function (date) {
            return now.valueOf(); // get current date on first render
        }
    }
    $('.datepicker').datepicker(options);
});