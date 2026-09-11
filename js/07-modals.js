// js/07-modals.js
// Модальные окна: React компонент TaskModal
// Все функции доступны глобально (window объект)

/**
 * React компонент модального окна задачи
 * Используется для создания и редактирования задач
 */
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
                            defaultValue: task ? (task.due || task.deadline || '') : ''
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
                            deadline: deadline || null,
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

// Пустые функции-заглушки для обратной совместимости
// Реальная логика модальных окон теперь в React компоненте TaskModal
window.openCreateModal = function() { console.log('openCreateModal: используйте React компонент'); };
window.openEditModal = async function() { console.log('openEditModal: используйте React компонент'); };
window.openSettingsModal = function() { console.log('openSettingsModal: используйте React компонент'); };
window.openAdminModal = function() { console.log('openAdminModal: используйте React компонент'); };
window.refreshTypesList = function() { console.log('refreshTypesList: типы обновляются реактивно'); };
window.closeModal = function() { console.log('closeModal: управляется через состояние в App'); };
