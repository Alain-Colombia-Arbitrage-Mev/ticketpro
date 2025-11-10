import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useRouter } from "../hooks/useRouter";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Lock, Mail, User, Wand2, Check, KeyRound } from "lucide-react";
import { motion } from "motion/react";
import logo2 from "../assets/images/logo2.svg";

export function LoginPage() {
  const { signIn, signUp, sendMagicLink, forgotPassword } = useAuth();
  const { navigate } = useRouter();
  
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [magicLinkEmail, setMagicLinkEmail] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetLinkSent, setResetLinkSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Normalizar email (trim y lowercase)
      const normalizedEmail = loginEmail.trim().toLowerCase();
      
      if (!normalizedEmail || !loginPassword) {
        setError("Por favor, completa todos los campos");
        setLoading(false);
        return;
      }

      console.log('🔐 Iniciando sesión con:', normalizedEmail);
      await signIn(normalizedEmail, loginPassword);
      
      console.log('✅ Login exitoso, redirigiendo...');
      navigate("home");
    } catch (err: any) {
      console.error('❌ Error en handleLogin:', err);
      // Mostrar mensaje de error más descriptivo
      const errorMessage = err.message || err.error?.message || "Error al iniciar sesión";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signUp(signupEmail, signupPassword, signupName);
      navigate("home");
    } catch (err: any) {
      setError(err.message || "Error al crear cuenta");
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMagicLinkSent(false);
    setLoading(true);

    try {
      await sendMagicLink(magicLinkEmail);
      setMagicLinkSent(true);
      setError("");
    } catch (err: any) {
      setError(err.message || "Error al enviar el enlace mágico");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResetLinkSent(false);
    setLoading(true);

    try {
      await forgotPassword(resetEmail);
      setResetLinkSent(true);
      setError("");
    } catch (err: any) {
      setError(err.message || "Error al enviar el enlace de recuperación");
    } finally {
      setLoading(false);
    }
  };

  const openForgotPassword = () => {
    setShowForgotPassword(true);
    setResetEmail(loginEmail);
    setResetLinkSent(false);
    setError("");
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 text-center">
            <div className="mb-6 flex justify-center">
              <img 
                src={logo2} 
                alt="vetlix.com" 
                className="h-12 w-auto object-contain"
              />
            </div>
            <h1 className="mb-2 text-3xl font-bold text-white">Bienvenido a vetlix</h1>
            <p className="text-gray-400">Ingresa o crea tu cuenta para continuar</p>
          </div>

          <Card className="border-gray-800 bg-gray-900 p-6 shadow-xl">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="mb-6 grid w-full grid-cols-3 bg-gray-800/30 border border-gray-700 h-auto p-1">
                <TabsTrigger 
                  value="login"
                  className="data-[state=active]:bg-black data-[state=active]:text-white text-gray-400 hover:text-gray-200 data-[state=active]:border data-[state=active]:border-gray-700 transition-all py-2.5 font-medium"
                >
                  Contraseña
                </TabsTrigger>
                <TabsTrigger 
                  value="magic"
                  className="data-[state=active]:bg-black data-[state=active]:text-white text-gray-400 hover:text-gray-200 data-[state=active]:border data-[state=active]:border-gray-700 transition-all py-2.5 font-medium"
                >
                  Magic Link
                </TabsTrigger>
                <TabsTrigger 
                  value="signup"
                  className="data-[state=active]:bg-black data-[state=active]:text-white text-gray-400 hover:text-gray-200 data-[state=active]:border data-[state=active]:border-gray-700 transition-all py-2.5 font-medium"
                >
                  Registrarse
                </TabsTrigger>
              </TabsList>

              {/* Magic Link Tab */}
              <TabsContent value="magic">
                {!magicLinkSent ? (
                  <form onSubmit={handleMagicLink} className="space-y-4">
                    <div className="rounded-lg border border-purple-800 bg-purple-900/20 p-4 mb-4">
                      <div className="flex items-start gap-3">
                        <Wand2 className="h-5 w-5 flex-shrink-0 text-purple-400" />
                        <div>
                          <p className="font-medium text-purple-300">Ingreso sin contraseña</p>
                          <p className="text-sm text-purple-400">
                            Recibe un enlace mágico en tu email para acceder instantáneamente
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="magic-email">Correo Electrónico</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          id="magic-email"
                          type="email"
                          placeholder="tu@email.com"
                          className="pl-10"
                          value={magicLinkEmail}
                          onChange={(e) => setMagicLinkEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="rounded-lg bg-red-900/20 border border-red-800 p-3 text-sm text-red-400">
                        {error}
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      disabled={loading}
                    >
                      {loading ? "Enviando..." : "Enviar Enlace Mágico ✨"}
                    </Button>

                    <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
                      Te enviaremos un enlace único que te permitirá ingresar sin contraseña
                    </p>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-green-800 bg-green-900/20 p-6 text-center">
                      <div className="flex justify-center mb-4">
                        <div className="h-16 w-16 rounded-full bg-green-900/30 flex items-center justify-center">
                          <Check className="h-8 w-8 text-green-400" />
                        </div>
                      </div>
                      <h3 className="font-semibold text-green-300 mb-2">
                        ¡Enlace Mágico Enviado! 📧
                      </h3>
                      <p className="text-sm text-green-400 mb-4">
                        Hemos enviado un enlace de acceso a <strong className="text-green-300">{magicLinkEmail}</strong>
                      </p>
                      <p className="text-xs text-green-400">
                        Revisa tu bandeja de entrada y haz clic en el enlace para ingresar automáticamente
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setMagicLinkSent(false);
                        setMagicLinkEmail("");
                      }}
                    >
                      Enviar otro enlace
                    </Button>

                    <div className="rounded-lg border border-yellow-800 bg-yellow-900/20 p-3 text-xs text-yellow-300">
                      <strong>Nota:</strong> Para que funcione el envío de emails, debes configurar el servicio SMTP en Supabase. 
                      Mientras tanto, este es un sistema de demostración.
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Login Tab */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Correo Electrónico</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="tu@email.com"
                        className="pl-10"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password">Contraseña</Label>
                      <button
                        type="button"
                        onClick={openForgotPassword}
                        className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-lg bg-red-900/20 border border-red-800 p-3 text-sm text-red-400">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? "Ingresando..." : "Iniciar Sesión"}
                  </Button>
                </form>
              </TabsContent>

              {/* Signup Tab */}
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nombre Completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Juan Pérez"
                        className="pl-10"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Correo Electrónico</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="tu@email.com"
                        className="pl-10"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Mínimo 6 caracteres</p>
                  </div>

                  {error && (
                    <div className="rounded-lg bg-red-900/20 border border-red-800 p-3 text-sm text-red-400">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? "Creando cuenta..." : "Crear Cuenta"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </Card>

          <p className="mt-4 text-center text-sm text-gray-400">
            Al continuar, aceptas nuestros términos y condiciones
          </p>
        </motion.div>

        {/* Forgot Password Dialog */}
        <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-blue-600" />
                Recuperar Contraseña
              </DialogTitle>
              <DialogDescription>
                Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
              </DialogDescription>
            </DialogHeader>
            {!resetLinkSent ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Correo Electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="tu@email.com"
                      className="pl-10"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowForgotPassword(false)}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={loading}
                  >
                    {loading ? "Enviando..." : "Enviar Enlace"}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-green-800 bg-green-900/20 p-6 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="h-16 w-16 rounded-full bg-green-900/30 flex items-center justify-center">
                      <Check className="h-8 w-8 text-green-400" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-green-300 mb-2">
                    ¡Enlace Enviado! ✅
                  </h3>
                  <p className="text-sm text-green-400 mb-4">
                    Hemos enviado un enlace de recuperación a <strong className="text-green-300">{resetEmail}</strong>
                  </p>
                  <p className="text-xs text-green-400">
                    Revisa tu bandeja de entrada y haz clic en el enlace para restablecer tu contraseña
                  </p>
                </div>

                <div className="rounded-lg border border-yellow-800 bg-yellow-900/20 p-3 text-xs text-yellow-300">
                  <strong>Nota:</strong> Para que funcione el envío de emails, debes configurar el servicio SMTP en Supabase.
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowForgotPassword(false)}
                >
                  Cerrar
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
