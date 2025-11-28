import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { User, Mail, Phone, Lock, Save, CheckCircle } from 'lucide-react';

const Settings = () => {
  const { currentUser, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const updateData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone
      };

      const response = await api.updateUser(currentUser.id, updateData);
      
      if (response.success) {
        updateProfile(response.user);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(response.message || 'Güncelleme başarısız');
      }
    } catch (err) {
      setError('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Yeni şifreler eşleşmiyor');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır');
      return;
    }

    setLoading(true);

    try {
      const response = await api.updateUser(currentUser.id, {
        password: formData.newPassword
      });
      
      if (response.success) {
        setSuccess(true);
        setFormData({
          ...formData,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(response.message || 'Şifre değiştirme başarısız');
      }
    } catch (err) {
      setError('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-primary">Ayarlar</h2>
      </div>

      {success && (
        <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <CheckCircle size={20} className="text-green-400" />
          <p className="text-green-200">Değişiklikler başarıyla kaydedildi!</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
          <p className="text-red-200">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Information */}
        <div className="card">
          <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-3">
            <User size={24} className="text-accent-primary" />
            Profil Bilgileri
          </h3>

          <form onSubmit={handleProfileUpdate} className="space-y-6">
            <div>
              <label className="block text-base font-medium text-secondary mb-2">Ad Soyad</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
                <input
                  type="text"
                  className="input pl-12 py-3 text-lg"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-base font-medium text-secondary mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
                <input
                  type="email"
                  className="input pl-12 py-3 text-lg"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-base font-medium text-secondary mb-2">Telefon</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
                <input
                  type="tel"
                  className="input pl-12 py-3 text-lg"
                  value={formData.phone}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^[+]?\d*$/.test(val) && val.length <= 13) {
                      setFormData({ ...formData, phone: val });
                    }
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-4 text-lg"
            >
              <Save size={20} />
              Profili Güncelle
            </button>
          </form>
        </div>

        {/* Password Change */}
        <div className="card">
          <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-3">
            <Lock size={24} className="text-accent-primary" />
            Şifre Değiştir
          </h3>

          <form onSubmit={handlePasswordChange} className="space-y-6">
            <div>
              <label className="block text-base font-medium text-secondary mb-2">Yeni Şifre</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
                <input
                  type="password"
                  className="input pl-12 py-3 text-lg"
                  placeholder="En az 6 karakter"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-base font-medium text-secondary mb-2">Yeni Şifre (Tekrar)</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
                <input
                  type="password"
                  className="input pl-12 py-3 text-lg"
                  placeholder="Şifrenizi tekrar girin"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !formData.newPassword || !formData.confirmPassword}
              className="btn btn-primary w-full py-4 text-lg"
            >
              <Lock size={20} />
              Şifreyi Değiştir
            </button>
          </form>
        </div>
      </div>

      {/* User Info Card */}
      <div className="card">
        <h3 className="text-xl font-bold text-primary mb-4">Hesap Bilgileri</h3>
        <div className="grid grid-cols-2 gap-4 text-base">
          <div>
            <p className="text-muted">Kullanıcı Adı</p>
            <p className="text-primary font-medium">{currentUser?.username}</p>
          </div>
          <div>
            <p className="text-muted">Kayıt Tarihi</p>
            <p className="text-primary font-medium">
              {currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('tr-TR') : '-'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
