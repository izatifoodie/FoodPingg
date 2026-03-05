document.addEventListener("DOMContentLoaded", function () {
    renderTable();

    // minta permission notification
    if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
    }
});

function getFoods() {
    return JSON.parse(localStorage.getItem("foods")) || [];
}

function saveFoods(foods) {
    localStorage.setItem("foods", JSON.stringify(foods));
}

function addFood() {
    let name = document.getElementById("foodName").value.trim();
    let date = document.getElementById("expiryDate").value.trim();

    if (name === "" || date === "") {
        alert("Sila masukkan nama dan tarikh luput!");
        return;
    }

    let parts = date.split("/");
    if (parts.length !== 3) {
        alert("Format tarikh mesti DD/MM/YY");
        return;
    }

    let foods = getFoods();
    foods.push({ name, date });

    saveFoods(foods);

    renderTable();

    document.getElementById("foodName").value = "";
    document.getElementById("expiryDate").value = "";
}

function parseDate(dateStr) {
    let parts = dateStr.split("/");
    let day = parseInt(parts[0]);
    let month = parseInt(parts[1]) - 1;
    let year = parseInt(parts[2]);

    if (year < 100) year += 2000;

    return new Date(year, month, day);
}

function renderTable() {

    let table = document.getElementById("foodTable");
    if (!table) return;

    while (table.rows.length > 1) {
        table.deleteRow(1);
    }

    let foods = getFoods();

    foods.forEach((food, index) => {

        let expiryDate = parseDate(food.date);
        let now = new Date();
        now.setHours(0,0,0,0);

        let diffDays = Math.ceil((expiryDate - now) / (1000*60*60*24));

        let row = table.insertRow();

        row.insertCell(0).innerHTML = food.name;
        row.insertCell(1).innerHTML = food.date;

        let statusCell = row.insertCell(2);

        if (diffDays > 3) {

            statusCell.innerHTML = "🟢 Lagi " + diffDays + " hari";
            statusCell.style.color = "green";

        } 
        else if (diffDays > 0) {

            statusCell.innerHTML = "🟡 Lagi " + diffDays + " hari";
            statusCell.style.color = "orange";

            showNotification(food.name, diffDays);

        } 
        else if (diffDays === 0) {

            statusCell.innerHTML = "🔴 Expired Hari Ini";
            statusCell.style.color = "red";

            showNotification(food.name, 0);

        } 
        else {

            statusCell.innerHTML = "🔴 Expired";
            statusCell.style.color = "red";

        }

        // delete button
        let delCell = row.insertCell(3);
        let delBtn = document.createElement("button");

        delBtn.innerHTML = "Delete";
        delBtn.style.backgroundColor = "rgb(90 35 55)";
        delBtn.style.color = "white";
        delBtn.style.border = "none";
        delBtn.style.borderRadius = "16px";
        delBtn.style.padding = "5px 10px";
        delBtn.style.cursor = "pointer";

        delBtn.onclick = function () {

            let foods = getFoods();
            foods.splice(index,1);

            saveFoods(foods);
            renderTable();

        };

        delCell.appendChild(delBtn);

    });

}

function showNotification(foodName, days){

    if(!("Notification" in window)) return;

    if(Notification.permission === "granted"){

        let msg;

        if(days === 0){
            msg = foodName + " expired hari ini!";
        }else{
            msg = foodName + " hampir expired (" + days + " hari lagi)";
        }

        new Notification("FoodPing Alert!",{
            body: msg,
            icon: "icon.png"
        });

        if(navigator.vibrate){
            navigator.vibrate([200,100,200]);
        }

    }

}

function deleteAllExpired(){

    let foods = getFoods();

    let now = new Date();
    now.setHours(0,0,0,0);

    let updatedFoods = foods.filter(food=>{
        let expiryDate = parseDate(food.date);
        return expiryDate >= now;
    });

    saveFoods(updatedFoods);
    renderTable();

}
