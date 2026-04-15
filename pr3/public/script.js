let filter = "all";
let editId = null;
let chart;

const form = document.getElementById("form");
const list = document.getElementById("list");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(form));

    if (!data.number || !data.object || !data.meter || !data.verificationDate) {
        alert("Будь ласка, заповніть всі обов'язкові поля!");
        return;
    }

    if (editId) {
        await fetch("/api/" + editId, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        editId = null;
    } else {
        await fetch("/api", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
    }

    form.reset();
    load();
});


form.addEventListener("reset", () => {
    editId = null;
});

function setFilter(f) {
    filter = f;
    load();
}

async function load() {
    try {
        const res = await fetch("/api");
        let data = await res.json();

        const now = new Date();

        
        data.forEach(i => {
            i.expired = new Date(i.verificationDate) < now;
        });

        
        if (filter === "expired") {
            data = data.filter(i => i.expired);
        }

        
        list.innerHTML = data.map(i => `
            <div class="consumer-card ${i.expired ? 'expired' : 'ok'}">
                <div class="card-header">
                    <h3><b>${i.number}</b> — ${i.object}</h3>
                    <span class="badge ${i.expired ? 'badge-danger' : 'badge-success'}">
                        ${i.expired ? "ПРОСТРОЧЕНО" : "АКТУАЛЬНО"}
                    </span>
                </div>
                <p><span class="label">Лічильник:</span> ${i.meter}</p>
                <p><span class="label">Дата повірки:</span> ${i.verificationDate}</p>
                
                <div class="card-actions">
                    <button type="button" class="btn btn-secondary" onclick="edit(${i.id})">Редагувати</button>
                    <button type="button" class="btn btn-delete" onclick="del(${i.id})">Видалити</button>
                </div>
            </div>
        `).join("");

        drawChart(data);
    } catch (error) {
        console.error("Помилка завантаження даних:", error);
        list.innerHTML = "<p>Не вдалося завантажити дані. Перевірте з'єднання з сервером.</p>";
    }
}

async function del(id) {
    if (confirm("Ви впевнені, що хочете видалити цю точку?")) {
        await fetch("/api/" + id, { method: "DELETE" });
        load();
    }
}

async function edit(id) {
    const res = await fetch("/api");
    const data = await res.json();
    const item = data.find(i => i.id == id);

    if (item) {
        form.number.value = item.number;
        form.object.value = item.object;
        form.meter.value = item.meter;
        form.verificationDate.value = item.verificationDate;
        form.control.checked = item.control || false;
        
        editId = id;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function drawChart(data) {
    const expired = data.filter(i => i.expired).length;
    const ok = data.length - expired;

    const ctx = document.getElementById("chart");

    if (chart) chart.destroy();

    if (data.length === 0) return;

    chart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Прострочені", "Актуальні"],
            datasets: [{
                data: [expired, ok],
                backgroundColor: [
                    '#ef4444', 
                    '#10b981'  
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, 
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            cutout: '70%'
        }
    });
}

load();