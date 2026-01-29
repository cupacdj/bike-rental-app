import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, Save, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { profileApi } from '../services/api';

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface UsernameFormData {
  newUsername: string;
  password: string;
}

function Settings(): JSX.Element {
  const { admin, updateAdminInfo } = useAuth();
  const { showSuccess, showError } = useToast();
  
  // Password form state
  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Username form state
  const [usernameForm, setUsernameForm] = useState<UsernameFormData>({
    newUsername: admin?.username || '',
    password: ''
  });
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [showUsernamePassword, setShowUsernamePassword] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showError('Nova lozinka i potvrda se ne poklapaju');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      showError('Nova lozinka mora imati najmanje 6 karaktera');
      return;
    }
    
    setPasswordLoading(true);
    try {
      await profileApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      showSuccess('Lozinka uspešno promenjena');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Greška pri promeni lozinke';
      showError(errorMessage);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleUsernameChange = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!usernameForm.newUsername.trim()) {
      showError('Korisničko ime je obavezno');
      return;
    }
    
    if (usernameForm.newUsername.length < 3) {
      showError('Korisničko ime mora imati najmanje 3 karaktera');
      return;
    }
    
    if (!usernameForm.password) {
      showError('Unesite trenutnu lozinku za potvrdu');
      return;
    }
    
    setUsernameLoading(true);
    try {
      const response = await profileApi.changeUsername({
        newUsername: usernameForm.newUsername,
        password: usernameForm.password
      });
      
      // Update local admin info
      if (response.admin) {
        updateAdminInfo(response.admin);
      }
      
      showSuccess('Korisničko ime uspešno promenjeno');
      setUsernameForm(prev => ({ ...prev, password: '' }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Greška pri promeni korisničkog imena';
      showError(errorMessage);
    } finally {
      setUsernameLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Podešavanja</h1>
        <p className="text-slate-400 mt-1">Upravljajte vašim nalogom i sigurnošću</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Change Username Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/15 flex items-center justify-center">
              <User size={24} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Promeni korisničko ime</h2>
              <p className="text-sm text-slate-400">Trenutno: {admin?.username}</p>
            </div>
          </div>
          
          <form onSubmit={handleUsernameChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Novo korisničko ime
              </label>
              <input
                type="text"
                value={usernameForm.newUsername}
                onChange={(e) => setUsernameForm(prev => ({ ...prev, newUsername: e.target.value }))}
                className="input w-full"
                placeholder="Unesite novo korisničko ime"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Trenutna lozinka (za potvrdu)
              </label>
              <div className="relative">
                <input
                  type={showUsernamePassword ? 'text' : 'password'}
                  value={usernameForm.password}
                  onChange={(e) => setUsernameForm(prev => ({ ...prev, password: e.target.value }))}
                  className="input w-full pr-10"
                  placeholder="Unesite vašu lozinku"
                />
                <button
                  type="button"
                  onClick={() => setShowUsernamePassword(!showUsernamePassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showUsernamePassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={usernameLoading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {usernameLoading ? (
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <Save size={18} />
                  Sačuvaj korisničko ime
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Change Password Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <Lock size={24} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Promeni lozinku</h2>
              <p className="text-sm text-slate-400">Ažurirajte vašu lozinku</p>
            </div>
          </div>
          
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Trenutna lozinka
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="input w-full pr-10"
                  placeholder="Unesite trenutnu lozinku"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nova lozinka
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="input w-full pr-10"
                  placeholder="Unesite novu lozinku"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Potvrdi novu lozinku
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="input w-full pr-10"
                  placeholder="Ponovite novu lozinku"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={passwordLoading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {passwordLoading ? (
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <Save size={18} />
                  Sačuvaj lozinku
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
      
      {/* Account Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card"
      >
        <h2 className="text-lg font-semibold text-white mb-4">Informacije o nalogu</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-slate-800/50">
            <p className="text-sm text-slate-400 mb-1">Ime i prezime</p>
            <p className="text-white font-medium">{admin?.firstName} {admin?.lastName}</p>
          </div>
          <div className="p-4 rounded-lg bg-slate-800/50">
            <p className="text-sm text-slate-400 mb-1">Korisničko ime</p>
            <p className="text-white font-medium">{admin?.username}</p>
          </div>
          <div className="p-4 rounded-lg bg-slate-800/50">
            <p className="text-sm text-slate-400 mb-1">Nalog kreiran</p>
            <p className="text-white font-medium">
              {admin?.createdAt ? new Date(admin.createdAt).toLocaleDateString('sr-RS') : '-'}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default Settings;
