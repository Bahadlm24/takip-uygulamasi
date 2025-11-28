import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { UserPlus, Trash2, Phone, Search } from 'lucide-react';

const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const data = await api.getContacts();
      setContacts(data);
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    if (formData.phone.length < 10) {
      alert('Telefon numarası en az 10 haneli olmalıdır.');
      return;
    }

    try {
      await api.createContact(formData);
      setFormData({ name: '', phone: '' });
      loadContacts();
    } catch (error) {
      console.error('Error creating contact:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu kişiyi silmek istediğinize emin misiniz?')) return;
    try {
      await api.deleteContact(id);
      loadContacts();
    } catch (error) {
      console.error('Error deleting contact:', error);
    }
  };

  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-primary">Kişiler</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Contact Form */}
        <div className="card h-fit space-y-6">
          <h3 className="text-xl font-bold text-primary flex items-center gap-3">
            <UserPlus size={24} className="text-accent-primary" />
            Yeni Kişi Ekle
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-base font-medium text-secondary mb-2">Ad Soyad</label>
              <input
                type="text"
                className="input"
                placeholder="Örn: Ahmet Yılmaz"
                value={formData.name}
                onChange={(e) => {
                  const val = e.target.value;
                  // Allow letters, spaces, and standard punctuation, but NO numbers
                  if (!/\d/.test(val)) {
                    setFormData({ ...formData, name: val });
                  }
                }}
              />
            </div>
            <div>
              <label className="block text-base font-medium text-secondary mb-2">Telefon</label>
              <input
                type="tel"
                className="input"
                placeholder="5XX XXX XX XX"
                value={formData.phone}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^[+]?\d*$/.test(val) && val.length <= 13) {
                    setFormData({ ...formData, phone: val });
                  }
                }}
              />
            </div>
            <button type="submit" className="btn btn-primary w-full py-4 text-lg">
              Kaydet
            </button>
          </form>
        </div>

        {/* Contacts List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={24} />
            <input 
              type="text" 
              className="input pl-14 py-4 text-lg" 
              placeholder="Kişi ara..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredContacts.map(contact => (
              <div key={contact.id} className="card flex items-center justify-between p-6 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-lg text-primary">{contact.name}</p>
                    <div className="flex items-center gap-2 text-base text-muted">
                      <Phone size={16} />
                      {contact.phone}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(contact.id)}
                  className="p-3 text-muted hover:text-danger transition-colors"
                >
                  <Trash2 size={24} />
                </button>
              </div>
            ))}
            
            {filteredContacts.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted">
                Kayıtlı kişi bulunamadı.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contacts;
