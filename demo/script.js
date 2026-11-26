// 1. ข้อมูลเริ่มต้น (10 งานสำหรับกะ A เพื่อทดสอบการทำงานต่อเนื่องระหว่างกะ)
const tasks = [
    { id: "TK001", detail: "ตรวจสอบระบบ LAN", owner: "A", originShift: null, status: "In Progress" },
    { id: "TK002", detail: "ตรวจสอบระบบ Wi-Fi", owner: "A", originShift: null, status: "In Progress" },
    { id: "TK003", detail: "ตรวจสอบเครื่อง Printer", owner: "A", originShift: null, status: "In Progress" },
    { id: "TK004", detail: "อัปเดตแพตช์เครื่องแม่ข่าย", owner: "A", originShift: null, status: "In Progress" },
    { id: "TK005", detail: "สำรองข้อมูลรายวัน (Backup)", owner: "A", originShift: null, status: "In Progress" },
    { id: "TK006", detail: "ตรวจสอบสถานะ Firewall", owner: "A", originShift: null, status: "In Progress" },
    { id: "TK007", detail: "ตรวจเช็กห้อง Server และอุณหภูมิ", owner: "A", originShift: null, status: "In Progress" },
    { id: "TK008", detail: "ตรวจสอบ Log การเข้าใช้งานระบบ", owner: "A", originShift: null, status: "In Progress" },
    { id: "TK009", detail: "ตรวจเช็กเครื่องสำรองไฟ (UPS)", owner: "A", originShift: null, status: "In Progress" },
    { id: "TK010", detail: "ตรวจสอบแจ้งซ่อมอุปกรณ์แผนกบัญชี", owner: "A", originShift: null, status: "In Progress" }
];

const SHIFT_ORDER = ["A", "B", "C"];

const STATUS_META = {
    "In Progress": { className: "status status-progress", label: "กำลังดำเนินการ" },
    "Pending Claim": { className: "status status-pending", label: "รอรับช่วงต่อ" },
    "Completed": { className: "status status-completed", label: "เสร็จแล้ว" }
};

// 2. ตัวแปรหลักและ Element อ้างอิง
let activeShift = null;

const taskList = document.getElementById("taskList");
const queueList = document.getElementById("queueList");

const shiftSelect = document.getElementById("shiftSelect");
const startShiftButton = document.getElementById("startShift");
const endShiftButton = document.getElementById("endShift");

const currentShiftDisplay = document.getElementById("currentShift");
const statusMessage = document.getElementById("statusMessage");

const taskDetailInput = document.getElementById("taskDetail");
const addTaskButton = document.getElementById("addTaskButton");
const claimAllButton = document.getElementById("claimAllButton");

const totalTasksDisplay = document.getElementById("totalTasks");
const progressTasksDisplay = document.getElementById("progressTasks");
const pendingTasksDisplay = document.getElementById("pendingTasks");
const completedTasksDisplay = document.getElementById("completedTasks");

// 3. ฟังก์ชันช่วยเหลือสำหรับ UI
function showMessage(text) {
    statusMessage.textContent = text;
}

function getStatusBadge(status) {
    const meta = STATUS_META[status] || { className: "status", label: status };
    const badge = document.createElement("span");
    badge.className = meta.className;
    badge.textContent = meta.label;
    return badge;
}

function createEmptyRow(colSpan, text) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = colSpan;
    cell.className = "empty";
    cell.textContent = text;
    row.appendChild(cell);
    return row;
}

function getNextShift(currentShift) {
    const index = SHIFT_ORDER.indexOf(currentShift);
    if (index === -1) {
        return SHIFT_ORDER[0];
    }
    return SHIFT_ORDER[(index + 1) % SHIFT_ORDER.length];
}

function updateControls() {
    const hasActiveShift = activeShift !== null;
    shiftSelect.disabled = hasActiveShift;
    startShiftButton.disabled = hasActiveShift;
    endShiftButton.disabled = !hasActiveShift;
    taskDetailInput.disabled = !hasActiveShift;
    addTaskButton.disabled = !hasActiveShift;
}

// 4. แสดงรายการงานทั้งหมด
function renderTasks() {
    taskList.innerHTML = "";

    if (tasks.length === 0) {
        taskList.appendChild(createEmptyRow(5, "ยังไม่มีรายการงานในระบบ"));
        return;
    }

    tasks.forEach(task => {
        const row = document.createElement("tr");

        const idCell = document.createElement("td");
        idCell.textContent = task.id;
        row.appendChild(idCell);

        const detailCell = document.createElement("td");
        detailCell.textContent = task.detail;
        row.appendChild(detailCell);

        const ownerCell = document.createElement("td");
        ownerCell.textContent = task.owner && task.owner !== "-"
            ? "Shift " + task.owner
            : "ส่วนกลาง (-)";
        row.appendChild(ownerCell);

        const statusCell = document.createElement("td");
        statusCell.appendChild(getStatusBadge(task.status));
        row.appendChild(statusCell);

        const actionCell = document.createElement("td");

        if (
            activeShift !== null &&
            task.status === "In Progress" &&
            task.owner === activeShift
        ) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "btn-success";
            button.textContent = "ปิดงาน";
            button.addEventListener("click", () => completeTask(task.id));
            actionCell.appendChild(button);
        } else {
            actionCell.textContent = "-";
        }

        row.appendChild(actionCell);
        taskList.appendChild(row);
    });
}

// 5. แสดง Central Queue (ส่วนกลาง)
function renderQueue() {
    queueList.innerHTML = "";

    const pendingTasks = tasks.filter(task => task.status === "Pending Claim");

    claimAllButton.textContent = `รับงานทั้งหมด (${pendingTasks.length})`;
    claimAllButton.disabled = activeShift === null || pendingTasks.length === 0;

    if (pendingTasks.length === 0) {
        queueList.appendChild(createEmptyRow(5, "ไม่มีงานค้างในส่วนกลาง"));
        return;
    }

    pendingTasks.forEach(task => {
        const row = document.createElement("tr");

        const idCell = document.createElement("td");
        idCell.textContent = task.id;
        row.appendChild(idCell);

        const detailCell = document.createElement("td");
        detailCell.textContent = task.detail;
        row.appendChild(detailCell);

        const originCell = document.createElement("td");
        originCell.textContent = task.originShift ? "Shift " + task.originShift : "-";
        row.appendChild(originCell);

        const statusCell = document.createElement("td");
        statusCell.appendChild(getStatusBadge(task.status));
        row.appendChild(statusCell);

        const actionCell = document.createElement("td");
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = "รับงาน";
        button.disabled = activeShift === null;
        button.addEventListener("click", () => claimTask(task.id));

        actionCell.appendChild(button);
        row.appendChild(actionCell);
        queueList.appendChild(row);
    });
}

// 6. สรุปจำนวนงาน
function updateSummary() {
    const total = tasks.length;
    const progress = tasks.filter(task => task.status === "In Progress").length;
    const pending = tasks.filter(task => task.status === "Pending Claim").length;
    const completed = tasks.filter(task => task.status === "Completed").length;

    totalTasksDisplay.textContent = total;
    progressTasksDisplay.textContent = progress;
    pendingTasksDisplay.textContent = pending;
    completedTasksDisplay.textContent = completed;
}

function renderAll() {
    renderTasks();
    renderQueue();
    updateSummary();
    updateControls();
}

// 7. เริ่มกะ
startShiftButton.addEventListener("click", () => {
    if (activeShift !== null) {
        showMessage("กรุณาจบกะปัจจุบันก่อนเริ่มกะใหม่");
        return;
    }

    activeShift = shiftSelect.value;
    currentShiftDisplay.textContent = "กำลังทำงาน: Shift " + activeShift;

    const pendingCount = tasks.filter(task => task.status === "Pending Claim").length;
    renderAll();

    if (pendingCount > 0) {
        showMessage(`เริ่มกะ Shift ${activeShift} แล้ว มีงานค้างในส่วนกลาง ${pendingCount} งาน สามารถกด "รับงาน" หรือ "รับงานทั้งหมด" เพื่อรับช่วงต่อได้`);
    } else {
        showMessage(`เริ่มกะ Shift ${activeShift} เรียบร้อยแล้ว`);
    }
});

// 8. จบกะ (ส่งงานที่ยังทำไม่เสร็จเข้าส่วนกลาง)
endShiftButton.addEventListener("click", () => {
    if (activeShift === null) {
        showMessage("กรุณาเริ่มกะก่อนจบกะ");
        return;
    }

    const endingShift = activeShift;
    let movedCount = 0;

    tasks.forEach(task => {
        if (task.owner === endingShift && task.status === "In Progress") {
            task.originShift = endingShift;
            task.owner = "-";
            task.status = "Pending Claim";
            movedCount += 1;
        }
    });

    activeShift = null;
    currentShiftDisplay.textContent = "ยังไม่ได้เริ่มกะ";
    shiftSelect.value = getNextShift(endingShift);

    renderAll();

    if (movedCount > 0) {
        showMessage(`จบกะ Shift ${endingShift} แล้ว ส่งงานค้าง ${movedCount} งานเข้าส่วนกลางเรียบร้อย (กะถัดไป: Shift ${shiftSelect.value})`);
    } else {
        showMessage(`จบกะ Shift ${endingShift} แล้ว ไม่มีงานค้างส่งเข้าส่วนกลาง (กะถัดไป: Shift ${shiftSelect.value})`);
    }
});

// 9. รับงานจากกองกลาง (รายชิ้น และทั้งหมด)
function claimTask(taskId) {
    if (activeShift === null) {
        showMessage("กรุณาเริ่มกะก่อนรับงาน");
        return;
    }

    const task = tasks.find(item => item.id === taskId);

    if (!task || task.status !== "Pending Claim") {
        showMessage("ไม่พบงานนี้ในส่วนกลาง หรือมีกะอื่นรับไปแล้ว");
        return;
    }

    task.owner = activeShift;
    task.status = "In Progress";

    renderAll();
    showMessage(`Shift ${activeShift} รับงาน ${task.id} (${task.detail}) เรียบร้อยแล้ว`);
}

function claimAllTasks() {
    if (activeShift === null) {
        showMessage("กรุณาเริ่มกะก่อนรับงาน");
        return;
    }

    const pendingTasks = tasks.filter(task => task.status === "Pending Claim");

    if (pendingTasks.length === 0) {
        showMessage("ไม่มีงานค้างในส่วนกลาง");
        return;
    }

    pendingTasks.forEach(task => {
        task.owner = activeShift;
        task.status = "In Progress";
    });

    renderAll();
    showMessage(`Shift ${activeShift} รับงานจากส่วนกลางทั้งหมด ${pendingTasks.length} งานเรียบร้อยแล้ว`);
}

// 10. ปิดงาน
function completeTask(taskId) {
    const task = tasks.find(item => item.id === taskId);

    if (!task) {
        showMessage("ไม่พบงานนี้");
        return;
    }

    if (
        activeShift === null ||
        task.status !== "In Progress" ||
        task.owner !== activeShift
    ) {
        showMessage("คุณไม่มีสิทธิ์ปิดงานนี้");
        return;
    }

    task.status = "Completed";

    renderAll();
    showMessage(`ปิดงาน ${task.id} (${task.detail}) เรียบร้อยแล้ว`);
}

// 11. เพิ่มงานใหม่
function addTask() {
    if (activeShift === null) {
        showMessage("กรุณาเริ่มกะก่อนเพิ่มงาน");
        return;
    }

    const detail = taskDetailInput.value.trim();

    if (detail === "") {
        showMessage("กรุณากรอกรายละเอียดงาน");
        return;
    }

    const newId = "TK" + String(
        Math.max(0, ...tasks.map(task => Number(task.id.replace("TK", "")) || 0)) + 1
    ).padStart(3, "0");

    tasks.push({
        id: newId,
        detail: detail,
        owner: activeShift,
        originShift: null,
        status: "In Progress"
    });

    taskDetailInput.value = "";

    renderAll();
    showMessage(`เพิ่มงาน ${newId} ให้ Shift ${activeShift} เรียบร้อยแล้ว`);
}

// 12. เชื่อมเหตุการณ์และเริ่มต้นระบบ
addTaskButton.addEventListener("click", addTask);
claimAllButton.addEventListener("click", claimAllTasks);
taskDetailInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        addTask();
    }
});

renderAll();
