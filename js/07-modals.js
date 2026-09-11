// js/07-modals.js
// Модальные окна: Создание/Редактирование задачи, Настройки, Админка

// Все функции доступны глобально (window объект)
// Импорт не используется в версии без сборщика

// --- React компонент TaskModal ---
window.TaskModal = function TaskModal(props) {
    var el = React.createElement;
    
    // Получаем данные задачи
    var task = props.init || props.live;
    var isEdit = !!props.init;
    
    if (!task && !isEdit) return null;
    
    return el('div', { className: 'modal-overlay', style: { display: 'flex' } }, [
        el('div', { id: 'task-modal', className: 'modal-window', style: { display: 'block' } }, [
            el('div', { className: 'modal-header' }, [
                el('h2', { id: 'modal-title' }, isEdit ? 'Редактировать задачу' : 'Новая задача'),
                el('button', { 
                    className: 'close-modal', 
                    onClick: props.onClose,
                    style: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }
                }, '×')
            ]),
            el('div', { className: 'modal-body' }, [
                el('form', { id: 'task-form' }, [
                    el('div', { className: 'form-row' }, [
                        el('label', { htmlFor: 'task-title' }, 'Заголовок'),
                        el('input', { 
                            type: 'text', 
                            id: 'task-title', 
                            defaultValue: task ? task.title : '',
                            required: true,
                            placeholder: 'Введите заголовок задачи'
                        })
                    ]),
                    el('div', { className: 'form-row' }, [
                        el('label', { htmlFor: 'task-description' }, 'Описание'),
                        el('textarea', { 
                            id: 'task-description',
                            defaultValue: task ? (task.description || '') : '',
                            rows: 3,
                            placeholder: 'Описание задачи'
                        })
                    ]),
                    el('div', { className: 'form-row' }, [
                        el('label', { htmlFor: 'task-deadline' }, 'Дедлайн'),
                        el('input', { 
                            type: 'date', 
                            id: 'task-deadline',
                            defaultValue: task ? (task.due || '') : ''
                        })
                    ]),
                    el('div', { className: 'form-row' }, [
                        el('label', { htmlFor: 'task-column' }, 'Колонка'),
                        el('select', { id: 'task-column', defaultValue: task ? (task.columnId || task.col || 'new') : 'new' }, [
                            el('option', { value: 'new' }, 'Новая'),
                            el('option', { value: 'inprogress' }, 'В работе'),
                            el('option', { value: 'review' }, 'На проверке'),
                            el('option', { value: 'done' }, 'Готово')
                        ])
                    ]),
                    el('div', { className: 'form-row' }, [
                        el('label', { htmlFor: 'task-type' }, 'Тип'),
                        el('select', { id: 'task-type', defaultValue: task ? (task.typeId || '') : '' }, [
                            el('option', { value: '' }, 'Без типа'),
                            el('option', { value: 'feature' }, 'Фича'),
                            el('option', { value: 'bug' }, 'Баг'),
                            el('option', { value: 'task' }, 'Задача')
                        ])
                    ])
                ])
            ]),
            el('div', { className: 'modal-footer', style: { display: 'flex', justifyContent: 'space-between', marginTop: '20px' } }, [
                isEdit ? el('button', {
                    type: 'button',
                    id: 'delete-task-btn',
                    className: 'btn-danger',
                    onClick: function() {
                        if (confirm('Вы уверены, что хотите удалить эту задачу?')) {
                            props.onDelete && props.onDelete(task.id);
                            props.onClose();
                        }
                    },
                    style: { background: '#dc3545', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }
                }, 'Удалить') : el('span'),
                el('button', {
                    type: 'submit',
                    form: 'task-form',
                    className: 'btn-primary',
                    onClick: function(e) {
                        e.preventDefault();
                        var title = document.getElementById('task-title').value.trim();
                        var description = document.getElementById('task-description').value.trim();
                        var deadline = document.getElementById('task-deadline').value;
                        var columnId = document.getElementById('task-column').value;
                        var typeId = document.getElementById('task-type').value || null;
                        
                        if (!title) {
                            alert('Введите заголовок задачи');
                            return;
                        }
                        
                        var taskData = {
                            title: title,
                            description: description,
                            due: deadline || null,
                            columnId: columnId === 'new' ? 'new' : columnId,
                            col: columnId === 'new' ? 'new' : columnId,
                            typeId: typeId,
                            updatedAt: Date.now()
                        };
                        
                        if (isEdit && task) {
                            props.onSave && props.onSave(task.id, Object.assign({}, task, taskData));
                        } else {
                            var newId = 't' + Date.now().toString(36);
                            var newTask = Object.assign({
                                id: newId,
                                createdAt: Date.now(),
                                files: [],
                                comments: []
                            }, taskData);
                            props.onSave && props.onSave(newId, newTask);
                        }
                        props.onClose();
                    },
                    style: { background: '#007bff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }
                }, 'Сохранить')
            ])
        ])
    ]);
};

// --- Элементы модальных окон ---
const modalOverlay = document.getElementById('modal-overlay');
const taskModal = document.getElementById('task-modal');
const settingsModal = document.getElementById('settings-modal');
const adminModal = document.getElementById('admin-modal');

// Кнопки закрытия
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', closeModal);
});

// Закрытие по клику на фон
if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });
}

let currentEditId = null;
let isEditMode = false;

// --- Открытие модального окна создания задачи ---
window.openCreateModal = function(columnId, defaultType = '') {
    isEditMode = false;
    currentEditId = null;
    
    const form = document.getElementById('task-form');
    form.reset();
    
    // Сброс значений
    document.getElementById('task-title').value = '';
    document.getElementById('task-description').value = '';
    document.getElementById('task-deadline').value = '';
    document.getElementById('task-column').value = columnId || 'new';
    
    // Установка типа (если передан)
    const typeSelect = document.getElementById('task-type');
    if (defaultType && typeSelect.querySelector(`option[value="${defaultType}"]`)) {
        typeSelect.value = defaultType;
    } else {
        typeSelect.value = '';
    }

    // Скрыть поля, не нужные при создании
    document.getElementById('task-created-at-row').style.display = 'none';
    document.getElementById('task-files-list').innerHTML = '';
    document.getElementById('task-files-list').style.display = 'none';

    // Заголовок
    document.getElementById('modal-title').textContent = 'Новая задача';
    document.getElementById('delete-task-btn').style.display = 'none';

    modalOverlay.style.display = 'flex';
    taskModal.style.display = 'block';
    
    // Фокус на заголовок
    setTimeout(() => document.getElementById('task-title').focus(), 100);
}

// --- Открытие модального окна редактирования задачи ---
window.openEditModal = async function(taskId) {
    isEditMode = true;
    currentEditId = taskId;

    const task = db.tasks.find(t => t.id === taskId);
    if (!task) return;

    // Заполнение полей
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-description').value = task.description || '';
    document.getElementById('task-deadline').value = task.deadline || '';
    document.getElementById('task-column').value = task.columnId;
    
    // Выбор типа в выпадающем списке
    const typeSelect = document.getElementById('task-type');
    typeSelect.value = task.typeId || '';

    // Отображение даты создания
    const createdAtRow = document.getElementById('task-created-at-row');
    createdAtRow.style.display = 'block';
    document.getElementById('task-created-at').textContent = formatDate(task.createdAt);

    // Отображение файлов
    const filesList = document.getElementById('task-files-list');
    filesList.innerHTML = '';
    if (task.files && task.files.length > 0) {
        filesList.style.display = 'block';
        task.files.forEach((file, index) => {
            const div = document.createElement('div');
            div.className = 'file-item';
            div.innerHTML = `
                <span class="file-name">${file.name}</span>
                <button class="btn-icon delete-file" data-index="${index}" title="Удалить файл">
                    ${icons.trash}
                </button>
            `;
            filesList.appendChild(div);
        });
        
        // Навешиваем обработчики на удаление файлов
        filesList.querySelectorAll('.delete-file').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.closest('button').dataset.index);
                deleteFileFromTask(idx);
            });
        });
    } else {
        filesList.style.display = 'none';
    }

    // Заголовок и кнопка удаления
    document.getElementById('modal-title').textContent = 'Редактировать задачу';
    document.getElementById('delete-task-btn').style.display = 'inline-block';

    modalOverlay.style.display = 'flex';
    taskModal.style.display = 'block';
}

// --- Удаление файла из текущей задачи (временное, до сохранения) ---
// Примечание: В простой реализации без сборщика файлов, мы просто пометим их на удаление 
// или будем перезаписывать массив. Для простоты: при сохранении мы берем текущий список из UI.
// Но так как input file не хранит старые файлы, нам нужно хранить состояние в памяти.
let tempFiles = []; 

function deleteFileFromTask(index) {
    // Если мы в режиме редактирования, удаляем из временного списка или помечаем
    // Для упрощения: просто перерисуем список без этого элемента, но реальные файлы 
    // (ссылки на Firebase) нужно будет отфильтровать при сохранении.
    // В данной версии мы просто удаляем визуальный элемент, а логику сохранения упростим:
    // При сохранении мы не трогаем старые файлы, если не загружены новые. 
    // *Упрощение*: удаление файлов доступно только через полное переключение.
    alert("Удаление отдельных файлов в этой версии недоступно. Файлы можно добавить новыми.");
}

// --- Сохранение задачи ---
document.getElementById('task-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('task-title').value.trim();
    const description = document.getElementById('task-description').value.trim();
    const deadline = document.getElementById('task-deadline').value;
    const columnId = document.getElementById('task-column').value;
    const typeId = document.getElementById('task-type').value || null;

    if (!title) {
        alert('Введите заголовок задачи');
        return;
    }

    // Обработка файлов (упрощенно: берем только новые, если выбраны)
    // В полноценной версии нужно мержить старые и новые файлы.
    // Здесь мы просто сохраняем задачу, файлы не меняем, если не реализован загрузчик в модалке.
    // Input file в модалке скрыт, загрузка идет через основную кнопку "Прикрепить".
    
    const taskData = {
        title,
        description,
        deadline: deadline || null,
        columnId: columnId === 'new' ? 'new' : columnId,
        typeId: typeId,
        updatedAt: Date.now()
    };

    try {
        if (isEditMode && currentEditId) {
            // Редактирование
            const oldTask = db.tasks.find(t => t.id === currentEditId);
            await saveTask(currentEditId, {
                ...oldTask,
                ...taskData
            });
        } else {
            // Создание
            const newId = generateId();
            const newTask = {
                id: newId,
                columnId: taskData.columnId,
                createdAt: Date.now(),
                files: [],
                comments: [],
                ...taskData
            };
            await saveTask(newId, newTask);
        }
        closeModal();
        // Перерисовка произойдет автоматически через слушатель data.js
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        alert('Не удалось сохранить задачу');
    }
});

// --- Удаление задачи ---
document.getElementById('delete-task-btn').addEventListener('click', async () => {
    if (!isEditMode || !currentEditId) return;
    
    if (confirm('Вы уверены, что хотите удалить эту задачу?')) {
        try {
            await deleteTask(currentEditId);
            closeModal();
        } catch (error) {
            console.error('Ошибка удаления:', error);
            alert('Не удалось удалить задачу');
        }
    }
});

// --- Модальное окно настроек ---
window.openSettingsModal = function() {
    const settings = getSettings();
    document.getElementById('settings-board-title').value = settings.boardTitle;
    document.getElementById('settings-show-avatars').checked = settings.showAvatars;
    document.getElementById('settings-show-dates').checked = settings.showDates;
    document.getElementById('settings-show-types').checked = settings.showTypes;
    
    modalOverlay.style.display = 'flex';
    settingsModal.style.display = 'block';
}

document.getElementById('settings-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const newSettings = {
        boardTitle: document.getElementById('settings-board-title').value.trim() || 'ПОТОК',
        showAvatars: document.getElementById('settings-show-avatars').checked,
        showDates: document.getElementById('settings-show-dates').checked,
        showTypes: document.getElementById('settings-show-types').checked
    };
    saveSettings(newSettings);
    closeModal();
    alert('Настройки сохранены');
});

// --- Админ панель (Типы задач) ---
window.openAdminModal = function() {
    renderTypesList();
    modalOverlay.style.display = 'flex';
    adminModal.style.display = 'block';
}

function renderTypesList() {
    const list = document.getElementById('types-list');
    list.innerHTML = '';
    
    // Берем типы из глобального объекта db.types (он обновляется из Firebase)
    // Или напрямую из Firebase, если db еще не обновился
    const types = db.types || {};
    
    Object.entries(types).forEach(([id, name]) => {
        const div = document.createElement('div');
        div.className = 'type-item';
        div.innerHTML = `
            <span class="type-name">${name}</span>
            <button class="btn-icon delete-type" data-id="${id}" title="Удалить тип">
                ${icons.trash}
            </button>
        `;
        list.appendChild(div);
    });

    // Обработчики удаления
    list.querySelectorAll('.delete-type').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.closest('button').dataset.id;
            if (confirm('Удалить этот тип? Задачи останутся без типа.')) {
                await deleteType(id);
            }
        });
    });
}

// Добавление нового типа
document.getElementById('add-type-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('new-type-name');
    const name = nameInput.value.trim();
    
    if (name) {
        await saveType(name); // Создаст новый ID автоматически
        nameInput.value = '';
        renderTypesList();
    }
});

// --- Закрытие любого модального окна ---
function closeModal() {
    modalOverlay.style.display = 'none';
    taskModal.style.display = 'none';
    settingsModal.style.display = 'none';
    adminModal.style.display = 'none';
    
    // Сброс формы задачи
    if (!isEditMode) {
        document.getElementById('task-form').reset();
    }
}

// Экспорт функции обновления списка типов (вызывается из app.js при изменении данных)
window.refreshTypesList = function() {
    if (adminModal.style.display === 'block') {
        renderTypesList();
    }
    // Также обновляем выпадающий список в открытой модалке задачи, если она есть
    if (taskModal.style.display === 'block') {
        const typeSelect = document.getElementById('task-type');
        const currentVal = typeSelect.value;
        populateTypeSelect(typeSelect);
        typeSelect.value = currentVal;
    }
}

function populateTypeSelect(selectElement) {
    selectElement.innerHTML = '<option value="">Без типа</option>';
    const types = db.types || {};
    Object.entries(types).forEach(([id, name]) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = name;
        selectElement.appendChild(option);
    });
}

// Инициализация выпадающего списка при загрузке
document.addEventListener('DOMContentLoaded', () => {
    const typeSelect = document.getElementById('task-type');
    if (typeSelect) {
        populateTypeSelect(typeSelect);
    }
});
