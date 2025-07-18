import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import BottomNavigation from '../components/BottomNavigation';
import { Settings as SettingsIcon, User, Bell, Shield, Palette, Globe, Phone, CreditCard, LogOut, Moon, Sun, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { getAuth, signOut, updateProfile } from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

const Settings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState({
    push: true,
    email: true,
    sms: false,
    marketing: false
  });
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    location: ''
  });
  const { toast } = useToast();
  const auth = getAuth();
  const user = auth.currentUser;

  // Cargar configuraciones del usuario
  useEffect(() => {
    const loadUserSettings = async () => {
      try {
        if (!user) {
          navigate('/auth');
          return;
        }

        // Cargar datos del perfil
        setProfile({
          name: user.displayName || '',
          email: user.email || '',
          phone: user.phoneNumber || '',
          location: ''
        });

        // Cargar configuración guardada en Firestore
        const userSettingsRef = doc(db, "userSettings", user.uid);
        const settingsSnap = await getDoc(userSettingsRef);

        if (settingsSnap.exists()) {
          const data = settingsSnap.data();
          
          // Cargar tema
          if (data.darkMode !== undefined) {
            setDarkMode(data.darkMode);
            document.documentElement.classList.toggle('dark', data.darkMode);
          }
          
          // Cargar notificaciones
          if (data.notifications) {
            setNotifications(data.notifications);
          }
          
          // Cargar información adicional del perfil
          if (data.location) {
            setProfile(prev => ({ ...prev, location: data.location }));
          }
          
          if (data.phone) {
            setProfile(prev => ({ ...prev, phone: data.phone }));
          }
        } else {
          // Si no existen configuraciones, crear documento con valores predeterminados
          await setDoc(userSettingsRef, {
            darkMode: false,
            notifications: {
              push: true,
              email: true,
              sms: false,
              marketing: false
            },
            createdAt: new Date()
          });
        }
      } catch (error) {
        console.error("Error al cargar configuraciones:", error);
        toast({
          title: "Error",
          description: "No pudimos cargar tus configuraciones",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserSettings();
  }, [user, navigate, toast]);

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      // Actualizar en Firebase Auth
      await updateProfile(user, {
        displayName: profile.name
      });

      // Guardar en Firestore
      const userSettingsRef = doc(db, "userSettings", user.uid);
      await updateDoc(userSettingsRef, {
        location: profile.location,
        phone: profile.phone,
        updatedAt: new Date()
      });

      toast({
        title: "Perfil actualizado",
        description: "Tus datos han sido guardados correctamente",
      });
    } catch (error) {
      console.error("Error al guardar el perfil:", error);
      toast({
        title: "Error",
        description: "No pudimos guardar tus datos",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente",
      });
      navigate('/');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      toast({
        title: "Error",
        description: "No pudimos cerrar tu sesión",
        variant: "destructive",
      });
    }
  };

  const toggleDarkMode = async () => {
    if (!user) return;
    
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    document.documentElement.classList.toggle('dark', newDarkMode);
    
    try {
      // Guardar preferencia en Firestore
      const userSettingsRef = doc(db, "userSettings", user.uid);
      await updateDoc(userSettingsRef, {
        darkMode: newDarkMode,
        updatedAt: new Date()
      });
      
      toast({
        title: newDarkMode ? "Tema oscuro activado" : "Tema claro activado",
        description: "El cambio se ha aplicado correctamente",
      });
    } catch (error) {
      console.error("Error al guardar el tema:", error);
    }
  };

  const updateNotificationPreference = async (type: string, checked: boolean) => {
    if (!user) return;
    
    // Actualizar estado local
    const updatedNotifications = { ...notifications, [type]: checked };
    setNotifications(updatedNotifications);
    
    try {
      // Guardar en Firestore
      const userSettingsRef = doc(db, "userSettings", user.uid);
      await updateDoc(userSettingsRef, {
        notifications: updatedNotifications,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error("Error al guardar preferencias de notificaciones:", error);
      toast({
        title: "Error",
        description: "No pudimos guardar tus preferencias",
        variant: "destructive",
      });
    }
  };

  const settingsSections = [
    {
      title: 'Cuenta',
      icon: User,
      items: [
        { label: 'Información Personal', action: 'profile' },
        { label: 'Cambiar Contraseña', action: 'password' },
        { label: 'Verificación de Cuenta', action: 'verification' }
      ]
    },
    {
      title: 'Notificaciones',
      icon: Bell,
      items: [
        { label: 'Notificaciones Push', action: 'notifications' },
        { label: 'Preferencias de Email', action: 'email' },
        { label: 'Alertas de Precios', action: 'alerts' }
      ]
    },
    {
      title: 'Privacidad y Seguridad',
      icon: Shield,
      items: [
        { label: 'Configuración de Privacidad', action: 'privacy' },
        { label: 'Autenticación de Dos Factores', action: '2fa' },
        { label: 'Dispositivos Vinculados', action: 'devices' }
      ]
    },
    {
      title: 'Apariencia',
      icon: Palette,
      items: [
        { label: 'Tema de la Aplicación', action: 'theme' },
        { label: 'Tamaño de Fuente', action: 'font' },
        { label: 'Idioma', action: 'language' }
      ]
    }
  ];

  // Renderizado condicional para estado de carga
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="pb-20 md:pb-8">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600">Cargando configuración...</p>
            </div>
          </div>
        </main>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <Navbar />
      
      <main className="pb-20 md:pb-8">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Configuración
            </h1>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Personaliza tu experiencia en Ferry
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className={darkMode ? 'bg-gray-800 border-gray-700' : ''}>
                <CardHeader>
                  <CardTitle className={`flex items-center space-x-2 ${darkMode ? 'text-white' : ''}`}>
                    <User className="w-5 h-5" />
                    <span>Información Personal</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Nombre Completo
                      </label>
                      <Input
                        value={profile.name}
                        onChange={(e) => setProfile({...profile, name: e.target.value})}
                        className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Email
                      </label>
                      <Input
                        value={profile.email}
                        onChange={(e) => setProfile({...profile, email: e.target.value})}
                        className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Teléfono
                      </label>
                      <Input
                        value={profile.phone}
                        onChange={(e) => setProfile({...profile, phone: e.target.value})}
                        className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Ubicación
                      </label>
                      <Input
                        value={profile.location}
                        onChange={(e) => setProfile({...profile, location: e.target.value})}
                        className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                      />
                    </div>
                  </div>
                  <Button onClick={handleSaveProfile} className="w-full md:w-auto">
                    Guardar Cambios
                  </Button>
                </CardContent>
              </Card>

              <Card className={darkMode ? 'bg-gray-800 border-gray-700' : ''}>
                <CardHeader>
                  <CardTitle className={`flex items-center space-x-2 ${darkMode ? 'text-white' : ''}`}>
                    <Bell className="w-5 h-5" />
                    <span>Notificaciones</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Notificaciones Push
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Recibe notificaciones en tu dispositivo
                      </p>
                    </div>
                    <Switch
                      checked={notifications.push}
                      onCheckedChange={(checked) => updateNotificationPreference('push', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Notificaciones por Email
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Recibe actualizaciones por correo
                      </p>
                    </div>
                    <Switch
                      checked={notifications.email}
                      onCheckedChange={(checked) => updateNotificationPreference('email', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        SMS
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Recibe mensajes de texto importantes
                      </p>
                    </div>
                    <Switch
                      checked={notifications.sms}
                      onCheckedChange={(checked) => updateNotificationPreference('sms', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Marketing
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Ofertas y promociones especiales
                      </p>
                    </div>
                    <Switch
                      checked={notifications.marketing}
                      onCheckedChange={(checked) => updateNotificationPreference('marketing', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className={darkMode ? 'bg-gray-800 border-gray-700' : ''}>
                <CardHeader>
                  <CardTitle className={`flex items-center space-x-2 ${darkMode ? 'text-white' : ''}`}>
                    <Palette className="w-5 h-5" />
                    <span>Apariencia</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {darkMode ? (
                        <Moon className="w-5 h-5 text-gray-400" />
                      ) : (
                        <Sun className="w-5 h-5 text-yellow-500" />
                      )}
                      <div>
                        <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {darkMode ? 'Modo Oscuro' : 'Modo Claro'}
                        </p>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {darkMode ? 'Interfaz oscura para tus ojos' : 'Interfaz clara y brillante'}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={darkMode}
                      onCheckedChange={toggleDarkMode}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className={darkMode ? 'bg-gray-800 border-gray-700' : ''}>
                <CardHeader>
                  <CardTitle className={`flex items-center space-x-2 ${darkMode ? 'text-white' : ''}`}>
                    <SettingsIcon className="w-5 h-5" />
                    <span>Acceso Rápido</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {settingsSections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <div key={section.title}>
                        <div className={`flex items-center space-x-2 mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          <Icon className="w-4 h-4" />
                          <span className="font-medium text-sm">{section.title}</span>
                        </div>
                        <div className="ml-6 space-y-1">
                          {section.items.map((item) => (
                            <button
                              key={item.label}
                              className={`w-full text-left p-2 rounded text-sm hover:bg-opacity-50 transition-colors ${
                                darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span>{item.label}</span>
                                <ChevronRight className="w-3 h-3" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card className={darkMode ? 'bg-gray-800 border-gray-700' : ''}>
                <CardHeader>
                  <CardTitle className={`${darkMode ? 'text-white' : ''}`}>
                    Información de la Cuenta
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Miembro desde
                    </span>
                    <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Enero 2024
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Pedidos realizados
                    </span>
                    <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      12
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Puntos acumulados
                    </span>
                    <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      2,450
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className={darkMode ? 'bg-gray-800 border-gray-700' : ''}>
                <CardContent className="pt-6">
                  <Button
                    onClick={handleLogout}
                    variant="destructive"
                    className="w-full"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar Sesión
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Settings;
