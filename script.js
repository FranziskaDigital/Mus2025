let staticObjects = [];
let people = [];
let vocabs = {};
let userObjects = [];

async function loadData() {
    staticObjects = await fetch("data/objects.json").then(r => r.json());
    people = await fetch("data/people.json").then(r => r.json());
    vocabs = await fetch("data/vocabularies.json").then(r => r.json());

    const stored = localStorage.getItem("userObjects");
    userObjects = stored ? JSON.parse(stored) : [];

    populateDropdowns();
    populateFilterDropdowns();
    displayObjects();
}

function populateDropdowns() {
    const typeSelect = document.getElementById("object_type");
    const materialSelect = document.getElementById("material");

    Object.entries(vocabs.object_types).forEach(([key, value]) => {
        typeSelect.innerHTML += `<option value="${key}">${value.label}</option>`;
    });

    Object.entries(vocabs.materials).forEach(([key, value]) => {
        materialSelect.innerHTML += `<option value="${key}">${value.label}</option>`;
    });
}

function populateFilterDropdowns() {
    const filterType = document.getElementById("filter-type");
    const filterMaterial = document.getElementById("filter-material");

    Object.entries(vocabs.object_types).forEach(([key, value]) => {
        filterType.innerHTML += `<option value="${key}">${value.label}</option>`;
    });

    Object.entries(vocabs.materials).forEach(([key, value]) => {
        filterMaterial.innerHTML += `<option value="${key}">${value.label}</option>`;
    });

    filterType.addEventListener("change", displayObjects);
    filterMaterial.addEventListener("change", displayObjects);
}

function getFilteredObjects() {
    const typeFilter = document.getElementById("filter-type").value;
    const materialFilter = document.getElementById("filter-material").value;

    const all = [...staticObjects, ...userObjects];

    return all.filter(o =>
        (typeFilter === "" || o.object_type === typeFilter) &&
        (materialFilter === "" || o.material === materialFilter)
    );
}

function displayObjects() {
    const container = document.getElementById("object-list");
    container.innerHTML = "";

    const objects = getFilteredObjects();

    objects.forEach(o => {
        const type = vocabs.object_types[o.object_type];
        const material = vocabs.materials[o.material];
        const creator = people.find(p => p.id === o.creator);

        const div = document.createElement("div");
        div.className = "object-card";

        div.innerHTML = `
            <h3>${o.title}</h3>

            <p><strong>Objektart:</strong> ${type.label}
            <br><small><a href="${type.uri}" target="_blank">${type.uri}</a></small></p>

            <p><strong>Material:</strong> ${material.label}
            <br><small><a href="${material.uri}" target="_blank">${material.uri}</a></small></p>

            <p><strong>Datierung:</strong> ${o.date}</p>

            <p><strong>Inventarnummer:</strong> ${o.inventory_number}</p>

            <p><strong>Beschreibung:</strong> ${o.description}</p>

            ${creator ? `<p><strong>Hersteller:</strong> 
                ${creator.name}<br>
                <small><a href="${creator.uri}" target="_blank">${creator.uri}</a></small></p>` : ""}
        `;

        container.appendChild(div);
    });
}

document.getElementById("object-form").addEventListener("submit", e => {
    e.preventDefault();

    const newObj = {
        id: Date.now(),
        title: document.getElementById("title").value,
        object_type: document.getElementById("object_type").value,
        material: document.getElementById("material").value,
        date: document.getElementById("date").value,
        inventory_number: document.getElementById("inventory_number").value,
        description: document.getElementById("description").value,
        creator: null
    };

    userObjects.push(newObj);
    localStorage.setItem("userObjects", JSON.stringify(userObjects));

    document.getElementById("object-form").reset();
    displayObjects();
});

document.getElementById("export-btn").addEventListener("click", () => {
    const allObjects = [...staticObjects, ...userObjects];

    const headers = [
        "id", "title", "object_type", "material", "date",
        "inventory_number", "description", "creator"
    ];

    const csvRows = [];
    csvRows.push(headers.join(","));

    allObjects.forEach(obj => {
        const row = headers.map(h => {
            let val = obj[h] ?? "";
            return '"' + String(val).replace(/"/g, '""') + '"';
        }).join(",");
        csvRows.push(row);
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "museum-daten-export.csv";
    a.click();

    URL.revokeObjectURL(url);
});

document.getElementById("csv-input").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const text = await file.text();
    const rows = text.split("\n").map(r => r.trim()).filter(r => r.length > 0);

    const headers = rows[0].split(",").map(h => h.trim());
    const imported = [];

    for (let i = 1; i < rows.length; i++) {
        const values = rows[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)
            .map(v => v.replace(/^"|"$/g, "").replace(/""/g, '"'));

        const obj = {};
        headers.forEach((h, idx) => {
            obj[h] = values[idx] ?? "";
        });

        obj.id = Number(obj.id) || Date.now() + i;

        imported.push(obj);
    }

    userObjects = [...userObjects, ...imported];
    localStorage.setItem("userObjects", JSON.stringify(userObjects));

    displayObjects();
});

loadData();
