import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, isToday 
} from 'date-fns';
import { tr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, X, User, Phone, Search, Check, Trash2 } from 'lucide-react';

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Form State
  const [formData, setFormData] = useState({
    contactId: '',
    contactName: '',
    contactPhone: '',
    time: '09:00',
    service: '',
    amount: '',
    paymentType: 'cash',
    isNewContact: false
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showContactResults, setShowContactResults] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    loadData();
    // Close search results when clicking outside
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowContactResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = async () => {
    const [apps, conts] = await Promise.all([
      api.getAppointments(),
      api.getContacts()
    ]);
    setAppointments(apps);
    setContacts(conts);
  };

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
  });

  const handleDateClick = (day) => {
    setSelectedDate(day);
    setFormData({
      contactId: '',
      contactName: '',
      contactPhone: '',
      time: '09:00',
      service: '',
      amount: '',
      paymentType: 'cash',
      isNewContact: false
    });
    setSearchTerm('');
    setShowModal(true);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    // Allow letters, spaces, and standard punctuation, but NO numbers
    if (!/\d/.test(value)) {
      setSearchTerm(value);
      setFormData(prev => ({ ...prev, contactName: value, contactId: '', isNewContact: true }));
      setShowContactResults(true);
    }
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    // Allow optional + at start, then numbers. Max 13 chars.
    if (/^[+]?\d*$/.test(value) && value.length <= 13) {
      setFormData(prev => ({ ...prev, contactPhone: value }));
    }
  };

  const selectContact = (contact) => {
    setFormData(prev => ({
      ...prev,
      contactId: contact.id,
      contactName: contact.name,
      contactPhone: contact.phone,
      isNewContact: false
    }));
    setSearchTerm(contact.name);
    setShowContactResults(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount) return;

    let finalContactId = formData.contactId;
    let finalContactName = formData.contactName;
    let finalContactPhone = formData.contactPhone;

    // Create new contact if needed
    if (formData.isNewContact && !formData.contactId) {
      if (!formData.contactName || !formData.contactPhone) {
        alert('Yeni müşteri için Ad ve Telefon zorunludur.');
        return;
      }

      if (formData.contactPhone.length < 10) {
        alert('Telefon numarası en az 10 haneli olmalıdır.');
        return;
      }

      // Check for duplicates
      const existingContact = contacts.find(c => 
        c.name.toLowerCase() === formData.contactName.toLowerCase() || 
        c.phone === formData.contactPhone
      );

      if (existingContact) {
        if (existingContact.name.toLowerCase() === formData.contactName.toLowerCase()) {
           alert('Bu isimde bir müşteri zaten kayıtlı. Lütfen listeden seçiniz.');
        } else {
           alert('Bu telefon numarası ile kayıtlı bir müşteri zaten var.');
        }
        return;
      }

      try {
        const newContact = await api.createContact({
          name: formData.contactName,
          phone: formData.contactPhone
        });
        finalContactId = newContact.id;
        // Update local contacts list
        setContacts(prev => [...prev, newContact]);
      } catch (error) {
        console.error('Error creating contact:', error);
        return;
      }
    } else if (!finalContactId) {
       alert('Lütfen bir müşteri seçin veya yeni oluşturun.');
       return;
    }

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const dateTime = `${dateStr}T${formData.time}:00`;

    const newAppointment = {
      contactId: finalContactId,
      contactName: finalContactName,
      contactPhone: finalContactPhone,
      time: formData.time,
      service: formData.service,
      amount: formData.amount,
      paymentType: formData.paymentType,
      date: dateTime
    };

    try {
      await api.createAppointment(newAppointment);
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Error creating appointment:', error);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation(); // Prevent triggering date click
    if (!window.confirm('Randevuyu iptal etmek istediğinize emin misiniz?')) return;
    try {
      await api.deleteAppointment(id);
      loadData();
    } catch (error) {
      console.error('Error deleting appointment:', error);
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-bold text-primary capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: tr })}
          </h2>
          <div className="flex gap-2">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-white/5 rounded-xl text-secondary border border-white/5">
              <ChevronLeft size={24} />
            </button>
            <button onClick={handleToday} className="px-4 py-2 hover:bg-white/5 rounded-xl text-primary font-medium border border-white/5">
              Bugün
            </button>
            <button onClick={handleNextMonth} className="p-2 hover:bg-white/5 rounded-xl text-secondary border border-white/5">
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 bg-secondary rounded-2xl border border-white/5 flex flex-col overflow-hidden shadow-2xl">
        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-white/5 bg-white/[0.02]">
          {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(d => (
            <div key={d} className="py-4 text-center font-semibold text-muted uppercase tracking-wider text-sm">
              {d}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 flex-1 auto-rows-fr">
          {days.map((day, idx) => {
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isTodayDate = isToday(day);
            const isPastDate = day < new Date() && !isTodayDate;
            const dayApps = appointments.filter(app => isSameDay(parseISO(app.date), day));
            
            return (
              <div 
                key={idx}
                onClick={() => handleDateClick(day)}
                className={`
                  relative p-2 border-r border-b border-white/5 transition-colors cursor-pointer group
                  ${!isCurrentMonth ? 'bg-black/20' : isPastDate ? 'bg-black/40 opacity-60' : 'hover:bg-white/[0.02]'}
                  ${isSelected ? 'bg-primary/5' : ''}
                `}
              >
                <div className="flex justify-center mb-2">
                  <span className={`
                    w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium
                    ${isTodayDate ? 'bg-accent-primary text-white shadow-lg shadow-indigo-500/30' : isPastDate ? 'text-muted/50' : 'text-muted group-hover:text-primary'}
                  `}>
                    {format(day, 'd')}
                  </span>
                </div>

                <div className="space-y-1.5 overflow-y-auto max-h-[100px] custom-scrollbar">
                  {dayApps.map(app => (
                    <div 
                      key={app.id}
                      className="text-xs p-1.5 rounded bg-white/5 border border-white/5 hover:border-primary/30 hover:bg-white/10 transition-colors flex items-center gap-1 group"
                    >
                      <span className="text-accent-primary font-bold">{app.time}</span>
                      <span className="text-primary truncate flex-1">{app.contactName}</span>
                      <button
                        onClick={(e) => handleDelete(e, app.id)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-500/20 rounded transition-opacity"
                        title="Sil"
                      >
                        <Trash2 size={12} className="text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Unified Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-secondary p-8 rounded-2xl w-full max-w-lg shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-primary">Randevu Oluştur</h3>
                <p className="text-muted">{format(selectedDate, 'd MMMM yyyy', { locale: tr })}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-muted hover:text-primary">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Search / Add Section */}
              <div className="relative" ref={searchRef}>
                <label className="block text-base font-medium text-secondary mb-2">Müşteri</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
                  <input 
                    type="text"
                    className="input pl-12 py-3 text-lg"
                    placeholder="Müşteri adı ara veya yaz..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onFocus={() => setShowContactResults(true)}
                  />
                  {formData.contactId && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500">
                      <Check size={20} />
                    </div>
                  )}
                </div>

                {/* Search Results Dropdown */}
                {showContactResults && searchTerm && (
                  <div className="absolute z-10 w-full mt-2 bg-tertiary border border-white/10 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                    {filteredContacts.length > 0 ? (
                      filteredContacts.map(c => (
                        <div 
                          key={c.id}
                          onClick={() => selectContact(c)}
                          className="p-3 hover:bg-white/5 cursor-pointer flex items-center justify-between border-b border-white/5 last:border-0"
                        >
                          <span className="text-primary font-medium">{c.name}</span>
                          <span className="text-sm text-muted">{c.phone}</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-muted">
                        <p>Kayıtlı müşteri bulunamadı.</p>
                        <p className="text-xs mt-1">Devam ederek yeni kayıt oluşturabilirsiniz.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* New Contact Phone Input (Only if new) */}
              {formData.isNewContact && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="block text-base font-medium text-accent-primary mb-2">Yeni Müşteri Telefonu</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
                    <input 
                      type="tel"
                      className="input pl-12 py-3 text-lg border-accent-primary/50"
                      placeholder="5XX XXX XX XX"
                      value={formData.contactPhone}
                      onChange={handlePhoneChange}
                      required={formData.isNewContact}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-base font-medium text-secondary mb-2">Saat</label>
                  <input 
                    type="time" 
                    className="input py-3 text-lg"
                    value={formData.time}
                    onChange={e => setFormData({...formData, time: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-base font-medium text-secondary mb-2">Tutar (₺)</label>
                  <input 
                    type="number" 
                    className="input py-3 text-lg"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={e => setFormData({...formData, amount: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-base font-medium text-secondary mb-2">İşlem / Hizmet</label>
                <input 
                  type="text" 
                  className="input py-3 text-lg"
                  placeholder="Örn: Saç Kesimi"
                  value={formData.service}
                  onChange={e => setFormData({...formData, service: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-base font-medium text-secondary mb-2">Ödeme Tipi</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, paymentType: 'cash'})}
                    className={`p-4 rounded-xl border text-base font-medium transition-colors ${
                      formData.paymentType === 'cash' 
                        ? 'bg-green-500/20 border-green-500 text-green-500' 
                        : 'border-white/10 text-muted hover:bg-white/5'
                    }`}
                  >
                    Nakit
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, paymentType: 'card'})}
                    className={`p-4 rounded-xl border text-base font-medium transition-colors ${
                      formData.paymentType === 'card' 
                        ? 'bg-purple-500/20 border-purple-500 text-purple-500' 
                        : 'border-white/10 text-muted hover:bg-white/5'
                    }`}
                  >
                    Kredi Kartı
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  className="btn btn-primary w-full py-4 text-lg shadow-lg shadow-indigo-500/20"
                >
                  Randevu Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
