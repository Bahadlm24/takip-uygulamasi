import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Plus, Trash2, Calendar, GripVertical, X, FileText, Clock } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableTask = ({ task, onDelete, onView }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Determine background color based on completion status
  const bgColor = task.completed 
    ? 'bg-green-500/10 border-green-500/20' 
    : 'bg-red-500/10 border-red-500/20';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 p-4 rounded-xl border hover:border-primary/30 group mb-3 ${bgColor}`}
    >
      <div {...attributes} {...listeners} className="text-muted hover:text-primary p-1 cursor-grab active:cursor-grabbing touch-none">
        <GripVertical size={20} />
      </div>
      
      <div className="flex-1 cursor-pointer" onClick={() => onView(task)}>
        <p className="font-medium text-primary text-lg">{task.title}</p>
        {task.customerName && (
          <p className="text-sm text-accent-primary mt-1">👤 {task.customerName}</p>
        )}
        <div className="flex items-center gap-4 text-sm text-muted mt-1">
          <div className="flex items-center gap-1">
            <Calendar size={14} />
            {format(parseISO(task.createdAt), 'd MMM', { locale: tr })}
          </div>
          {task.dueDate && (
            <div className="flex items-center gap-1">
              <Clock size={14} />
              Bitiş: {format(parseISO(task.dueDate), 'd MMM', { locale: tr })}
            </div>
          )}
        </div>
      </div>

      <button 
        onClick={(e) => {
          e.stopPropagation();
          onDelete(task.id);
        }}
        className="p-3 text-muted hover:text-danger hover:bg-white/5 rounded-lg transition-colors"
      >
        <Trash2 size={20} />
      </button>
    </div>
  );
};

const DroppableColumn = ({ id, title, tasks, onDelete, onView }) => {
  const { setNodeRef } = useSortable({ id });

  return (
    <div className="flex-1 min-w-[300px]">
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="text-xl font-bold text-primary">{title}</h3>
        <span className="bg-white/10 px-3 py-1 rounded-full text-sm font-medium">{tasks.length}</span>
      </div>
      
      <div 
        ref={setNodeRef} 
        className="bg-white/5 rounded-2xl p-4 min-h-[500px] border border-white/5"
      >
        <SortableContext 
          items={tasks.map(t => t.id)} 
          strategy={verticalListSortingStrategy}
        >
          {tasks.map(task => (
            <SortableTask key={task.id} task={task} onDelete={onDelete} onView={onView} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="h-full flex items-center justify-center text-muted opacity-30 text-sm">
            Buraya sürükleyin
          </div>
        )}
      </div>
    </div>
  );
};

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    dueDate: '',
    notes: '',
    customerId: '',
    customerName: ''
  });
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadTasks();
    loadContacts();
  }, []);

  const loadTasks = async () => {
    try {
      const data = await api.getTasks();
      setTasks(data);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const loadContacts = async () => {
    try {
      const data = await api.getContacts();
      setContacts(data);
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      await api.createTask({
        title: formData.title,
        createdAt: new Date().toISOString(),
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
        notes: formData.notes,
        customerId: formData.customerId || null,
        customerName: formData.customerName || null,
        completed: false
      });
      setFormData({ title: '', dueDate: '', notes: '', customerId: '', customerName: '' });
      setCustomerSearch('');
      setShowAddModal(false);
      loadTasks();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu görevi silmek istediğinize emin misiniz?')) return;
    try {
      await api.deleteTask(id);
      loadTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleViewTask = (task) => {
    setSelectedTask(task);
    setShowDetailModal(true);
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeTask = tasks.find(t => t.id === active.id);
    if (!activeTask) return;

    // Determine target container (column)
    let targetContainer = over.id;
    
    // If dropped over a task, find that task's container
    if (targetContainer !== 'todo' && targetContainer !== 'done') {
      const overTask = tasks.find(t => t.id === over.id);
      if (overTask) {
        targetContainer = overTask.completed ? 'done' : 'todo';
      } else {
        return;
      }
    }

    const isCompleted = targetContainer === 'done';

    // Only update if status changed
    if (activeTask.completed !== isCompleted) {
      try {
        const updatedTasks = tasks.map(t => 
          t.id === active.id ? { ...t, completed: isCompleted } : t
        );
        setTasks(updatedTasks);

        await api.updateTask(active.id, { completed: isCompleted });
      } catch (error) {
        console.error('Error updating task status:', error);
        loadTasks();
      }
    }
  };

  const todoTasks = tasks.filter(t => !t.completed);
  const doneTasks = tasks.filter(t => t.completed);

  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-primary">İş Planı</h2>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
        >
          <Plus size={24} />
          Yeni Görev
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-8 overflow-x-auto pb-4 flex-1 items-start">
          <DroppableColumn 
            id="todo" 
            title="Yapılacaklar" 
            tasks={todoTasks} 
            onDelete={handleDelete}
            onView={handleViewTask}
          />
          <DroppableColumn 
            id="done" 
            title="Tamamlananlar" 
            tasks={doneTasks} 
            onDelete={handleDelete}
            onView={handleViewTask}
          />
        </div>

        <DragOverlay>
          {activeId ? (
            <div className="p-4 rounded-xl bg-secondary border border-primary shadow-2xl opacity-90">
              <p className="font-medium text-primary text-lg">
                {tasks.find(t => t.id === activeId)?.title}
              </p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-secondary p-8 rounded-2xl w-full max-w-2xl shadow-2xl border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-primary">Yeni Görev Oluştur</h3>
              <button onClick={() => setShowAddModal(false)} className="text-muted hover:text-primary">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddTask} className="space-y-6">
              <div>
                <label className="block text-base font-medium text-secondary mb-2">Görev Adı</label>
                <input
                  type="text"
                  className="input py-3 text-lg"
                  placeholder="Örn: Müşteri randevularını kontrol et"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="relative">
                <label className="block text-base font-medium text-secondary mb-2">Müşteri (Opsiyonel)</label>
                <input
                  type="text"
                  className="input py-3 text-lg"
                  placeholder="Müşteri ara..."
                  value={customerSearch || formData.customerName}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setShowCustomerDropdown(true);
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                />
                
                {showCustomerDropdown && customerSearch && (
                  <div className="absolute z-10 w-full mt-2 bg-tertiary border border-white/10 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                    {contacts
                      .filter(c => 
                        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                        c.phone.includes(customerSearch)
                      )
                      .map(contact => (
                        <div
                          key={contact.id}
                          onClick={() => {
                            setFormData({
                              ...formData,
                              customerId: contact.id,
                              customerName: contact.name
                            });
                            setCustomerSearch('');
                            setShowCustomerDropdown(false);
                          }}
                          className="p-3 hover:bg-white/5 cursor-pointer flex items-center justify-between border-b border-white/5 last:border-0"
                        >
                          <span className="text-primary font-medium">{contact.name}</span>
                          <span className="text-sm text-muted">{contact.phone}</span>
                        </div>
                      ))}
                    {contacts.filter(c => 
                      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                      c.phone.includes(customerSearch)
                    ).length === 0 && (
                      <div className="p-4 text-center text-muted">
                        Müşteri bulunamadı
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-base font-medium text-secondary mb-2">Bitiş Tarihi (Opsiyonel)</label>
                <input
                  type="date"
                  className="input py-3 text-lg"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-base font-medium text-secondary mb-2">Notlar (Opsiyonel)</label>
                <textarea
                  className="input py-3 text-lg min-h-[120px] resize-none"
                  placeholder="Görev hakkında notlar..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="flex gap-4">
                <button type="submit" className="btn btn-primary flex-1 py-4 text-lg">
                  Oluştur
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowAddModal(false);
                    setCustomerSearch('');
                    setShowCustomerDropdown(false);
                  }}
                  className="btn btn-ghost flex-1 py-4 text-lg"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {showDetailModal && selectedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-secondary p-8 rounded-2xl w-full max-w-2xl shadow-2xl border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-primary">{selectedTask.title}</h3>
              <button onClick={() => setShowDetailModal(false)} className="text-muted hover:text-primary">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="card bg-white/5">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar size={20} className="text-accent-primary" />
                    <p className="text-sm text-muted">Oluşturulma Tarihi</p>
                  </div>
                  <p className="text-lg font-medium text-primary">
                    {format(parseISO(selectedTask.createdAt), 'd MMMM yyyy, HH:mm', { locale: tr })}
                  </p>
                </div>

                {selectedTask.dueDate && (
                  <div className="card bg-white/5">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock size={20} className="text-accent-secondary" />
                      <p className="text-sm text-muted">Bitiş Tarihi</p>
                    </div>
                    <p className="text-lg font-medium text-primary">
                      {format(parseISO(selectedTask.dueDate), 'd MMMM yyyy', { locale: tr })}
                    </p>
                  </div>
                )}
              </div>

              {selectedTask.customerName && (
                <div className="card bg-white/5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                      {selectedTask.customerName.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-sm text-muted">Atanan Müşteri</p>
                  </div>
                  <p className="text-lg font-medium text-primary">
                    {selectedTask.customerName}
                  </p>
                </div>
              )}

              <div className="card bg-white/5">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-3 h-3 rounded-full ${selectedTask.completed ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <p className="text-sm text-muted">Durum</p>
                </div>
                <p className="text-lg font-medium text-primary">
                  {selectedTask.completed ? 'Tamamlandı' : 'Yapılacak'}
                </p>
              </div>

              {selectedTask.notes && (
                <div className="card bg-white/5">
                  <div className="flex items-center gap-3 mb-3">
                    <FileText size={20} className="text-muted" />
                    <p className="text-sm text-muted">Notlar</p>
                  </div>
                  <p className="text-base text-secondary whitespace-pre-wrap">
                    {selectedTask.notes}
                  </p>
                </div>
              )}

              <button 
                onClick={() => setShowDetailModal(false)}
                className="btn btn-primary w-full py-4 text-lg"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksPage;
